import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'fattax',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '-03:00' // Configurar timezone para Brasil (UTC-3)
});

// Test connection
pool.getConnection()
  .then(conn => {
    console.log('Database connected successfully to:', conn.config.database);
    conn.release();
  })
  .catch(err => {
    console.error('Database connection error:', err.message);
  });

export default pool;
