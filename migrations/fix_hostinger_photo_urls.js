import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'fattax',
  port: process.env.DB_PORT || 3306,
});

console.log('Conectado ao banco:', process.env.DB_NAME || 'fattax');

try {
  // Verificar URLs com prefixo /api/uploads/
  const [photos] = await conn.query('SELECT id, photo_url FROM report_photos WHERE photo_url LIKE "/api/uploads/%"');
  console.log(`\nEncontradas ${photos.length} fotos com URL incorreta (/api/uploads/):`);
  
  if (photos.length > 0) {
    for (const p of photos) {
      console.log(`- ${p.id}: ${p.photo_url}`);
    }
    
    // Corrigir URLs
    console.log('\nCorrigindo URLs...');
    for (const p of photos) {
      const newUrl = p.photo_url.replace('/api/uploads/', '/uploads/');
      await conn.query('UPDATE report_photos SET photo_url = ? WHERE id = ?', [newUrl, p.id]);
      console.log(`- ${p.id}: ${p.photo_url} -> ${newUrl}`);
    }
    console.log('\n✅ URLs corrigidas com sucesso!');
  } else {
    console.log('Nenhuma URL incorreta encontrada. URLs já estão corretas.');
  }
  
  // Verificar settings também
  const [settings] = await conn.query('SELECT id, company_logo, signature_tiago_viana, signature_tito_livio, cover_pdf FROM settings');
  console.log('\nVerificando settings:');
  
  for (const s of settings) {
    let needsUpdate = false;
    const updates = {};
    
    if (s.company_logo && s.company_logo.startsWith('/api/uploads/')) {
      updates.company_logo = s.company_logo.replace('/api/uploads/', '/uploads/');
      needsUpdate = true;
    }
    if (s.signature_tiago_viana && s.signature_tiago_viana.startsWith('/api/uploads/')) {
      updates.signature_tiago_viana = s.signature_tiago_viana.replace('/api/uploads/', '/uploads/');
      needsUpdate = true;
    }
    if (s.signature_tito_livio && s.signature_tito_livio.startsWith('/api/uploads/')) {
      updates.signature_tito_livio = s.signature_tito_livio.replace('/api/uploads/', '/uploads/');
      needsUpdate = true;
    }
    if (s.cover_pdf && s.cover_pdf.startsWith('/api/uploads/')) {
      updates.cover_pdf = s.cover_pdf.replace('/api/uploads/', '/uploads/');
      needsUpdate = true;
    }
    
    if (needsUpdate) {
      const setClause = Object.keys(updates).map(k => `${k} = ?`).join(', ');
      const values = Object.values(updates);
      values.push(s.id);
      await conn.query(`UPDATE settings SET ${setClause} WHERE id = ?`, values);
      console.log(`Settings ${s.id} atualizados:`, updates);
    }
  }
  
  console.log('\n✅ Verificação concluída!');
  
} catch (err) {
  console.error('Erro:', err.message);
} finally {
  await conn.end();
}
