import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../config/database.js';
import crypto from 'crypto';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../public/uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'photo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// POST /report-photos - Salvar foto do relatório
router.post('/', upload.single('photo_url'), async (req, res) => {
  try {
    const { report_id, comment, photo_type, sequence } = req.body;
    const photo_url = req.file ? `/uploads/${req.file.filename}` : '';
    
    const id = crypto.randomUUID();
    
    await db.query(
      `INSERT INTO report_photos (id, report_id, photo_url, comment, photo_type, sequence, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [id, report_id, photo_url, comment || '', photo_type || 'outro', sequence || 0]
    );
    
    res.json({ data: { id, report_id, photo_url, comment, photo_type, sequence } });
  } catch (error) {
    console.error('Error saving report photo:', error);
    res.status(500).json({ error: 'Erro ao salvar foto' });
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
      `SELECT * FROM report_photos WHERE report_id = ? ORDER BY sequence ASC`,
      [req.params.report_id]
    );
    
    res.json({ data: photos });
  } catch (error) {
    console.error('Error fetching report photos:', error);
    res.status(500).json({ error: 'Erro ao buscar fotos' });
  }
});

export default router;
