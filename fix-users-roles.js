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

async function fixUsersRoles() {
  try {
    console.log('=== CORRIGINDO ROLES DOS USUÁRIOS ===\n');
    
    // Atualizar TIAGO VIANA para technician
    await pool.query('UPDATE users SET role = ? WHERE email = ?', ['technician', 'comercial@fattax.srv.br']);
    console.log('✅ TIAGO VIANA atualizado para technician');
    
    // Atualizar TITO LIVIO para technician
    await pool.query('UPDATE users SET role = ? WHERE email = ?', ['technician', 'tito@fattax.srv.br']);
    console.log('✅ TITO LIVIO atualizado para technician');
    
    // Verificar os usuários atualizados
    const [users] = await pool.query('SELECT id, email, name, role FROM users ORDER BY name');
    console.log('\nUsuários no banco (após correção):');
    users.forEach(u => {
      console.log(`  - ${u.name} (${u.email}) - role: "${u.role}"`);
    });
    
  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await pool.end();
  }
}

fixUsersRoles();
