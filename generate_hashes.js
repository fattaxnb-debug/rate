import bcrypt from 'bcrypt';

const users = [
  { email: 'fattax@fattax.srv.br', password: 'Serv!2026@', name: 'FATTAX ADMIN', role: 'manager' },
  { email: 'comercial@fattax.srv.br', password: 'Serv!2026@', name: 'Tiago Viana', role: 'technician' },
  { email: 'tito@fattax.srv.br', password: 'Serv!2026@', name: 'Tito Livio', role: 'technician' }
];

console.log('-- SQL para inserir usuários');
console.log('-- Execute isso no phpMyAdmin');

for (const user of users) {
  const hash = await bcrypt.hash(user.password, 10);
  console.log(`INSERT INTO users (email, password, name, role) VALUES ('${user.email}', '${hash}', '${user.name}', '${user.role}');`);
}
