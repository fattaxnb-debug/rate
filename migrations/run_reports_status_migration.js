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
  const [before] = await conn.query('SELECT id, status FROM reports');
  console.log('Status antes da migração:', before.map(r => r.status));

  // Primeiro alterar a coluna para VARCHAR para aceitar qualquer valor temporariamente
  await conn.query("ALTER TABLE reports MODIFY COLUMN status VARCHAR(50) DEFAULT 'draft'");
  console.log('Coluna alterada para VARCHAR');

  // Migrar valores vazios para draft
  await conn.query("UPDATE reports SET status = 'draft' WHERE status = '' OR status IS NULL");
  console.log('Dados migrados');

  // Agora aplicar o enum correto
  await conn.query("ALTER TABLE reports MODIFY COLUMN status ENUM('draft','completed') DEFAULT 'draft'");
  console.log('Enum atualizado com sucesso');

  // Verificar status depois da migração
  const [after] = await conn.query('SELECT id, status FROM reports');
  console.log('Status após a migração:', after.map(r => r.status));

} catch (err) {
  console.error('Erro na migração:', err.message);
} finally {
  await conn.end();
  console.log('Conexão encerrada');
}
