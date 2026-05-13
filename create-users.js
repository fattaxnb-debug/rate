import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';

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

async function createUsers() {
  try {
    console.log('=== CRIANDO USUÁRIOS ===\n');
    
    const users = [
      {
        email: 'fattax@fattax.srv.br',
        password: 'Serv!2026@',
        name: 'FATTAX ADMIN',
        role: 'manager'
      },
      {
        email: 'comercial@fattax.srv.br',
        password: 'Serv!2026@',
        name: 'TIAGO VIANA',
        role: 'Técnico'
      },
      {
        email: 'tito@fattax.srv.br',
        password: 'Serv!2026@',
        name: 'TITO LIVIO',
        role: 'Técnico'
      }
    ];
    
    for (const user of users) {
      // Verificar se usuário já existe
      const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [user.email]);
      
      if (existing.length > 0) {
        console.log(`⚠️ Usuário ${user.name} (${user.email}) já existe. Pulando.`);
        continue;
      }
      
      // Hash da senha
      const hashedPassword = await bcrypt.hash(user.password, 10);
      
      // Inserir usuário
      await pool.query(
        `INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)`,
        [user.email, hashedPassword, user.name, user.role]
      );
      
      console.log(`✅ Usuário criado: ${user.name} (${user.email}) - ${user.role}`);
    }
    
    console.log('\n=== USUÁRIOS CRIADOS COM SUCESSO ===');
    
    // Listar todos os usuários
    const [allUsers] = await pool.query('SELECT id, email, name, role FROM users ORDER BY name');
    console.log('\nUsuários no banco:');
    allUsers.forEach(u => {
      console.log(`  - ${u.name} (${u.email}) - ${u.role}`);
    });
    
  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await pool.end();
  }
}

createUsers();
