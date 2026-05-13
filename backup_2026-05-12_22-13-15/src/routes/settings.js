import { Router } from 'express';
import multer from 'multer';
import db from '../config/database.js';

const router = Router();

// Configurar multer para upload de arquivos
const storage = multer.memoryStorage();
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
      console.log('[SETTINGS BACKEND DEBUG] Using global settings for user:', req.params.userId);
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
  console.log('[SETTINGS BACKEND DEBUG] POST /settings called');
  try {
    console.log('[SETTINGS BACKEND DEBUG] Request body:', req.body);
    console.log('[SETTINGS BACKEND DEBUG] Request files:', req.files);
    
    const { user_id } = req.body;
    
    if (!user_id) {
      console.error('[SETTINGS BACKEND DEBUG] user_id is missing from request body');
      return res.status(400).json({ error: 'user_id is required' });
    }
    
    // Converter arquivos para base64
    const company_logo = req.files?.company_logo?.[0] 
      ? `data:${req.files.company_logo[0].mimetype};base64,${req.files.company_logo[0].buffer.toString('base64')}` 
      : '';
    const signature_tiago_viana = req.files?.signature_tiago_viana?.[0] 
      ? `data:${req.files.signature_tiago_viana[0].mimetype};base64,${req.files.signature_tiago_viana[0].buffer.toString('base64')}` 
      : '';
    const signature_tito_livio = req.files?.signature_tito_livio?.[0] 
      ? `data:${req.files.signature_tito_livio[0].mimetype};base64,${req.files.signature_tito_livio[0].buffer.toString('base64')}` 
      : '';
    const cover_pdf = req.files?.cover_pdf?.[0] 
      ? `data:${req.files.cover_pdf[0].mimetype};base64,${req.files.cover_pdf[0].buffer.toString('base64')}` 
      : '';
    
    console.log('[SETTINGS BACKEND DEBUG] Saving settings for user_id:', user_id);
    console.log('[SETTINGS BACKEND DEBUG] company_logo length:', company_logo.length);
    console.log('[SETTINGS BACKEND DEBUG] signature_tiago_viana length:', signature_tiago_viana.length);
    console.log('[SETTINGS BACKEND DEBUG] signature_tito_livio length:', signature_tito_livio.length);
    console.log('[SETTINGS BACKEND DEBUG] cover_pdf length:', cover_pdf.length);
    
    console.log('[SETTINGS BACKEND DEBUG] Checking for existing settings...');
    // Verificar se já existe configuração para o usuário
    const [existing] = await db.query(
      'SELECT id FROM company_settings WHERE user_id = ?',
      [user_id]
    );
    
    console.log('[SETTINGS BACKEND DEBUG] Existing settings:', existing.length);
    
    if (existing.length > 0) {
      console.log('[SETTINGS BACKEND DEBUG] Updating existing settings...');
      // Atualizar
      await db.query(
        'UPDATE company_settings SET company_logo = ?, signature_tiago_viana = ?, signature_tito_livio = ?, cover_pdf = ? WHERE user_id = ?',
        [company_logo, signature_tiago_viana, signature_tito_livio, cover_pdf, user_id]
      );
      console.log('[SETTINGS BACKEND DEBUG] Settings updated successfully');
    } else {
      console.log('[SETTINGS BACKEND DEBUG] Inserting new settings...');
      // Inserir
      await db.query(
        'INSERT INTO company_settings (user_id, company_logo, signature_tiago_viana, signature_tito_livio, cover_pdf) VALUES (?, ?, ?, ?, ?)',
        [user_id, company_logo, signature_tiago_viana, signature_tito_livio, cover_pdf]
      );
      console.log('[SETTINGS BACKEND DEBUG] Settings inserted successfully');
    }
    
    res.json({ data: { id: existing[0]?.id, user_id, company_logo, signature_tiago_viana, signature_tito_livio, cover_pdf } });
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
  console.log('[SETTINGS BACKEND DEBUG] PUT /settings/:id called');
  try {
    const settingsId = req.params.id;
    
    // Converter arquivos para base64
    const company_logo = req.files?.company_logo?.[0] 
      ? `data:${req.files.company_logo[0].mimetype};base64,${req.files.company_logo[0].buffer.toString('base64')}` 
      : req.body.company_logo || '';
    const signature_tiago_viana = req.files?.signature_tiago_viana?.[0] 
      ? `data:${req.files.signature_tiago_viana[0].mimetype};base64,${req.files.signature_tiago_viana[0].buffer.toString('base64')}` 
      : req.body.signature_tiago_viana || '';
    const signature_tito_livio = req.files?.signature_tito_livio?.[0] 
      ? `data:${req.files.signature_tito_livio[0].mimetype};base64,${req.files.signature_tito_livio[0].buffer.toString('base64')}` 
      : req.body.signature_tito_livio || '';
    const cover_pdf = req.files?.cover_pdf?.[0] 
      ? `data:${req.files.cover_pdf[0].mimetype};base64,${req.files.cover_pdf[0].buffer.toString('base64')}` 
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
