-- Script para verificar a estrutura das tabelas de propostas e investigar IDs

-- 1. Verificar se as tabelas existem
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_name IN ('propostas', 'propostas_corretores', 'dependentes', 'questionario_saude')
ORDER BY table_name;

-- 2. Verificar estrutura da tabela propostas
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'propostas' 
ORDER BY ordinal_position;

-- 3. Verificar estrutura da tabela propostas_corretores
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'propostas_corretores' 
ORDER BY ordinal_position;

-- 4. Verificar estrutura da tabela dependentes
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'dependentes'
ORDER BY ordinal_position;

-- 5. Verificar alguns registros de exemplo
SELECT 
    id,
    nome,
    nome_cliente,
    cpf,
    email,
    email_cliente,
    status,
    created_at
FROM propostas 
LIMIT 5;

-- 6. Verificar propostas_corretores
SELECT 
    id,
    nome_cliente,
    cpf_cliente,
    email_cliente,
    whatsapp_cliente,
    status,
    created_at
FROM propostas_corretores 
LIMIT 5;

-- 7. Verificar se existe o ID específico que está sendo testado
SELECT 
    'propostas' as tabela,
    id,
    nome,
    nome_cliente,
    status
FROM propostas 
WHERE id = '54e76c27-a2c0-46b3-b223-5dc43a264aed'

UNION ALL

SELECT 
    'propostas_corretores' as tabela,
    id,
    nome_cliente as nome,
    nome_cliente,
    status
FROM propostas_corretores 
WHERE id = '54e76c27-a2c0-46b3-b223-5dc43a264aed';

-- 8. Contar registros em cada tabela
SELECT 'propostas' as tabela, COUNT(*) as total FROM propostas
UNION ALL
SELECT 'propostas_corretores' as tabela, COUNT(*) as total FROM propostas_corretores
UNION ALL
SELECT 'dependentes' as tabela, COUNT(*) as total FROM dependentes;

-- 9. Verificar dependentes para o ID específico
SELECT 
    id,
    proposta_id,
    nome,
    parentesco,
    data_nascimento
FROM dependentes 
WHERE proposta_id = '54e76c27-a2c0-46b3-b223-5dc43a264aed';

-- 10. Verificar questionário de saúde para o ID específico
SELECT 
    id,
    proposta_id,
    pergunta_id,
    resposta,
    created_at
FROM questionario_saude 
WHERE proposta_id = '54e76c27-a2c0-46b3-b223-5dc43a264aed';

-- 11. Verificar tipos de dados dos campos ID
SELECT 
    table_name,
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name IN ('propostas', 'propostas_corretores', 'dependentes', 'questionario_saude')
AND column_name = 'id'
ORDER BY table_name;

-- 12. Verificar constraints e índices
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name IN ('propostas', 'propostas_corretores', 'dependentes', 'questionario_saude')
ORDER BY tc.table_name, tc.constraint_type;

-- 13. Verificar últimos registros criados
SELECT 
    'propostas' as origem,
    id,
    COALESCE(nome, nome_cliente) as nome,
    status,
    created_at
FROM propostas 
ORDER BY created_at DESC 
LIMIT 10

UNION ALL

SELECT 
    'propostas_corretores' as origem,
    id,
    COALESCE(cliente, nome_cliente) as nome,
    status,
    created_at
FROM propostas_corretores 
ORDER BY created_at DESC 
LIMIT 10;
