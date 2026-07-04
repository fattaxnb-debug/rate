import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Usar variável de ambiente para o caminho da pasta uploads
const uploadPath = process.env.UPLOADS_PATH || path.join(__dirname, '../../uploads');

// Garantir que a pasta uploads existe
if (!fs.existsSync(uploadPath)) {
  try {
    fs.mkdirSync(uploadPath, { recursive: true });
    console.log('[UPLOADS] Uploads folder created:', uploadPath);
  } catch (error) {
    console.error('[UPLOADS] ERROR creating uploads folder:', error);
  }
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = 'upload-' + uniqueSuffix + path.extname(file.originalname);
    cb(null, filename);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// POST /uploads/photo - Upload genérico de fotos
router.post('/photo', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }
    
    const photo_url = `/api/uploads/${req.file.filename}`;
    
    console.log('[UPLOADS] Photo uploaded:', photo_url);
    console.log('[UPLOADS] File size:', req.file.size);
    
    res.json({ data: { url: photo_url, filename: req.file.filename, size: req.file.size } });
  } catch (error) {
    console.error('[UPLOADS] Error uploading photo:', error);
    res.status(500).json({ error: 'Erro ao fazer upload da foto' });
  }
});

export default router;
