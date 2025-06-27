-- Verificar se a tabela propostas existe e sua estrutura
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'propostas' 
ORDER BY ordinal_position;

-- Verificar algumas propostas de exemplo
SELECT 
    id,
    nome,
    email,
    corretor_nome,
    status,
    created_at
FROM propostas 
ORDER BY created_at DESC 
LIMIT 10;

-- Verificar se existem propostas com status 'parcial' (enviadas pelo corretor)
SELECT 
    COUNT(*) as total_propostas,
    status,
    corretor_nome
FROM propostas 
GROUP BY status, corretor_nome
ORDER BY status;
