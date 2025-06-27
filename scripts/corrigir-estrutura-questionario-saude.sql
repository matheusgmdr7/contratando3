-- Script para corrigir a estrutura da tabela questionario_saude
-- Adiciona suporte para questionários de dependentes

-- 1. Verificar se a tabela existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'questionario_saude') THEN
        RAISE EXCEPTION 'Tabela questionario_saude não encontrada!';
    END IF;
    RAISE NOTICE '✅ Tabela questionario_saude encontrada';
END $$;

-- 2. Adicionar coluna dependente_id se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'questionario_saude' 
        AND column_name = 'dependente_id'
    ) THEN
        ALTER TABLE questionario_saude 
        ADD COLUMN dependente_id UUID NULL;
        
        RAISE NOTICE '✅ Coluna dependente_id adicionada';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna dependente_id já existe';
    END IF;
END $$;

-- 3. Adicionar coluna pessoa_tipo se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'questionario_saude' 
        AND column_name = 'pessoa_tipo'
    ) THEN
        ALTER TABLE questionario_saude 
        ADD COLUMN pessoa_tipo VARCHAR(20) DEFAULT 'titular';
        
        -- Atualizar registros existentes
        UPDATE questionario_saude 
        SET pessoa_tipo = 'titular' 
        WHERE pessoa_tipo IS NULL;
        
        RAISE NOTICE '✅ Coluna pessoa_tipo adicionada';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna pessoa_tipo já existe';
    END IF;
END $$;

-- 4. Adicionar coluna dependente_nome se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'questionario_saude' 
        AND column_name = 'dependente_nome'
    ) THEN
        ALTER TABLE questionario_saude 
        ADD COLUMN dependente_nome VARCHAR(255) NULL;
        
        RAISE NOTICE '✅ Coluna dependente_nome adicionada';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna dependente_nome já existe';
    END IF;
END $$;

-- 5. Adicionar constraint para pessoa_tipo
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'questionario_saude_pessoa_tipo_check'
    ) THEN
        ALTER TABLE questionario_saude 
        ADD CONSTRAINT questionario_saude_pessoa_tipo_check 
        CHECK (pessoa_tipo IN ('titular', 'dependente'));
        
        RAISE NOTICE '✅ Constraint pessoa_tipo adicionada';
    ELSE
        RAISE NOTICE 'ℹ️ Constraint pessoa_tipo já existe';
    END IF;
END $$;

-- 6. Criar índice para dependente_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_questionario_saude_dependente_id'
    ) THEN
        CREATE INDEX idx_questionario_saude_dependente_id 
        ON questionario_saude(dependente_id);
        
        RAISE NOTICE '✅ Índice dependente_id criado';
    ELSE
        RAISE NOTICE 'ℹ️ Índice dependente_id já existe';
    END IF;
END $$;

-- 7. Criar índice para pessoa_tipo
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_questionario_saude_pessoa_tipo'
    ) THEN
        CREATE INDEX idx_questionario_saude_pessoa_tipo 
        ON questionario_saude(pessoa_tipo);
        
        RAISE NOTICE '✅ Índice pessoa_tipo criado';
    ELSE
        RAISE NOTICE 'ℹ️ Índice pessoa_tipo já existe';
    END IF;
END $$;

-- 8. Criar índice composto para consultas otimizadas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_questionario_saude_proposta_pergunta_dependente'
    ) THEN
        CREATE INDEX idx_questionario_saude_proposta_pergunta_dependente 
        ON questionario_saude(proposta_id, pergunta_id, dependente_id);
        
        RAISE NOTICE '✅ Índice composto criado';
    ELSE
        RAISE NOTICE 'ℹ️ Índice composto já existe';
    END IF;
END $$;

-- 9. Criar índice único para evitar duplicatas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_questionario_saude_unique_resposta'
    ) THEN
        CREATE UNIQUE INDEX idx_questionario_saude_unique_resposta 
        ON questionario_saude(proposta_id, pergunta_id, COALESCE(dependente_id, '00000000-0000-0000-0000-000000000000'::uuid));
        
        RAISE NOTICE '✅ Índice único para evitar duplicatas criado';
    ELSE
        RAISE NOTICE 'ℹ️ Índice único já existe';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Não foi possível criar índice único: %', SQLERRM;
END $$;

-- 10. Adicionar foreign key para dependentes (se a tabela existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dependentes') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_questionario_saude_dependente'
        ) THEN
            ALTER TABLE questionario_saude 
            ADD CONSTRAINT fk_questionario_saude_dependente 
            FOREIGN KEY (dependente_id) REFERENCES dependentes(id) ON DELETE CASCADE;
            
            RAISE NOTICE '✅ Foreign key para dependentes criada';
        ELSE
            RAISE NOTICE 'ℹ️ Foreign key para dependentes já existe';
        END IF;
    ELSE
        RAISE NOTICE '⚠️ Tabela dependentes não encontrada - foreign key não criada';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Não foi possível criar foreign key: %', SQLERRM;
END $$;

-- 11. Verificar estrutura final
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'questionario_saude' 
ORDER BY ordinal_position;
