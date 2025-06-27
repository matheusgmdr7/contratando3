-- Script para verificar e corrigir tipos de ID nas tabelas de propostas

-- 1. Verificar estrutura atual da tabela propostas_corretores
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'propostas_corretores' 
    AND column_name = 'id';

-- 2. Verificar se há registros e seus tipos de ID
SELECT 
    id,
    pg_typeof(id) as tipo_id,
    cliente,
    created_at
FROM propostas_corretores 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. Verificar estrutura da tabela propostas (antiga)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'propostas' 
    AND column_name = 'id';

-- 4. Comparar tipos de ID entre as tabelas
SELECT 
    'propostas_corretores' as tabela,
    data_type as tipo_id
FROM information_schema.columns 
WHERE table_name = 'propostas_corretores' AND column_name = 'id'

UNION ALL

SELECT 
    'propostas' as tabela,
    data_type as tipo_id
FROM information_schema.columns 
WHERE table_name = 'propostas' AND column_name = 'id';

-- 5. Se necessário, corrigir tipo de ID para BIGINT auto-increment
-- (Descomente apenas se necessário após verificar os resultados acima)

/*
-- Backup da tabela antes de alterar
CREATE TABLE propostas_corretores_backup AS 
SELECT * FROM propostas_corretores;

-- Alterar tipo de ID se estiver como UUID
ALTER TABLE propostas_corretores 
ALTER COLUMN id TYPE BIGINT;

-- Adicionar auto-increment se não existir
CREATE SEQUENCE IF NOT EXISTS propostas_corretores_id_seq;
ALTER TABLE propostas_corretores 
ALTER COLUMN id SET DEFAULT nextval('propostas_corretores_id_seq');
ALTER SEQUENCE propostas_corretores_id_seq OWNED BY propostas_corretores.id;

-- Atualizar sequência para próximo valor
SELECT setval('propostas_corretores_id_seq', COALESCE(MAX(id), 1)) FROM propostas_corretores;
*/

-- 6. Verificar registros problemáticos (IDs que não são numéricos)
SELECT 
    id,
    cliente,
    CASE 
        WHEN id ~ '^[0-9]+$' THEN 'NUMÉRICO'
        ELSE 'NÃO NUMÉRICO (POSSÍVEL UUID)'
    END as tipo_detectado
FROM propostas_corretores
WHERE id IS NOT NULL
ORDER BY created_at DESC;
