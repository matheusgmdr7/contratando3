-- Adicionar colunas de controle na tabela propostas_corretores
ALTER TABLE propostas_corretores 
ADD COLUMN IF NOT EXISTS peso DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS altura DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS assinatura TEXT,
ADD COLUMN IF NOT EXISTS assinado_em TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS questionario_completo BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS pdf_url TEXT,
ADD COLUMN IF NOT EXISTS pdf_gerado_em TIMESTAMP WITH TIME ZONE;

-- Adicionar comentários
COMMENT ON COLUMN propostas_corretores.peso IS 'Peso do cliente em kg';
COMMENT ON COLUMN propostas_corretores.altura IS 'Altura do cliente em cm';
COMMENT ON COLUMN propostas_corretores.assinatura IS 'Assinatura digital do cliente (base64)';
COMMENT ON COLUMN propostas_corretores.assinado_em IS 'Data e hora da assinatura';
COMMENT ON COLUMN propostas_corretores.questionario_completo IS 'Indica se o questionário de saúde foi preenchido';
COMMENT ON COLUMN propostas_corretores.pdf_url IS 'URL do PDF gerado da proposta';
COMMENT ON COLUMN propostas_corretores.pdf_gerado_em IS 'Data e hora da geração do PDF';

-- Verificar as colunas adicionadas
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'propostas_corretores'
AND column_name IN ('peso', 'altura', 'assinatura', 'assinado_em', 'questionario_completo', 'pdf_url', 'pdf_gerado_em')
ORDER BY column_name;
