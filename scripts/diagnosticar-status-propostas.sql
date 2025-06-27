-- Diagnóstico completo dos status das propostas

-- 1. Verificar todos os status existentes na tabela propostas_corretores
SELECT 
    status,
    COUNT(*) as quantidade,
    MIN(created_at) as primeira_ocorrencia,
    MAX(created_at) as ultima_ocorrencia
FROM propostas_corretores 
GROUP BY status 
ORDER BY quantidade DESC;

-- 2. Verificar estrutura da coluna status
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'propostas_corretores' 
AND column_name = 'status';

-- 3. Verificar se existe tabela propostas (antiga)
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_name IN ('propostas', 'propostas_corretores');

-- 4. Se existir tabela propostas, comparar status
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'propostas') THEN
        RAISE NOTICE 'Tabela propostas existe - comparando status:';
        
        -- Status da tabela propostas
        PERFORM 1; -- Placeholder para evitar erro de sintaxe
    END IF;
END $$;

-- 5. Verificar últimas 10 propostas com detalhes
SELECT 
    id,
    cliente,
    email_cliente,
    status,
    created_at,
    updated_at,
    email_enviado_em,
    email_validacao_enviado,
    assinatura_digital_url,
    questionario_saude_completo
FROM propostas_corretores 
ORDER BY created_at DESC 
LIMIT 10;

-- 6. Verificar se há propostas sem status definido
SELECT 
    COUNT(*) as propostas_sem_status
FROM propostas_corretores 
WHERE status IS NULL OR status = '';

-- 7. Verificar padrões de status inválidos
SELECT 
    status,
    COUNT(*) as quantidade
FROM propostas_corretores 
WHERE status NOT IN ('parcial', 'pendente', 'aprovada', 'rejeitada', 'aguardando_cliente')
GROUP BY status;
