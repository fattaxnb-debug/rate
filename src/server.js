import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import morgan from 'morgan';

import routes from './routes/index.js';
import { errorMiddleware } from './middleware/error.js';
import { globalRateLimit } from './middleware/global-rate-limit.js';
import logger from './utils/logger.js';
import { BodyLimit } from './constants/common.js';

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

// CORS não necessário quando frontend e backend estão no mesmo domínio
// app.use(cors(corsOptions));
// app.options('*', cors(corsOptions));

app.use((req, res, next) => {
	logger.info(`Request: ${req.method} ${req.url}`);
	logger.info(`Origin: ${req.headers.origin}`);
	logger.info(`Headers: ${JSON.stringify(req.headers)}`);
	next();
});

// app.use(helmet());
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

// Servir arquivos estáticos de public/uploads com CORS
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
}, express.static(path.join(__dirname, '../public/uploads')));

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '../web/dist')));

// SPA fallback - servir index.html para rotas não-API
app.get(/^(?!\/api).*/, (req, res) => {
	res.sendFile(path.join(__dirname, '../web/dist/index.html'));
});

app.use(errorMiddleware);

const port = process.env.PORT || 3001;

app.listen(port, '0.0.0.0', () => {
	logger.info(`🚀 Server running on http://0.0.0.0:${port}`);
});

export default app;