import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import morgan from 'morgan';

import routes from './src/routes/index.js';
import { errorMiddleware } from './src/middleware/error.js';
import { globalRateLimit } from './src/middleware/global-rate-limit.js';
import logger from './src/utils/logger.js';
import { BodyLimit } from './src/constants/common.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

app.use('/api', routes());

// Servir arquivos estáticos de uploads com CORS
app.use('/api/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
}, express.static(path.join(__dirname, 'uploads')));

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
  app.listen(port, '0.0.0.0', () => {
    logger.info(`🚀 Server running on http://0.0.0.0:${port}`);
  });
}).catch(error => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});

export default app;
