-- Script para verificar a estrutura completa da tabela propostas
-- Execute este script no Supabase SQL Editor

-- 1. Verificar estrutura da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'propostas' 
ORDER BY ordinal_position;

-- 2. Verificar índices
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'propostas';

-- 3. Verificar constraints
SELECT 
    constraint_name,
    constraint_type,
    column_name
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu 
    ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_name = 'propostas';

-- 4. Contar registros por status
SELECT 
    status,
    COUNT(*) as total
FROM propostas 
GROUP BY status 
ORDER BY total DESC;

-- 5. Verificar campos mais vazios (top 10)
SELECT 
    'nome_cliente' as campo,
    COUNT(*) as total_registros,
    COUNT(nome_cliente) as preenchidos,
    COUNT(*) - COUNT(nome_cliente) as vazios,
    ROUND((COUNT(*) - COUNT(nome_cliente)) * 100.0 / COUNT(*), 2) as percentual_vazio
FROM propostas
UNION ALL
SELECT 
    'email',
    COUNT(*),
    COUNT(email),
    COUNT(*) - COUNT(email),
    ROUND((COUNT(*) - COUNT(email)) * 100.0 / COUNT(*), 2)
FROM propostas
UNION ALL
SELECT 
    'cpf',
    COUNT(*),
    COUNT(cpf),
    COUNT(*) - COUNT(cpf),
    ROUND((COUNT(*) - COUNT(cpf)) * 100.0 / COUNT(*), 2)
FROM propostas
UNION ALL
SELECT 
    'telefone',
    COUNT(*),
    COUNT(telefone),
    COUNT(*) - COUNT(telefone),
    ROUND((COUNT(*) - COUNT(telefone)) * 100.0 / COUNT(*), 2)
FROM propostas
UNION ALL
SELECT 
    'endereco',
    COUNT(*),
    COUNT(endereco),
    COUNT(*) - COUNT(endereco),
    ROUND((COUNT(*) - COUNT(endereco)) * 100.0 / COUNT(*), 2)
FROM propostas
ORDER BY percentual_vazio DESC;

-- 6. Verificar últimas 5 propostas com campos principais
SELECT 
    id,
    created_at,
    nome_cliente,
    email,
    cpf,
    telefone,
    endereco,
    status,
    CASE 
        WHEN nome_cliente IS NULL OR nome_cliente = '' THEN 'VAZIO'
        ELSE 'OK'
    END as nome_status,
    CASE 
        WHEN email IS NULL OR email = '' THEN 'VAZIO'
        ELSE 'OK'
    END as email_status,
    CASE 
        WHEN cpf IS NULL OR cpf = '' THEN 'VAZIO'
        ELSE 'OK'
    END as cpf_status
FROM propostas 
ORDER BY created_at DESC 
LIMIT 5;

-- 7. Verificar se existem conflitos de tipo de dados
SELECT 
    id,
    nome_cliente,
    pg_typeof(nome_cliente) as tipo_nome,
    email,
    pg_typeof(email) as tipo_email,
    cpf,
    pg_typeof(cpf) as tipo_cpf,
    valor_plano,
    pg_typeof(valor_plano) as tipo_valor
FROM propostas 
WHERE id IS NOT NULL
LIMIT 3;
