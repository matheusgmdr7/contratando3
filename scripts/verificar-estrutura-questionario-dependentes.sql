-- Script para verificar e criar estrutura para questionários de dependentes
-- Verificar se existe coluna dependente_id na tabela questionario_saude

SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'questionario_saude'
ORDER BY ordinal_position;

-- Se não existir a coluna dependente_id, adicionar
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'questionario_saude' 
        AND column_name = 'dependente_id'
    ) THEN
        ALTER TABLE questionario_saude 
        ADD COLUMN dependente_id UUID REFERENCES dependentes(id) ON DELETE CASCADE;
        
        -- Criar índice para performance
        CREATE INDEX IF NOT EXISTS idx_questionario_saude_dependente_id 
        ON questionario_saude(dependente_id);
        
        RAISE NOTICE 'Coluna dependente_id adicionada à tabela questionario_saude';
    ELSE
        RAISE NOTICE 'Coluna dependente_id já existe na tabela questionario_saude';
    END IF;
END $$;

-- Verificar estrutura final
SELECT 
    'questionario_saude' as tabela,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'questionario_saude'
ORDER BY ordinal_position;
