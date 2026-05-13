import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'fattax',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function checkDBStructure() {
  try {
    console.log('=== VERIFICANDO ESTRUTURA DO BANCO DE DADOS ===\n');
    
    // Verificar tabelas
    const [tables] = await pool.query('SHOW TABLES');
    console.log('Tabelas no banco:');
    tables.forEach(t => {
      const tableName = Object.values(t)[0];
      console.log(`  - ${tableName}`);
    });
    
    // Verificar estrutura de cada tabela importante
    const importantTables = ['clients', 'equipments', 'reports', 'schedules', 'users', 'company_settings'];
    
    for (const tableName of importantTables) {
      const tableExists = tables.some(t => Object.values(t)[0] === tableName);
      if (!tableExists) {
        console.log(`\n⚠️ TABELA ${tableName} NÃO EXISTE!`);
        continue;
      }
      
      console.log(`\n=== ESTRUTURA DA TABELA ${tableName.toUpperCase()} ===`);
      const [columns] = await pool.query(`DESCRIBE ${tableName}`);
      columns.forEach(col => {
        console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Default !== null ? `DEFAULT ${col.Default}` : ''}`);
      });
    }
    
    console.log('\n=== VERIFICAÇÃO CONCLUÍDA ===');
  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await pool.end();
  }
}

checkDBStructure();
