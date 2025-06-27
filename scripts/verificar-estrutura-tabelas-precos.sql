-- =====================================================
-- SCRIPT: Verificar Estrutura das Tabelas de Preços
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🔍 VERIFICANDO ESTRUTURA DAS TABELAS DE PREÇOS';
    RAISE NOTICE '================================================';
END $$;

-- 1. Verificar se a tabela tabelas_precos existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tabelas_precos') THEN
        RAISE NOTICE '✅ Tabela "tabelas_precos" existe';
    ELSE
        RAISE NOTICE '❌ Tabela "tabelas_precos" NÃO existe';
    END IF;
END $$;

-- 2. Mostrar estrutura da tabela tabelas_precos
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tabelas_precos' 
ORDER BY ordinal_position;

-- Verificar constraints NOT NULL
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'tabelas_precos'
    AND tc.constraint_type = 'CHECK';

-- Se a coluna corretora for obrigatória mas não existir no código,
-- vamos torná-la opcional ou adicionar um valor padrão
ALTER TABLE tabelas_precos 
ALTER COLUMN corretora DROP NOT NULL;

-- Ou adicionar um valor padrão se preferir manter NOT NULL
-- ALTER TABLE tabelas_precos 
-- ALTER COLUMN corretora SET DEFAULT 'Não informado';

-- Verificar se existem dados na tabela
SELECT COUNT(*) as total_tabelas FROM tabelas_precos;

-- 3. Verificar se a tabela tabelas_precos_faixas existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tabelas_precos_faixas') THEN
        RAISE NOTICE '✅ Tabela "tabelas_precos_faixas" existe';
    ELSE
        RAISE NOTICE '❌ Tabela "tabelas_precos_faixas" NÃO existe';
    END IF;
END $$;

-- 4. Mostrar estrutura da tabela tabelas_precos_faixas
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tabelas_precos_faixas' 
ORDER BY ordinal_position;

-- Verificar se existem dados na tabela de faixas
SELECT COUNT(*) as total_faixas FROM tabelas_precos_faixas;

-- 5. Verificar se a tabela produto_tabela_relacao existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'produto_tabela_relacao') THEN
        RAISE NOTICE '✅ Tabela "produto_tabela_relacao" existe';
    ELSE
        RAISE NOTICE '❌ Tabela "produto_tabela_relacao" NÃO existe';
    END IF;
END $$;

-- 6. Mostrar estrutura da tabela produto_tabela_relacao
SELECT 
    '📋 ESTRUTURA: produto_tabela_relacao' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'produto_tabela_relacao' 
ORDER BY ordinal_position;

-- 7. Verificar se a tabela produtos_corretores existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'produtos_corretores') THEN
        RAISE NOTICE '✅ Tabela "produtos_corretores" existe';
    ELSE
        RAISE NOTICE '❌ Tabela "produtos_corretores" NÃO existe';
    END IF;
END $$;

-- 8. Mostrar estrutura da tabela produtos_corretores
SELECT 
    '📋 ESTRUTURA: produtos_corretores' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'produtos_corretores' 
ORDER BY ordinal_position;

-- 9. Contar registros em cada tabela
SELECT 
    '📊 DADOS EXISTENTES' as info,
    'tabelas_precos' as tabela,
    COUNT(*) as total_registros
FROM tabelas_precos
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tabelas_precos')

UNION ALL

SELECT 
    '📊 DADOS EXISTENTES' as info,
    'tabelas_precos_faixas' as tabela,
    COUNT(*) as total_registros
FROM tabelas_precos_faixas
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tabelas_precos_faixas')

UNION ALL

SELECT 
    '📊 DADOS EXISTENTES' as info,
    'produto_tabela_relacao' as tabela,
    COUNT(*) as total_registros
FROM produto_tabela_relacao
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'produto_tabela_relacao')

UNION ALL

SELECT 
    '📊 DADOS EXISTENTES' as info,
    'produtos_corretores' as tabela,
    COUNT(*) as total_registros
FROM produtos_corretores
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'produtos_corretores');

-- 10. Mostrar dados de exemplo das tabelas (se existirem)
DO $$
BEGIN
    RAISE NOTICE '📝 DADOS DE EXEMPLO';
    RAISE NOTICE '==================';
END $$;

-- Exemplo de tabelas_precos
SELECT 
    '📝 EXEMPLO: tabelas_precos' as info,
    id,
    titulo,
    descricao,
    ativo,
    created_at
FROM tabelas_precos 
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tabelas_precos')
LIMIT 3;

-- Exemplo de tabelas_precos_faixas
SELECT 
    '📝 EXEMPLO: tabelas_precos_faixas' as info,
    id,
    tabela_id,
    faixa_etaria,
    valor,
    created_at
FROM tabelas_precos_faixas 
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tabelas_precos_faixas')
LIMIT 5;

-- Exemplo de produto_tabela_relacao
SELECT 
    '📝 EXEMPLO: produto_tabela_relacao' as info,
    id,
    produto_id,
    tabela_id,
    segmentacao,
    created_at
FROM produto_tabela_relacao 
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'produto_tabela_relacao')
LIMIT 3;

-- 11. Verificar relacionamentos (Foreign Keys)
SELECT 
    '🔗 RELACIONAMENTOS' as info,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('tabelas_precos', 'tabelas_precos_faixas', 'produto_tabela_relacao', 'produtos_corretores');

-- Verificar se as colunas necessárias existem
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'tabelas_precos' AND column_name = 'segmentacao'
        ) THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as coluna_segmentacao,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'tabelas_precos' AND column_name = 'operadora'
        ) THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as coluna_operadora,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'tabelas_precos' AND column_name = 'tipo_plano'
        ) THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as coluna_tipo_plano;

-- Se alguma coluna estiver faltando, adicionar:
-- ALTER TABLE tabelas_precos ADD COLUMN IF NOT EXISTS segmentacao TEXT;
-- ALTER TABLE tabelas_precos ADD COLUMN IF NOT EXISTS operadora TEXT;
-- ALTER TABLE tabelas_precos ADD COLUMN IF NOT EXISTS tipo_plano TEXT;

DO $$
BEGIN
    RAISE NOTICE '✅ VERIFICAÇÃO CONCLUÍDA';
    RAISE NOTICE '========================';
END $$;
