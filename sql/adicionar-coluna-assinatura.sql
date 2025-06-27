-- Adicionar coluna assinatura à tabela propostas
ALTER TABLE propostas ADD COLUMN IF NOT EXISTS assinatura TEXT;

-- Adicionar comentário explicativo
COMMENT ON COLUMN propostas.assinatura IS 'Dados da assinatura do cliente (geralmente em formato base64)';

-- Verificar se a coluna foi adicionada corretamente
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'propostas'
        AND column_name = 'assinatura'
    ) THEN
        RAISE NOTICE 'Coluna assinatura adicionada com sucesso à tabela propostas';
    ELSE
        RAISE EXCEPTION 'Falha ao adicionar coluna assinatura à tabela propostas';
    END IF;
END $$;
