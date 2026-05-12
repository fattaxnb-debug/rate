-- Alterar campo photo_url de TEXT para BLOB para salvar imagem binária
-- Isso é mais eficiente que base64 e evita problemas de limite de caracteres

ALTER TABLE report_photos MODIFY COLUMN photo_url BLOB;
