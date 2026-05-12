import mysql from 'mysql2/promise';

async function addTechnicalDescriptionFields() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'fattax'
  });

  try {
    console.log('Adicionando campos técnicos à tabela reports...');
    
    // Campos a adicionar
    const fields = [
      { name: 'technical_description', type: 'TEXT' },
      { name: 'reported_problems', type: 'TEXT' },
      { name: 'identified_defects', type: 'TEXT' },
      { name: 'procedures_performed', type: 'TEXT' },
      { name: 'replaced_parts', type: 'TEXT' },
      { name: 'parts_request', type: 'TEXT' },
      { name: 'observations', type: 'TEXT' },
      { name: 'external_inspection', type: 'TEXT' },
      { name: 'internal_inspection', type: 'TEXT' }
    ];
    
    for (const field of fields) {
      try {
        await connection.query(`ALTER TABLE reports ADD COLUMN ${field.name} ${field.type}`);
        console.log(`✅ Campo ${field.name} adicionado`);
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log(`⚠️  Campo ${field.name} já existe`);
        } else {
          console.error(`❌ Erro ao adicionar campo ${field.name}:`, error.message);
        }
      }
    }
    
    console.log('✅ Campos técnicos adicionados com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao adicionar campos técnicos:', error.message);
  } finally {
    await connection.end();
  }
}

addTechnicalDescriptionFields();
