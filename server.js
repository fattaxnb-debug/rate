import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Importar o servidor real
const serverPath = join(__dirname, 'apps/api/src/server.js');
await import(serverPath);
