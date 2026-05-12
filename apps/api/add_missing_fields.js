import db from './src/config/database.js';

async function addMissingFields() {
  try {
    console.log('Adicionando campos faltantes à tabela reports...');
    
    const queries = [
      'ALTER TABLE reports ADD COLUMN cable_exit_phase VARCHAR(20) DEFAULT NULL',
      'ALTER TABLE reports ADD COLUMN cable_exit_neutral VARCHAR(20) DEFAULT NULL',
      'ALTER TABLE reports ADD COLUMN cooled_environment VARCHAR(50) DEFAULT NULL',
      'ALTER TABLE reports ADD COLUMN electrical_measurements TEXT DEFAULT NULL',
      'ALTER TABLE reports ADD COLUMN battery_bank TEXT DEFAULT NULL',
      'ALTER TABLE reports ADD COLUMN external_battery_connection VARCHAR(50) DEFAULT NULL',
      'ALTER TABLE reports ADD COLUMN external_battery_nobreak_connection VARCHAR(50) DEFAULT NULL',
      'ALTER TABLE reports ADD COLUMN external_inspection TEXT DEFAULT NULL',
      'ALTER TABLE reports ADD COLUMN internal_inspection TEXT DEFAULT NULL',
      'ALTER TABLE reports ADD COLUMN attendance_description TEXT DEFAULT NULL',
      'ALTER TABLE reports ADD COLUMN diagnosis TEXT DEFAULT NULL',
      'ALTER TABLE reports ADD COLUMN conclusion TEXT DEFAULT NULL'
    ];

    for (const query of queries) {
      try {
        await db.query(query);
        console.log('✓', query);
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log('⊘ Campo já existe:', query);
        } else {
          console.error('✗ Erro:', error.message, query);
        }
      }
    }

    console.log('Campos faltantes adicionados com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addMissingFields();
