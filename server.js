import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import helmet from 'helmet';
import morgan from 'morgan';

import db from './src/config/database.js';
import routes from './src/routes/index.js';
import { errorMiddleware } from './src/middleware/error.js';
import { globalRateLimit } from './src/middleware/global-rate-limit.js';
import logger from './src/utils/logger.js';
import { BodyLimit } from './src/constants/common.js';
import { startNotificationScheduler } from './src/utils/notificationScheduler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Garantir que a pasta uploads existe (usar variável de ambiente ou caminho padrão)
const uploadsDir = process.env.UPLOADS_PATH || path.join(__dirname, 'uploads');
console.log('[UPLOADS] Using uploads directory:', uploadsDir);
console.log('[UPLOADS] UPLOADS_PATH from env:', process.env.UPLOADS_PATH);
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('[UPLOADS] Pasta uploads criada:', uploadsDir);
} else {
  console.log('[UPLOADS] Pasta uploads existe:', uploadsDir);
  const files = fs.readdirSync(uploadsDir);
  console.log('[UPLOADS] Total de arquivos:', files.length);
}

const app = express();

app.set('trust proxy', true);

process.on('uncaughtException', (error) => {
	logger.error('Uncaught exception:', error);
});
  
process.on('unhandledRejection', (reason, promise) => {
	logger.error('Unhandled rejection at:', promise, 'reason:', reason);
});

process.on('SIGINT', async () => {
	logger.info('Interrupted');
	process.exit(0);
});

process.on('SIGTERM', async () => {
	logger.info('SIGTERM signal received');

	await new Promise(resolve => setTimeout(resolve, 3000));

	logger.info('Exiting');
	process.exit();
});

app.use((req, res, next) => {
	logger.info(`Request: ${req.method} ${req.url}`);
	logger.info(`Origin: ${req.headers.origin}`);
	logger.info(`Headers: ${JSON.stringify(req.headers)}`);
	next();
});

app.use(morgan('combined'));
app.use(globalRateLimit);
app.use(express.json({
	limit: BodyLimit,
}));
app.use(express.urlencoded({ 
	extended: true,
	limit: BodyLimit,
}));

// Endpoint de diagnóstico de uploads
app.get('/api/uploads-debug', (req, res) => {
  const dir = path.join(__dirname, 'uploads');
  try {
    const exists = fs.existsSync(dir);
    const files = exists ? fs.readdirSync(dir) : [];
    res.json({ dir, exists, fileCount: files.length, files: files.slice(0, 20) });
  } catch (e) {
    res.json({ error: e.message, dir });
  }
});

// Servir arquivos estáticos de uploads com CORS (ANTES das rotas de API)
app.use('/api/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  const filePath = path.join(uploadsDir, req.path);
  console.log('[UPLOADS] Requested:', req.path, '| Full path:', filePath, '| Exists:', fs.existsSync(filePath));
  next();
}, express.static(uploadsDir));

app.use('/api', routes());

// Servir arquivos PWA com MIME type correto
app.use('/serviceWorker.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, 'web/public/serviceWorker.js'));
});

app.use('/manifest.json', (req, res) => {
  res.setHeader('Content-Type', 'application/manifest+json');
  res.sendFile(path.join(__dirname, 'web/public/manifest.json'));
});

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, 'web/dist')));

// SPA fallback - servir index.html para rotas não-API
app.get(/^(?!\/api).*/, (req, res) => {
	res.sendFile(path.join(__dirname, 'web/dist/index.html'));
});

app.use(errorMiddleware);

const port = process.env.PORT || 3001;

// Função para executar migrações automáticas ao iniciar
async function runMigrations() {
  try {
    logger.info('=== Running automatic migrations ===');
    
    // Verificar e adicionar coluna scheduled_time na tabela schedules
    const [columns] = await db.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'schedules'
    `);
    
    const columnNames = columns.map(c => c.COLUMN_NAME);
    
    if (!columnNames.includes('scheduled_time')) {
      logger.info('Adding column scheduled_time to schedules table');
      await db.query(`ALTER TABLE schedules ADD COLUMN scheduled_time time DEFAULT NULL`);
      logger.info('Column scheduled_time added successfully');
    } else {
      logger.info('Column scheduled_time already exists');
    }
    
    logger.info('=== Automatic migrations completed ===');
  } catch (error) {
    logger.error('Error running automatic migrations:', error);
  }
}

// Iniciar servidor após migrações
runMigrations().then(() => {
  // Iniciar scheduler de notificações
  startNotificationScheduler();
  
  app.listen(port, '0.0.0.0', () => {
    logger.info(`🚀 Server running on http://0.0.0.0:${port}`);
  });
}).catch(error => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});

export default app;
