import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

const router = express.Router();

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
  console.log('[UPLOAD DEBUG] POST /report-photos called');
  console.log('[UPLOAD DEBUG] Request body:', req.body);
  console.log('[UPLOAD DEBUG] Request file:', req.file ? 'Present' : 'MISSING');
  
  try {
    const { report_id, comment, photo_type } = req.body;
    
    if (!req.file) {
      console.error('[UPLOAD DEBUG] ERROR: No file uploaded');
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }
    
    const photo_url = `/uploads/${req.file.filename}`;
    console.log('[UPLOAD DEBUG] Photo URL:', photo_url);
    console.log('[UPLOAD DEBUG] File saved at:', req.file.path);
    console.log('[UPLOAD DEBUG] File size:', req.file.size);
    
    const id = uuidv4();
    
    await db.query(
      `INSERT INTO report_photos (id, report_id, photo_url, comment, photo_type, created_at) VALUES (?, ?, ?, ?, ?, NOW())`,
      [id, report_id, photo_url, comment || '', photo_type || 'outro']
    );
    
    console.log('[UPLOAD DEBUG] Photo saved to database:', id);
    res.json({ data: { id, report_id, photo_url, comment, photo_type } });
  } catch (error) {
    console.error('[UPLOAD DEBUG] Error saving report photo:', error);
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
    await db.query(
      `DELETE FROM report_photos WHERE id = ?`,
      [req.params.id]
    );
    
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
