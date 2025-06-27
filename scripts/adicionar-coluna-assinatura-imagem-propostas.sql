-- Adicionar coluna para armazenar a imagem da assinatura digital nas propostas
-- Esta coluna armazenará o base64 da assinatura capturada

-- Para tabela propostas
ALTER TABLE propostas 
ADD COLUMN IF NOT EXISTS assinatura_imagem TEXT;

-- Para tabela propostas_corretores
ALTER TABLE propostas_corretores 
ADD COLUMN IF NOT EXISTS assinatura_imagem TEXT;

-- Comentários para documentação
COMMENT ON COLUMN propostas.assinatura_imagem IS 'Base64 da imagem da assinatura digital capturada';
COMMENT ON COLUMN propostas_corretores.assinatura_imagem IS 'Base64 da imagem da assinatura digital capturada';

-- Verificar se as colunas foram criadas
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('propostas', 'propostas_corretores') 
    AND column_name = 'assinatura_imagem'
ORDER BY table_name;
