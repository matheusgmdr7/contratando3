-- Script para verificar se as funcionalidades de criar e vincular tabelas estão funcionando
-- Execute este script para diagnosticar problemas

-- 1. Verificar se as tabelas existem
SELECT 
    'Verificando existência das tabelas...' as status;

SELECT 
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN 'EXISTE'
        ELSE 'NÃO EXISTE'
    END as status
FROM information_schema.tables 
WHERE table_name IN ('tabelas_precos', 'produtos_corretores', 'produto_tabela_relacao', 'tabelas_precos_faixas')
ORDER BY table_name;

-- 2. Verificar estrutura da tabela tabelas_precos
SELECT 
    'Estrutura da tabela tabelas_precos:' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tabelas_precos'
ORDER BY ordinal_position;

-- 3. Verificar estrutura da tabela produtos_corretores
SELECT 
    'Estrutura da tabela produtos_corretores:' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'produtos_corretores'
ORDER BY ordinal_position;

-- 4. Verificar estrutura da tabela produto_tabela_relacao
SELECT 
    'Estrutura da tabela produto_tabela_relacao:' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'produto_tabela_relacao'
ORDER BY ordinal_position;

-- 5. Contar registros em cada tabela
SELECT 
    'Contagem de registros nas tabelas:' as info;

SELECT 
    'tabelas_precos' as tabela,
    COUNT(*) as total_registros
FROM tabelas_precos

UNION ALL

SELECT 
    'produtos_corretores' as tabela,
    COUNT(*) as total_registros
FROM produtos_corretores

UNION ALL

SELECT 
    'produto_tabela_relacao' as tabela,
    COUNT(*) as total_registros
FROM produto_tabela_relacao

UNION ALL

SELECT 
    'tabelas_precos_faixas' as tabela,
    COUNT(*) as total_registros
FROM tabelas_precos_faixas;

-- 6. Verificar dados de exemplo das tabelas_precos
SELECT 
    'Dados de exemplo - tabelas_precos:' as info;

SELECT 
    id,
    titulo,
    descricao,
    ativo,
    created_at
FROM tabelas_precos
ORDER BY created_at DESC
LIMIT 5;

-- 7. Verificar dados de exemplo dos produtos_corretores
SELECT 
    'Dados de exemplo - produtos_corretores:' as info;

SELECT 
    id,
    nome,
    operadora,
    tipo,
    disponivel
FROM produtos_corretores
ORDER BY created_at DESC
LIMIT 5;

-- 8. Verificar relações produto-tabela
SELECT 
    'Relações produto-tabela existentes:' as info;

SELECT 
    ptr.id as relacao_id,
    pc.nome as produto_nome,
    tp.titulo as tabela_titulo,
    ptr.segmentacao,
    ptr.created_at
FROM produto_tabela_relacao ptr
JOIN produtos_corretores pc ON ptr.produto_id = pc.id
JOIN tabelas_precos tp ON ptr.tabela_id = tp.id
ORDER BY ptr.created_at DESC
LIMIT 10;

-- 9. Verificar produtos sem tabelas vinculadas
SELECT 
    'Produtos sem tabelas vinculadas:' as info;

SELECT 
    pc.id,
    pc.nome,
    pc.operadora,
    pc.tipo
FROM produtos_corretores pc
LEFT JOIN produto_tabela_relacao ptr ON pc.id = ptr.produto_id
WHERE ptr.produto_id IS NULL
AND pc.disponivel = true
ORDER BY pc.nome
LIMIT 5;

-- 10. Verificar tabelas sem produtos vinculados
SELECT 
    'Tabelas sem produtos vinculados:' as info;

SELECT 
    tp.id,
    tp.titulo,
    tp.descricao
FROM tabelas_precos tp
LEFT JOIN produto_tabela_relacao ptr ON tp.id = ptr.tabela_id
WHERE ptr.tabela_id IS NULL
AND tp.ativo = true
ORDER BY tp.titulo
LIMIT 5;

-- 11. Verificar constraints e chaves estrangeiras
SELECT 
    'Constraints das tabelas:' as info;

SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name IN ('tabelas_precos', 'produtos_corretores', 'produto_tabela_relacao')
ORDER BY tc.table_name, tc.constraint_type;

-- 12. Resumo final
SELECT 
    'RESUMO FINAL:' as info;

SELECT 
    'Total de produtos ativos: ' || COUNT(*) as resumo
FROM produtos_corretores 
WHERE disponivel = true

UNION ALL

SELECT 
    'Total de tabelas ativas: ' || COUNT(*) as resumo
FROM tabelas_precos 
WHERE ativo = true

UNION ALL

SELECT 
    'Total de vinculações: ' || COUNT(*) as resumo
FROM produto_tabela_relacao

UNION ALL

SELECT 
    'Total de faixas etárias: ' || COUNT(*) as resumo
FROM tabelas_precos_faixas;
