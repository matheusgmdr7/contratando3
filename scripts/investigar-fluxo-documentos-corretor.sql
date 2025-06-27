-- INVESTIGAÇÃO COMPLETA: ONDE OS DOCUMENTOS DO CORRETOR SÃO SALVOS
-- ================================================================

-- 1. VERIFICAR ESTRUTURA DA TABELA propostas_corretores
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'propostas_corretores' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. VERIFICAR ESTRUTURA DA TABELA propostas (tabela principal)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'propostas' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. BUSCAR PROPOSTAS RECENTES COM DOCUMENTOS
SELECT 
    id,
    cliente,
    email_cliente,
    status,
    created_at,
    -- Verificar campos de documentos possíveis
    CASE WHEN documentos_urls IS NOT NULL THEN 'SIM' ELSE 'NÃO' END as tem_documentos_urls,
    CASE WHEN documentos IS NOT NULL THEN 'SIM' ELSE 'NÃO' END as tem_documentos,
    CASE WHEN anexos IS NOT NULL THEN 'SIM' ELSE 'NÃO' END as tem_anexos,
    CASE WHEN arquivos IS NOT NULL THEN 'SIM' ELSE 'NÃO' END as tem_arquivos,
    -- Verificar campos individuais
    CASE WHEN rg_frente_url IS NOT NULL THEN 'SIM' ELSE 'NÃO' END as tem_rg_frente,
    CASE WHEN rg_verso_url IS NOT NULL THEN 'SIM' ELSE 'NÃO' END as tem_rg_verso,
    CASE WHEN cpf_url IS NOT NULL THEN 'SIM' ELSE 'NÃO' END as tem_cpf,
    CASE WHEN comprovante_residencia_url IS NOT NULL THEN 'SIM' ELSE 'NÃO' END as tem_comprovante,
    CASE WHEN cns_url IS NOT NULL THEN 'SIM' ELSE 'NÃO' END as tem_cns
FROM propostas_corretores 
ORDER BY created_at DESC 
LIMIT 10;

-- 4. BUSCAR NA TABELA propostas TAMBÉM
SELECT 
    id,
    nome_cliente,
    nome,
    email,
    status,
    created_at,
    -- Verificar campos de documentos possíveis
    CASE WHEN documentos_urls IS NOT NULL THEN 'SIM' ELSE 'NÃO' END as tem_documentos_urls,
    CASE WHEN documentos IS NOT NULL THEN 'SIM' ELSE 'NÃO' END as tem_documentos,
    CASE WHEN anexos IS NOT NULL THEN 'SIM' ELSE 'NÃO' END as tem_anexos,
    CASE WHEN arquivos IS NOT NULL THEN 'SIM' ELSE 'NÃO' END as tem_arquivos
FROM propostas 
ORDER BY created_at DESC 
LIMIT 10;

-- 5. VERIFICAR SE EXISTE TABELA SEPARADA PARA DOCUMENTOS
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name LIKE '%documento%'
ORDER BY table_name;

-- 6. VERIFICAR SE EXISTE TABELA SEPARADA PARA ANEXOS
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND (table_name LIKE '%anexo%' OR table_name LIKE '%arquivo%' OR table_name LIKE '%upload%')
ORDER BY table_name;

-- 7. BUSCAR PROPOSTAS COM DOCUMENTOS REAIS (não nulos)
SELECT 
    id,
    cliente,
    email_cliente,
    status,
    created_at,
    documentos_urls,
    documentos_dependentes_urls
FROM propostas_corretores 
WHERE documentos_urls IS NOT NULL 
    OR documentos_dependentes_urls IS NOT NULL
ORDER BY created_at DESC 
LIMIT 5;

-- 8. VERIFICAR STORAGE DO SUPABASE
SELECT 
    name as bucket_name,
    created_at,
    updated_at,
    public
FROM storage.buckets
ORDER BY created_at;

-- 9. VERIFICAR ARQUIVOS NO STORAGE (se existir)
SELECT 
    name,
    bucket_id,
    created_at,
    updated_at,
    metadata
FROM storage.objects 
WHERE bucket_id = 'documentos_propostas'
ORDER BY created_at DESC 
LIMIT 10;

-- 10. ANÁLISE FINAL: CONTAR PROPOSTAS POR TIPO DE DOCUMENTO
SELECT 
    'propostas_corretores' as tabela,
    COUNT(*) as total_propostas,
    COUNT(documentos_urls) as com_documentos_urls,
    COUNT(documentos_dependentes_urls) as com_docs_dependentes,
    COUNT(rg_frente_url) as com_rg_frente,
    COUNT(cpf_url) as com_cpf
FROM propostas_corretores

UNION ALL

SELECT 
    'propostas' as tabela,
    COUNT(*) as total_propostas,
    COUNT(documentos_urls) as com_documentos_urls,
    0 as com_docs_dependentes,
    0 as com_rg_frente,
    0 as com_cpf
FROM propostas;
