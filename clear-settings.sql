-- Limpar configurações antigas com data URLs
UPDATE company_settings SET company_logo = '' WHERE company_logo LIKE 'data:%';
UPDATE company_settings SET signature_tiago_viana = '' WHERE signature_tiago_viana LIKE 'data:%';
UPDATE company_settings SET signature_tito_livio = '' WHERE signature_tito_livio LIKE 'data:%';
UPDATE company_settings SET cover_pdf = '' WHERE cover_pdf LIKE 'data:%';
