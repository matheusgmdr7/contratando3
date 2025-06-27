-- =====================================================
-- SCRIPT: Adicionar Colunas Faltantes na Tabela tabelas_precos
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🔧 ADICIONANDO COLUNAS FALTANTES NA TABELA tabelas_precos';
    RAISE NOTICE '===========================================================';
END $$;

-- 1. Verificar se a tabela tabelas_precos existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tabelas_precos') THEN
        RAISE NOTICE '❌ Tabela tabelas_precos não existe. Criando...';
        
        CREATE TABLE tabelas_precos (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            titulo TEXT NOT NULL,
            descricao TEXT,
            operadora TEXT,
            tipo_plano TEXT,
            segmentacao TEXT,
            ativo BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        RAISE NOTICE '✅ Tabela tabelas_precos criada com sucesso';
    ELSE
        RAISE NOTICE '✅ Tabela tabelas_precos já existe';
    END IF;
END $$;

-- 2. Adicionar coluna 'operadora' se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tabelas_precos' AND column_name = 'operadora'
    ) THEN
        ALTER TABLE tabelas_precos ADD COLUMN operadora TEXT;
        RAISE NOTICE '✅ Coluna operadora adicionada';
    ELSE
        RAISE NOTICE '✅ Coluna operadora já existe';
    END IF;
END $$;

-- 3. Adicionar coluna 'tipo_plano' se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tabelas_precos' AND column_name = 'tipo_plano'
    ) THEN
        ALTER TABLE tabelas_precos ADD COLUMN tipo_plano TEXT;
        RAISE NOTICE '✅ Coluna tipo_plano adicionada';
    ELSE
        RAISE NOTICE '✅ Coluna tipo_plano já existe';
    END IF;
END $$;

-- 4. Adicionar coluna 'segmentacao' se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tabelas_precos' AND column_name = 'segmentacao'
    ) THEN
        ALTER TABLE tabelas_precos ADD COLUMN segmentacao TEXT;
        RAISE NOTICE '✅ Coluna segmentacao adicionada';
    ELSE
        RAISE NOTICE '✅ Coluna segmentacao já existe';
    END IF;
END $$;

-- 5. Verificar se a tabela tabelas_precos_faixas existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tabelas_precos_faixas') THEN
        RAISE NOTICE '❌ Tabela tabelas_precos_faixas não existe. Criando...';
        
        CREATE TABLE tabelas_precos_faixas (
            id SERIAL PRIMARY KEY,
            tabela_id UUID NOT NULL REFERENCES tabelas_precos(id) ON DELETE CASCADE,
            faixa_etaria TEXT NOT NULL,
            valor DECIMAL(10,2) NOT NULL DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        RAISE NOTICE '✅ Tabela tabelas_precos_faixas criada com sucesso';
    ELSE
        RAISE NOTICE '✅ Tabela tabelas_precos_faixas já existe';
    END IF;
END $$;

-- 6. Verificar estrutura final
DO $$
BEGIN
    RAISE NOTICE '📋 ESTRUTURA FINAL DA TABELA tabelas_precos:';
END $$;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tabelas_precos' 
ORDER BY ordinal_position;

-- 7. Verificar estrutura da tabela de faixas
DO $$
BEGIN
    RAISE NOTICE '📋 ESTRUTURA FINAL DA TABELA tabelas_precos_faixas:';
END $$;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tabelas_precos_faixas' 
ORDER BY ordinal_position;

-- 8. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_tabelas_precos_ativo ON tabelas_precos(ativo);
CREATE INDEX IF NOT EXISTS idx_tabelas_precos_operadora ON tabelas_precos(operadora);
CREATE INDEX IF NOT EXISTS idx_tabelas_precos_segmentacao ON tabelas_precos(segmentacao);
CREATE INDEX IF NOT EXISTS idx_tabelas_precos_faixas_tabela_id ON tabelas_precos_faixas(tabela_id);

DO $$
BEGIN
    RAISE NOTICE '✅ SCRIPT CONCLUÍDO COM SUCESSO';
    RAISE NOTICE '================================';
    RAISE NOTICE 'Agora você pode usar a funcionalidade de criação de tabelas!';
END $$;
