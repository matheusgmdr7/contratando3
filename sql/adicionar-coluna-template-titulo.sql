-- Adicionar coluna template_titulo à tabela propostas
ALTER TABLE propostas ADD COLUMN IF NOT EXISTS template_titulo VARCHAR(255);

-- Comentário explicativo
COMMENT ON COLUMN propostas.template_titulo IS 'Título do template de proposta utilizado';
