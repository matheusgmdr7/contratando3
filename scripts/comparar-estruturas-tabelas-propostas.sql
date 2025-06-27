-- Script para comparar estruturas das tabelas propostas e propostas_corretores
-- e identificar colunas faltantes

-- 1. VERIFICAR ESTRUTURA DA TABELA PROPOSTAS
SELECT 
    'TABELA_PROPOSTAS' as origem,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'propostas' 
ORDER BY ordinal_position;

-- 2. VERIFICAR ESTRUTURA DA TABELA PROPOSTAS_CORRETORES
SELECT 
    'TABELA_PROPOSTAS_CORRETORES' as origem,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'propostas_corretores' 
ORDER BY ordinal_position;

-- 3. COLUNAS QUE EXISTEM EM PROPOSTAS_CORRETORES MAS NÃO EM PROPOSTAS
SELECT 
    'FALTA_EM_PROPOSTAS' as status,
    pc.column_name,
    pc.data_type,
    pc.is_nullable,
    pc.column_default
FROM information_schema.columns pc
WHERE pc.table_name = 'propostas_corretores'
AND pc.column_name NOT IN (
    SELECT p.column_name 
    FROM information_schema.columns p 
    WHERE p.table_name = 'propostas'
)
ORDER BY pc.column_name;

-- 4. COLUNAS QUE EXISTEM EM PROPOSTAS MAS NÃO EM PROPOSTAS_CORRETORES
SELECT 
    'FALTA_EM_PROPOSTAS_CORRETORES' as status,
    p.column_name,
    p.data_type,
    p.is_nullable,
    p.column_default
FROM information_schema.columns p
WHERE p.table_name = 'propostas'
AND p.column_name NOT IN (
    SELECT pc.column_name 
    FROM information_schema.columns pc 
    WHERE pc.table_name = 'propostas_corretores'
)
ORDER BY p.column_name;

-- 5. VERIFICAR DADOS EXISTENTES
SELECT 
    'propostas' as tabela,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN status = 'pendente' THEN 1 END) as pendentes,
    COUNT(CASE WHEN status = 'aprovada' THEN 1 END) as aprovadas,
    COUNT(CASE WHEN status = 'rejeitada' THEN 1 END) as rejeitadas
FROM propostas

UNION ALL

SELECT 
    'propostas_corretores' as tabela,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN status = 'pendente' THEN 1 END) as pendentes,
    COUNT(CASE WHEN status = 'aprovada' THEN 1 END) as aprovadas,
    COUNT(CASE WHEN status = 'rejeitada' THEN 1 END) as rejeitadas
FROM propostas_corretores;

RAISE NOTICE '✅ Comparação de estruturas concluída!';
RAISE NOTICE 'Analise os resultados para identificar as colunas que precisam ser adicionadas à tabela propostas.';
