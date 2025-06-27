-- Verificar a estrutura atual da tabela propostas_corretores
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'propostas_corretores' 
ORDER BY ordinal_position;

-- Verificar se existem colunas relacionadas a documentos
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'propostas_corretores' 
AND (
    column_name LIKE '%documento%' OR 
    column_name LIKE '%url%' OR
    column_name LIKE '%rg%' OR
    column_name LIKE '%cpf%' OR
    column_name LIKE '%cns%'
)
ORDER BY column_name;

-- Verificar índices existentes
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'propostas_corretores';
