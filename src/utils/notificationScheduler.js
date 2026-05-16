import db from '../config/database.js';
import webpush from 'web-push';

// Configurar VAPID keys
webpush.setVapidDetails(
  'mailto:contato@fattax.srv.br',
  'BFKeq88NfXqpO39I-imw2y0_U_glELzqiL2hevAQxlWP1ZXscrgi04xiBj1fdHuTCtvguzTyly-raEN4vkVRueM',
  'onZreQ5dBXTIWcLetaGKvu9rDdaeBdCmV4oLyeOHtqc'
);

export async function sendPushNotification(subscription, title, body, data = {}) {
  try {
    const payload = JSON.stringify({
      title,
      body,
      data
    });

    await webpush.sendNotification(subscription, payload);
    console.log('Notificação enviada com sucesso');
  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
    
    // Se subscription expirou ou é inválida, deletar do banco
    if (error.statusCode === 410 || error.statusCode === 404) {
      await db.query('DELETE FROM push_subscriptions WHERE endpoint = ?', [subscription.endpoint]);
      console.log('Subscription inválida, removida do banco');
    }
  }
}

export async function checkAndSendNotifications() {
  try {
    const now = new Date();
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const oneHourLater = new Date(now.getTime() + 1 * 60 * 60 * 1000);
    const tenMinutesLater = new Date(now.getTime() + 10 * 60 * 1000);

    // Buscar agendamentos que precisam de notificação
    const [schedules] = await db.query(`
      SELECT 
        s.*,
        u.id as technician_id,
        u.name as technician_name,
        ps.endpoint,
        ps.p256dh,
        ps.auth
      FROM schedules s
      LEFT JOIN users u ON s.technician_id = u.id
      LEFT JOIN push_subscriptions ps ON u.id = ps.user_id
      WHERE s.status IN ('agendado', 'confirmado')
        AND s.scheduled_time IS NOT NULL
        AND (
          (ABS(TIMESTAMPDIFF(MINUTE, s.scheduled_time, ?)) = 120) OR -- 2 horas antes
          (ABS(TIMESTAMPDIFF(MINUTE, s.scheduled_time, ?)) = 60) OR  -- 1 hora antes
          (ABS(TIMESTAMPDIFF(MINUTE, s.scheduled_time, ?)) = 0) OR    -- no horário
          (s.scheduled_time < ? AND s.status = 'agendado')            -- passou o horário e não iniciou
        )
    `, [twoHoursLater, oneHourLater, now, now]);

    for (const schedule of schedules) {
      if (!schedule.endpoint) continue;

      const subscription = {
        endpoint: schedule.endpoint,
        keys: {
          p256dh: schedule.p256dh,
          auth: schedule.auth
        }
      };

      const timeDiff = Math.abs(new Date(schedule.scheduled_time) - now) / (1000 * 60); // diferença em minutos

      let title = '';
      let body = '';

      if (timeDiff >= 118 && timeDiff <= 122) {
        // 2 horas antes
        title = 'Lembrete de Agendamento';
        body = `Você tem um agendamento em 2 horas: ${schedule.client_name} - ${schedule.address}`;
      } else if (timeDiff >= 58 && timeDiff <= 62) {
        // 1 hora antes
        title = 'Agendamento em 1 hora';
        body = `Você tem um agendamento em 1 hora: ${schedule.client_name} - ${schedule.address}`;
      } else if (timeDiff >= -2 && timeDiff <= 2) {
        // No horário
        title = 'É hora do agendamento';
        body = `Seu agendamento começou agora: ${schedule.client_name} - ${schedule.address}. Altere o status para "Em andamento".`;
      } else if (new Date(schedule.scheduled_time) < now && schedule.status === 'agendado') {
        // Passou o horário e não iniciou - notificar a cada 10 minutos
        const minutesSinceStart = Math.abs(new Date(schedule.scheduled_time) - now) / (1000 * 60);
        
        // Só notificar se for múltiplo de 10 minutos
        if (minutesSinceStart % 10 < 1) {
          title = 'Atenção: Agendamento não iniciado';
          body = `O agendamento ${schedule.id} já passou do horário. Altere o status para "Em andamento".`;
        } else {
          continue; // Pular se não for múltiplo de 10 minutos
        }
      } else {
        continue; // Pular se não atender nenhuma condição
      }

      await sendPushNotification(subscription, title, body, {
        scheduleId: schedule.id,
        type: 'schedule_reminder'
      });
    }
  } catch (error) {
    console.error('Erro ao verificar e enviar notificações:', error);
  }
}

// Função para iniciar o scheduler
export function startNotificationScheduler() {
  console.log('Iniciando scheduler de notificações...');
  
  // Verificar a cada minuto
  setInterval(checkAndSendNotifications, 60 * 1000);
  
  // Executar imediatamente ao iniciar
  checkAndSendNotifications();
}
