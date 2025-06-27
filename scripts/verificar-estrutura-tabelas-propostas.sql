-- Verificar estrutura da tabela propostas
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'propostas' 
ORDER BY ordinal_position;

-- Verificar estrutura da tabela propostas_corretores
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'propostas_corretores' 
ORDER BY ordinal_position;

-- Verificar se as tabelas existem e quantos registros têm
SELECT 
    'propostas' as tabela,
    COUNT(*) as total_registros
FROM propostas
UNION ALL
SELECT 
    'propostas_corretores' as tabela,
    COUNT(*) as total_registros
FROM propostas_corretores;

-- Verificar alguns registros de exemplo para entender a estrutura
SELECT 
    id,
    nome,
    email,
    status,
    created_at
FROM propostas 
LIMIT 5;

SELECT 
    id,
    nome,
    email,
    status,
    created_at
FROM propostas_corretores 
LIMIT 5;
