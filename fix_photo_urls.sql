-- Atualizar URLs das fotos antigas de /api/uploads/ para /uploads/
UPDATE report_photos 
SET photo_url = REPLACE(photo_url, '/api/uploads/', '/uploads/')
WHERE photo_url LIKE '/api/uploads/%';
