-- INVESTIGAÇÃO COMPLETA DOS DOCUMENTOS DAS PROPOSTAS
-- Este script vai nos ajudar a entender onde os documentos estão sendo salvos

-- 1. Verificar estrutura da tabela propostas
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'propostas' 
    AND table_schema = 'public'
    AND column_name LIKE '%documento%'
ORDER BY ordinal_position;

-- 2. Verificar se existe tabela separada para documentos
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name LIKE '%documento%';

-- 3. Buscar propostas com documentos (primeiras 5)
SELECT 
    id,
    nome_cliente,
    nome,
    email,
    status,
    created_at,
    -- Verificar todos os campos possíveis de documentos
    documentos_urls,
    documentos,
    anexos,
    arquivos,
    -- Verificar campos específicos
    rg_frente_url,
    rg_verso_url,
    cpf_url,
    comprovante_residencia_url,
    cns_url
FROM propostas 
WHERE created_at >= NOW() - INTERVAL '30 days'
ORDER BY created_at DESC 
LIMIT 5;

-- 4. Contar propostas com documentos em diferentes campos
SELECT 
    'documentos_urls' as campo,
    COUNT(*) as total_com_dados,
    COUNT(*) FILTER (WHERE documentos_urls IS NOT NULL AND documentos_urls != '{}') as com_documentos_validos
FROM propostas
UNION ALL
SELECT 
    'documentos' as campo,
    COUNT(*) as total_com_dados,
    COUNT(*) FILTER (WHERE documentos IS NOT NULL AND documentos != '{}') as com_documentos_validos
FROM propostas
UNION ALL
SELECT 
    'anexos' as campo,
    COUNT(*) as total_com_dados,
    COUNT(*) FILTER (WHERE anexos IS NOT NULL AND anexos != '{}') as com_documentos_validos
FROM propostas;

-- 5. Verificar estrutura da tabela dependentes
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('dependentes', 'dependentes_propostas', 'proposta_dependentes')
    AND table_schema = 'public'
    AND column_name LIKE '%documento%'
ORDER BY table_name, ordinal_position;

-- 6. Buscar dependentes com documentos
SELECT 
    d.id,
    d.nome,
    d.proposta_id,
    d.documentos_urls,
    d.documentos,
    d.anexos,
    p.nome_cliente as titular_nome
FROM dependentes d
LEFT JOIN propostas p ON d.proposta_id = p.id
WHERE d.created_at >= NOW() - INTERVAL '30 days'
ORDER BY d.created_at DESC 
LIMIT 5;

-- 7. Verificar se existe tabela específica para documentos
SELECT 
    t.table_name,
    c.column_name,
    c.data_type
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public' 
    AND t.table_name LIKE '%documento%'
    AND c.column_name IN ('proposta_id', 'dependente_id', 'tipo', 'url', 'arquivo_url')
ORDER BY t.table_name, c.ordinal_position;
