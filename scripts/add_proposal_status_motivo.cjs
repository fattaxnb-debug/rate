const mysql = require('mysql2/promise');

async function runMigrations() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'fattax_db'
  });

  try {
    console.log('Conectado ao banco de dados');

    // Adicionar campo status
    await connection.execute(`
      ALTER TABLE proposals ADD COLUMN status VARCHAR(20) DEFAULT 'ABERTA' AFTER proposal_number
    `);
    console.log('Campo status adicionado com sucesso');

    // Atualizar propostas existentes
    await connection.execute(`
      UPDATE proposals SET status = 'ABERTA' WHERE status IS NULL
    `);
    console.log('Propostas existentes atualizadas');

    // Adicionar campo motivo
    await connection.execute(`
      ALTER TABLE proposals ADD COLUMN motivo TEXT AFTER observations
    `);
    console.log('Campo motivo adicionado com sucesso');

    console.log('Migrações concluídas com sucesso!');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('Campo já existe, continuando...');
    } else {
      console.error('Erro:', error);
    }
  } finally {
    await connection.end();
  }
}

runMigrations();
