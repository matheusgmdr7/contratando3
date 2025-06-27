-- Script para testar se a tabela unificada está funcionando corretamente

-- 1. VERIFICAR ESTRUTURA DA TABELA PROPOSTAS
SELECT 
    'ESTRUTURA_PROPOSTAS' as verificacao,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'propostas' 
AND column_name IN (
    'id', 'corretor_id', 'corretor_nome', 'nome', 'nome_cliente', 'cliente',
    'email', 'email_cliente', 'telefone', 'telefone_cliente', 'whatsapp_cliente',
    'produto_id', 'produto', 'valor', 'valor_proposta', 'status', 'created_at'
)
ORDER BY column_name;

-- 2. VERIFICAR DADOS EXISTENTES
SELECT 
    'DADOS_EXISTENTES' as verificacao,
    COUNT(*) as total_propostas,
    COUNT(CASE WHEN corretor_id IS NOT NULL THEN 1 END) as propostas_corretores,
    COUNT(CASE WHEN corretor_id IS NULL THEN 1 END) as propostas_diretas,
    COUNT(CASE WHEN status = 'pendente' THEN 1 END) as pendentes,
    COUNT(CASE WHEN status = 'aprovada' THEN 1 END) as aprovadas,
    COUNT(CASE WHEN status = 'rejeitada' THEN 1 END) as rejeitadas
FROM propostas;

-- 3. VERIFICAR CAMPOS ESSENCIAIS
SELECT 
    'CAMPOS_ESSENCIAIS' as verificacao,
    COUNT(CASE WHEN nome IS NOT NULL OR nome_cliente IS NOT NULL OR cliente IS NOT NULL THEN 1 END) as com_nome,
    COUNT(CASE WHEN email IS NOT NULL OR email_cliente IS NOT NULL THEN 1 END) as com_email,
    COUNT(CASE WHEN telefone IS NOT NULL OR telefone_cliente IS NOT NULL OR whatsapp_cliente IS NOT NULL THEN 1 END) as com_telefone,
    COUNT(CASE WHEN produto_id IS NOT NULL OR produto IS NOT NULL THEN 1 END) as com_produto,
    COUNT(CASE WHEN valor IS NOT NULL OR valor_proposta IS NOT NULL THEN 1 END) as com_valor
FROM propostas;

-- 4. VERIFICAR DOCUMENTOS
SELECT 
    'DOCUMENTOS' as verificacao,
    COUNT(CASE WHEN documentos_urls IS NOT NULL THEN 1 END) as com_documentos_json,
    COUNT(CASE WHEN rg_frente_url IS NOT NULL THEN 1 END) as com_rg_frente,
    COUNT(CASE WHEN rg_verso_url IS NOT NULL THEN 1 END) as com_rg_verso,
    COUNT(CASE WHEN cpf_url IS NOT NULL THEN 1 END) as com_cpf,
    COUNT(CASE WHEN comprovante_residencia_url IS NOT NULL THEN 1 END) as com_comprovante,
    COUNT(CASE WHEN cns_url IS NOT NULL THEN 1 END) as com_cns
FROM propostas;

-- 5. VERIFICAR DEPENDENTES
SELECT 
    'DEPENDENTES' as verificacao,
    COUNT(*) as total_dependentes,
    COUNT(DISTINCT proposta_id) as propostas_com_dependentes
FROM dependentes;

-- 6. VERIFICAR QUESTIONÁRIOS DE SAÚDE
SELECT 
    'QUESTIONARIOS_SAUDE' as verificacao,
    COUNT(*) as total_respostas,
    COUNT(DISTINCT proposta_id) as propostas_com_questionario,
    COUNT(DISTINCT dependente_id) as dependentes_com_questionario
FROM questionario_saude;

-- 7. VERIFICAR INTEGRIDADE DOS DADOS
SELECT 
    'INTEGRIDADE_CORRETORES' as verificacao,
    COUNT(p.*) as propostas_com_corretor,
    COUNT(c.*) as corretores_encontrados,
    COUNT(p.*) - COUNT(c.*) as corretores_nao_encontrados
FROM propostas p
LEFT JOIN corretores c ON p.corretor_id = c.id
WHERE p.corretor_id IS NOT NULL;

-- 8. VERIFICAR PRODUTOS
SELECT 
    'INTEGRIDADE_PRODUTOS' as verificacao,
    COUNT(p.*) as propostas_com_produto_id,
    COUNT(pc.*) as produtos_encontrados,
    COUNT(p.*) - COUNT(pc.*) as produtos_nao_encontrados
FROM propostas p
LEFT JOIN produtos_corretores pc ON p.produto_id::text = pc.id::text
WHERE p.produto_id IS NOT NULL;

-- 9. VERIFICAR TEMPLATES
SELECT 
    'INTEGRIDADE_TEMPLATES' as verificacao,
    COUNT(p.*) as propostas_com_template,
    COUNT(mp.*) as templates_encontrados,
    COUNT(p.*) - COUNT(mp.*) as templates_nao_encontrados
FROM propostas p
LEFT JOIN modelos_propostas mp ON p.template_id = mp.id OR p.modelo_id = mp.id
WHERE p.template_id IS NOT NULL OR p.modelo_id IS NOT NULL;

-- 10. AMOSTRA DE DADOS
SELECT 
    'AMOSTRA_DADOS' as verificacao,
    id,
    COALESCE(nome, nome_cliente, cliente) as nome_unificado,
    COALESCE(email, email_cliente) as email_unificado,
    COALESCE(telefone, telefone_cliente, whatsapp_cliente) as telefone_unificado,
    CASE WHEN corretor_id IS NOT NULL THEN 'Via Corretor' ELSE 'Direto' END as origem,
    status,
    COALESCE(valor, valor_proposta, valor_plano) as valor_unificado,
    created_at
FROM propostas
ORDER BY created_at DESC
LIMIT 5;

-- 11. VERIFICAR BUCKETS DE STORAGE
SELECT 
    'BUCKETS_STORAGE' as verificacao,
    name as bucket_name,
    public,
    created_at
FROM storage.buckets
WHERE name IN ('documentos-propostas', 'documentos-propostas-corretores');

-- 12. VERIFICAR POLÍTICAS DE STORAGE
SELECT 
    'POLITICAS_STORAGE' as verificacao,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
AND policyname LIKE '%documentos-propostas%';

RAISE NOTICE '✅ TESTE DA TABELA UNIFICADA CONCLUÍDO!';
RAISE NOTICE 'Verifique os resultados acima para garantir que tudo está funcionando corretamente.';
RAISE NOTICE '';
RAISE NOTICE '📋 PRÓXIMOS PASSOS:';
RAISE NOTICE '1. Execute o script de migração se houver dados em propostas_corretores';
RAISE NOTICE '2. Teste a criação de novas propostas via corretor';
RAISE NOTICE '3. Teste a visualização de propostas no admin';
RAISE NOTICE '4. Verifique se os documentos estão sendo salvos corretamente';
