-- Script para adicionar colunas de produto em AMBAS as tabelas de propostas

-- ========================================
-- TABELA: propostas (propostas digitais)
-- ========================================

-- Verificar se a tabela propostas existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'propostas') THEN
        RAISE NOTICE '⚠️  Tabela propostas não existe. Pulando...';
    ELSE
        RAISE NOTICE '✅ Tabela propostas encontrada. Adicionando colunas...';
        
        -- Descrição do produto
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas' AND column_name = 'produto_descricao') THEN
            ALTER TABLE propostas ADD COLUMN produto_descricao TEXT;
            RAISE NOTICE '  ✓ Coluna produto_descricao adicionada em propostas';
        ELSE
            RAISE NOTICE '  - Coluna produto_descricao já existe em propostas';
        END IF;

        -- Operadora do produto
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas' AND column_name = 'produto_operadora') THEN
            ALTER TABLE propostas ADD COLUMN produto_operadora VARCHAR(255);
            RAISE NOTICE '  ✓ Coluna produto_operadora adicionada em propostas';
        ELSE
            RAISE NOTICE '  - Coluna produto_operadora já existe em propostas';
        END IF;

        -- Tipo do produto
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas' AND column_name = 'produto_tipo') THEN
            ALTER TABLE propostas ADD COLUMN produto_tipo VARCHAR(100);
            RAISE NOTICE '  ✓ Coluna produto_tipo adicionada em propostas';
        ELSE
            RAISE NOTICE '  - Coluna produto_tipo já existe em propostas';
        END IF;

        -- ID do produto
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas' AND column_name = 'produto_id') THEN
            ALTER TABLE propostas ADD COLUMN produto_id BIGINT;
            RAISE NOTICE '  ✓ Coluna produto_id adicionada em propostas';
        ELSE
            RAISE NOTICE '  - Coluna produto_id já existe em propostas';
        END IF;

        -- Criar índices para propostas
        CREATE INDEX IF NOT EXISTS idx_propostas_produto_id ON propostas(produto_id);
        CREATE INDEX IF NOT EXISTS idx_propostas_produto_operadora ON propostas(produto_operadora);
        CREATE INDEX IF NOT EXISTS idx_propostas_produto_tipo ON propostas(produto_tipo);
        
        -- Comentários para propostas
        COMMENT ON COLUMN propostas.produto_descricao IS 'Descrição detalhada do produto selecionado';
        COMMENT ON COLUMN propostas.produto_operadora IS 'Nome da operadora do produto';
        COMMENT ON COLUMN propostas.produto_tipo IS 'Tipo/categoria do produto';
        COMMENT ON COLUMN propostas.produto_id IS 'ID do produto na tabela produtos_corretores';
        
        RAISE NOTICE '✅ Colunas de produto adicionadas à tabela propostas';
    END IF;
END $$;

-- ========================================
-- TABELA: propostas_corretores
-- ========================================

-- Verificar se a tabela propostas_corretores existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'propostas_corretores') THEN
        RAISE NOTICE '⚠️  Tabela propostas_corretores não existe. Pulando...';
    ELSE
        RAISE NOTICE '✅ Tabela propostas_corretores encontrada. Adicionando colunas...';
        
        -- Descrição do produto
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas_corretores' AND column_name = 'produto_descricao') THEN
            ALTER TABLE propostas_corretores ADD COLUMN produto_descricao TEXT;
            RAISE NOTICE '  ✓ Coluna produto_descricao adicionada em propostas_corretores';
        ELSE
            RAISE NOTICE '  - Coluna produto_descricao já existe em propostas_corretores';
        END IF;

        -- Operadora do produto
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas_corretores' AND column_name = 'produto_operadora') THEN
            ALTER TABLE propostas_corretores ADD COLUMN produto_operadora VARCHAR(255);
            RAISE NOTICE '  ✓ Coluna produto_operadora adicionada em propostas_corretores';
        ELSE
            RAISE NOTICE '  - Coluna produto_operadora já existe em propostas_corretores';
        END IF;

        -- Tipo do produto
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas_corretores' AND column_name = 'produto_tipo') THEN
            ALTER TABLE propostas_corretores ADD COLUMN produto_tipo VARCHAR(100);
            RAISE NOTICE '  ✓ Coluna produto_tipo adicionada em propostas_corretores';
        ELSE
            RAISE NOTICE '  - Coluna produto_tipo já existe em propostas_corretores';
        END IF;

        -- ID do produto
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas_corretores' AND column_name = 'produto_id') THEN
            ALTER TABLE propostas_corretores ADD COLUMN produto_id BIGINT;
            RAISE NOTICE '  ✓ Coluna produto_id adicionada em propostas_corretores';
        ELSE
            RAISE NOTICE '  - Coluna produto_id já existe em propostas_corretores';
        END IF;

        -- Criar índices para propostas_corretores
        CREATE INDEX IF NOT EXISTS idx_propostas_corretores_produto_id ON propostas_corretores(produto_id);
        CREATE INDEX IF NOT EXISTS idx_propostas_corretores_produto_operadora ON propostas_corretores(produto_operadora);
        CREATE INDEX IF NOT EXISTS idx_propostas_corretores_produto_tipo ON propostas_corretores(produto_tipo);
        
        -- Comentários para propostas_corretores
        COMMENT ON COLUMN propostas_corretores.produto_descricao IS 'Descrição detalhada do produto selecionado';
        COMMENT ON COLUMN propostas_corretores.produto_operadora IS 'Nome da operadora do produto';
        COMMENT ON COLUMN propostas_corretores.produto_tipo IS 'Tipo/categoria do produto';
        COMMENT ON COLUMN propostas_corretores.produto_id IS 'ID do produto na tabela produtos_corretores';
        
        RAISE NOTICE '✅ Colunas de produto adicionadas à tabela propostas_corretores';
    END IF;
END $$;

-- ========================================
-- VERIFICAÇÃO FINAL
-- ========================================

-- Verificar estrutura final das colunas de produto em ambas as tabelas
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📊 ESTRUTURA FINAL DAS COLUNAS DE PRODUTO:';
    RAISE NOTICE '================================================';
    
    -- Verificar propostas
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'propostas') THEN
        RAISE NOTICE '';
        RAISE NOTICE '🔹 TABELA: propostas';
        FOR rec IN 
            SELECT 
                column_name,
                data_type,
                COALESCE(character_maximum_length::text, 'N/A') as max_length,
                is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'propostas' 
              AND column_name LIKE 'produto_%'
            ORDER BY column_name
        LOOP
            RAISE NOTICE '  • % (%) - Max: % - Nullable: %', 
                rec.column_name, rec.data_type, rec.max_length, rec.is_nullable;
        END LOOP;
    END IF;
    
    -- Verificar propostas_corretores
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'propostas_corretores') THEN
        RAISE NOTICE '';
        RAISE NOTICE '🔹 TABELA: propostas_corretores';
        FOR rec IN 
            SELECT 
                column_name,
                data_type,
                COALESCE(character_maximum_length::text, 'N/A') as max_length,
                is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'propostas_corretores' 
              AND column_name LIKE 'produto_%'
            ORDER BY column_name
        LOOP
            RAISE NOTICE '  • % (%) - Max: % - Nullable: %', 
                rec.column_name, rec.data_type, rec.max_length, rec.is_nullable;
        END LOOP;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Script executado com sucesso!';
    RAISE NOTICE '✅ Colunas de produto adicionadas em ambas as tabelas de propostas.';
END $$;
