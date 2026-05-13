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

async function checkUsersRoles() {
  try {
    console.log('=== VERIFICANDO ROLES DOS USUÁRIOS ===\n');
    
    const [users] = await pool.query('SELECT id, email, name, role FROM users ORDER BY name');
    
    console.log('Usuários no banco:');
    users.forEach(u => {
      console.log(`  - ${u.name} (${u.email}) - role: "${u.role}"`);
    });
    
    // Verificar quais valores de role existem
    const [roles] = await pool.query('SELECT DISTINCT role FROM users');
    console.log('\nValores de role existentes:');
    roles.forEach(r => {
      console.log(`  - "${r.role}"`);
    });
    
  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await pool.end();
  }
}

checkUsersRoles();
