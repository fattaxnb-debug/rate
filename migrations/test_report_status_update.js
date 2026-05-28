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
  // Buscar o relatório atual
  const [reports] = await conn.query('SELECT id, status FROM reports ORDER BY updated_at DESC LIMIT 1');
  if (reports.length > 0) {
    const report = reports[0];
    console.log('Relatório atual:', report);
    
    // Tentar atualizar para completed
    console.log('\nTentando atualizar status para completed...');
    await conn.query('UPDATE reports SET status = ? WHERE id = ?', ['completed', report.id]);
    
    // Verificar se atualizou
    const [updated] = await conn.query('SELECT id, status FROM reports WHERE id = ?', [report.id]);
    console.log('Relatório após atualização:', updated[0]);
    
    if (updated[0].status === 'completed') {
      console.log('\n✅ Atualização manual funcionou! O banco aceita "completed".');
    } else {
      console.log('\n❌ Atualização manual falhou! O banco não aceita "completed".');
    }
  } else {
    console.log('Nenhum relatório encontrado');
  }
} catch (err) {
  console.error('Erro:', err.message);
} finally {
  await conn.end();
}
