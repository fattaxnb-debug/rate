import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'fattax',
  port: process.env.DB_PORT || 3306,
});

console.log('Conectado ao banco:', process.env.DB_NAME || 'fattax');

try {
  // Verificar status atuais antes da migração
  const [before] = await conn.query('SELECT id, status FROM schedules');
  console.log('Status antes da migração:', before.map(r => r.status));

  // Primeiro alterar a coluna para VARCHAR para aceitar qualquer valor temporariamente
  await conn.query("ALTER TABLE schedules MODIFY COLUMN status VARCHAR(50) DEFAULT 'ABERTO'");
  console.log('Coluna alterada para VARCHAR');

  // Migrar valores antigos para os novos
  await conn.query("UPDATE schedules SET status = 'ABERTO' WHERE status IN ('pending', '') OR status IS NULL");
  await conn.query("UPDATE schedules SET status = 'ATENDENDO' WHERE status = 'confirmed'");
  await conn.query("UPDATE schedules SET status = 'CONCLUÍDO' WHERE status = 'completed'");
  await conn.query("UPDATE schedules SET status = 'FINALIZADO' WHERE status = 'cancelled'");
  await conn.query("UPDATE schedules SET status = 'ABERTO' WHERE status NOT IN ('ABERTO','ATRASADO','ATENDENDO','CONCLUÍDO','FINALIZADO')");
  console.log('Dados migrados');

  // Agora aplicar o enum correto
  await conn.query("ALTER TABLE schedules MODIFY COLUMN status ENUM('ABERTO','ATRASADO','ATENDENDO','CONCLUÍDO','FINALIZADO') DEFAULT 'ABERTO'");
  console.log('Enum atualizado com sucesso');

  // Verificar status depois da migração
  const [after] = await conn.query('SELECT id, status FROM schedules');
  console.log('Status após a migração:', after.map(r => r.status));

} catch (err) {
  console.error('Erro na migração:', err.message);
} finally {
  await conn.end();
  console.log('Conexão encerrada');
}
