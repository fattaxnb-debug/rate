import db from './src/config/database.js';

async function checkSchema() {
  try {
    const [rows] = await db.query('SHOW COLUMNS FROM reports');
    console.log('Colunas da tabela reports:');
    rows.forEach(row => {
      console.log(`${row.Field} - ${row.Type} - ${row.Null} - ${row.Key} - ${row.Default}`);
    });
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkSchema();
