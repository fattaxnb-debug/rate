import express from 'express';
import db from '../config/database.js';
import logger from '../utils/logger.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const router = express.Router();

// Log para monitorar operações de arquivos
const logFileOperation = (operation, filePath, details = '') => {
  const timestamp = new Date().toISOString();
  console.log(`[FILE MONITOR] ${timestamp} | ${operation} | ${filePath} | ${details}`);
  logger.info(`${operation}: ${filePath} ${details}`);
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadPath = path.join(__dirname, '../../uploads');
console.log('[UPLOAD DEBUG] Upload path resolved:', uploadPath);
console.log('[UPLOAD DEBUG] __dirname:', __dirname);

// Garantir que a pasta uploads existe
if (!fs.existsSync(uploadPath)) {
  console.log('[UPLOAD DEBUG] Uploads folder does not exist, creating:', uploadPath);
  try {
    fs.mkdirSync(uploadPath, { recursive: true });
    console.log('[UPLOAD DEBUG] Uploads folder created successfully');
  } catch (error) {
    console.error('[UPLOAD DEBUG] ERROR creating uploads folder:', error);
  }
} else {
  console.log('[UPLOAD DEBUG] Uploads folder exists');
  // Verificar permissões
  try {
    fs.accessSync(uploadPath, fs.constants.W_OK);
    console.log('[UPLOAD DEBUG] Uploads folder is writable');
  } catch (error) {
    console.error('[UPLOAD DEBUG] ERROR: Uploads folder is not writable:', error);
  }
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log('[UPLOAD DEBUG] Multer destination called with uploadPath:', uploadPath);
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = 'photo-' + uniqueSuffix + path.extname(file.originalname);
    console.log('[UPLOAD DEBUG] Filename generated:', filename);
    console.log('[UPLOAD DEBUG] Original filename:', file.originalname);
    console.log('[UPLOAD DEBUG] File mimetype:', file.mimetype);
    console.log('[UPLOAD DEBUG] File size:', file.size);
    cb(null, filename);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// POST /report-photos - Salvar foto do relatório
router.post('/', upload.single('photo_url'), async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`[UPLOAD DEBUG] ${timestamp} | POST /report-photos called`);
  console.log(`[UPLOAD DEBUG] ${timestamp} | Request body:`, req.body);
  console.log(`[UPLOAD DEBUG] ${timestamp} | Request file:`, req.file ? 'Present' : 'MISSING');
  
  try {
    const { report_id, comment, photo_type } = req.body;
    
    if (!req.file) {
      console.error(`[UPLOAD DEBUG] ${timestamp} | ERROR: No file uploaded`);
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }
    
    const photo_url = `/uploads/${req.file.filename}`;
    const filePath = req.file.path;
    
    logFileOperation('UPLOAD_SUCCESS', filePath, `Photo URL: ${photo_url}, Report ID: ${report_id}, Size: ${req.file.size}`);
    
    console.log(`[UPLOAD DEBUG] ${timestamp} | Photo URL: ${photo_url}`);
    console.log(`[UPLOAD DEBUG] ${timestamp} | File saved at: ${filePath}`);
    console.log(`[UPLOAD DEBUG] ${timestamp} | File size: ${req.file.size}`);
    
    // Verificar se o arquivo existe após upload
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      console.log(`[UPLOAD DEBUG] ${timestamp} | File verification: EXISTS, Size: ${stats.size}`);
      logFileOperation('FILE_VERIFY', filePath, `Exists: true, Size: ${stats.size}`);
    } else {
      console.error(`[UPLOAD DEBUG] ${timestamp} | File verification: NOT EXISTS!`);
      logFileOperation('FILE_VERIFY_ERROR', filePath, 'File does not exist after upload!');
    }
    
    const id = uuidv4();
    
    await db.query(
      `INSERT INTO report_photos (id, report_id, photo_url, comment, photo_type, created_at) VALUES (?, ?, ?, ?, ?, NOW())`,
      [id, report_id, photo_url, comment || '', photo_type || 'outro']
    );
    
    console.log(`[UPLOAD DEBUG] ${timestamp} | Photo saved to database: ${id}`);
    res.json({ data: { id, report_id, photo_url, comment, photo_type } });
  } catch (error) {
    console.error(`[UPLOAD DEBUG] ${timestamp} | Error saving report photo:`, error);
    res.status(500).json({ error: 'Erro ao salvar foto', details: error.message });
  }
});

// PUT /report-photos/:id - Atualizar foto do relatório
router.put('/:id', async (req, res) => {
  try {
    const { comment } = req.body;
    
    await db.query(
      `UPDATE report_photos SET comment = ? WHERE id = ?`,
      [comment || '', req.params.id]
    );
    
    res.json({ data: { id: req.params.id, comment } });
  } catch (error) {
    console.error('Error updating report photo:', error);
    res.status(500).json({ error: 'Erro ao atualizar foto' });
  }
});

// DELETE /report-photos/:id - Deletar foto do relatório
router.delete('/:id', async (req, res) => {
  try {
    // Primeiro, buscar a foto para obter a URL antes de deletar
    const [photos] = await db.query(
      `SELECT photo_url FROM report_photos WHERE id = ?`,
      [req.params.id]
    );
    
    if (photos.length === 0) {
      return res.status(404).json({ error: 'Foto não encontrada' });
    }
    
    const photoUrl = photos[0].photo_url;
    logFileOperation('DELETE_REQUEST', photoUrl, `Photo ID: ${req.params.id}`);
    
    // Deletar do banco
    await db.query(
      `DELETE FROM report_photos WHERE id = ?`,
      [req.params.id]
    );
    
    // Deletar arquivo físico
    if (photoUrl) {
      const fileName = path.basename(photoUrl);
      const filePath = path.join('../../uploads', fileName);
      const absolutePath = path.resolve(filePath);
      
      logFileOperation('DELETE_FILE_ATTEMPT', absolutePath, `Photo ID: ${req.params.id}`);
      
      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
        logFileOperation('DELETE_FILE_SUCCESS', absolutePath, `Photo ID: ${req.params.id}`);
      } else {
        logFileOperation('DELETE_FILE_NOT_FOUND', absolutePath, `Photo ID: ${req.params.id}`);
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting report photo:', error);
    res.status(500).json({ error: 'Erro ao deletar foto' });
  }
});

// GET /report-photos/report/:report_id - Buscar fotos do relatório
router.get('/report/:report_id', async (req, res) => {
  try {
    const [photos] = await db.query(
      `SELECT * FROM report_photos WHERE report_id = ?`,
      [req.params.report_id]
    );
    
    res.json({ data: photos });
  } catch (error) {
    console.error('Error fetching report photos:', error);
    res.status(500).json({ error: 'Erro ao buscar fotos' });
  }
});

export default router;
