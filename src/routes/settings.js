import { Router } from 'express';
import multer from 'multer';
import db from '../config/database.js';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Configurar multer para upload de arquivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Usar o diretório uploads na raiz do projeto, independente de onde o backend é executado
    const uploadDir = path.join(process.cwd().includes('src') ? path.dirname(process.cwd()) : process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
    cb(null, filename);
  }
});

const upload = multer({ storage: storage });

// GET /settings/user/:userId - Buscar configurações do usuário (sempre usa configurações globais para logo)
router.get('/user/:userId', async (req, res) => {
  try {
    // Sempre buscar configurações globais para logo e nome da empresa
    const [globalSettings] = await db.query(
      'SELECT * FROM company_settings LIMIT 1'
    );
    
    const [userSettings] = await db.query(
      'SELECT * FROM company_settings WHERE user_id = ?',
      [req.params.userId]
    );
    
    if (globalSettings.length > 0) {
      // Usar configurações globais para logo e nome da empresa
      const result = {
        ...globalSettings[0],
        // Manter assinaturas específicas do usuário se existirem
        signature_tiago_viana: userSettings[0]?.signature_tiago_viana || globalSettings[0].signature_tiago_viana,
        signature_tito_livio: userSettings[0]?.signature_tito_livio || globalSettings[0].signature_tito_livio,
        cover_pdf: userSettings[0]?.cover_pdf || globalSettings[0].cover_pdf
      };
      return res.json({ data: result });
    }
    
    if (userSettings.length > 0) {
      return res.json({ data: userSettings[0] });
    }
    
    return res.json({ data: { user_id: req.params.userId, company_logo: '', signature_tiago_viana: '', signature_tito_livio: '', cover_pdf: '' } });
  } catch (error) {
    console.error('Error fetching user settings:', error);
    res.status(500).json({ error: 'Erro ao buscar configurações' });
  }
});

// POST /settings - Salvar configurações do usuário
router.post('/', upload.fields([
  { name: 'company_logo' },
  { name: 'signature_tiago_viana' },
  { name: 'signature_tito_livio' },
  { name: 'cover_pdf' }
]), async (req, res) => {
  try {
    const { user_id } = req.body;
    
    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }
    
    // Salvar apenas o nome do arquivo se foi enviado
    const company_logo = req.files?.company_logo?.[0] 
      ? req.files.company_logo[0].filename 
      : '';
    const signature_tiago_viana = req.files?.signature_tiago_viana?.[0] 
      ? req.files.signature_tiago_viana[0].filename 
      : '';
    const signature_tito_livio = req.files?.signature_tito_livio?.[0] 
      ? req.files.signature_tito_livio[0].filename 
      : '';
    const cover_pdf = req.files?.cover_pdf?.[0] 
      ? req.files.cover_pdf[0].filename 
      : '';
    
    // Verificar se já existe configuração para o usuário
    const [existing] = await db.query(
      'SELECT id FROM company_settings WHERE user_id = ?',
      [user_id]
    );
    
    if (existing.length > 0) {
      // Atualizar
      await db.query(
        'UPDATE company_settings SET company_logo = ?, signature_tiago_viana = ?, signature_tito_livio = ?, cover_pdf = ? WHERE user_id = ?',
        [company_logo, signature_tiago_viana, signature_tito_livio, cover_pdf, user_id]
      );
    } else {
      // Inserir
      const id = uuidv4();
      await db.query(
        'INSERT INTO company_settings (id, user_id, company_logo, signature_tiago_viana, signature_tito_livio, cover_pdf) VALUES (?, ?, ?, ?, ?, ?)',
        [id, user_id, company_logo, signature_tiago_viana, signature_tito_livio, cover_pdf]
      );
    }
    
    res.json({ data: { id: existing[0]?.id || id, user_id, company_logo, signature_tiago_viana, signature_tito_livio, cover_pdf } });
  } catch (error) {
    console.error('Error saving settings:', error);
    res.status(500).json({ error: 'Erro ao salvar configurações' });
  }
});

// PUT /settings/:id - Atualizar configurações por ID
router.put('/:id', upload.fields([
  { name: 'company_logo' },
  { name: 'signature_tiago_viana' },
  { name: 'signature_tito_livio' },
  { name: 'cover_pdf' }
]), async (req, res) => {
  try {
    const settingsId = req.params.id;
    
    // Salvar apenas o nome do arquivo se foi enviado
    const company_logo = req.files?.company_logo?.[0] 
      ? req.files.company_logo[0].filename 
      : req.body.company_logo || '';
    const signature_tiago_viana = req.files?.signature_tiago_viana?.[0] 
      ? req.files.signature_tiago_viana[0].filename 
      : req.body.signature_tiago_viana || '';
    const signature_tito_livio = req.files?.signature_tito_livio?.[0] 
      ? req.files.signature_tito_livio[0].filename 
      : req.body.signature_tito_livio || '';
    const cover_pdf = req.files?.cover_pdf?.[0] 
      ? req.files.cover_pdf[0].filename 
      : req.body.cover_pdf || '';
    
    await db.query(
      'UPDATE company_settings SET company_logo = ?, signature_tiago_viana = ?, signature_tito_livio = ?, cover_pdf = ? WHERE id = ?',
      [company_logo, signature_tiago_viana, signature_tito_livio, cover_pdf, settingsId]
    );
    
    res.json({ data: { id: settingsId, company_logo, signature_tiago_viana, signature_tito_livio, cover_pdf } });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Erro ao atualizar configurações' });
  }
});

export default router;
