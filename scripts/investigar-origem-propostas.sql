-- Investigação completa da origem das propostas

-- 1. Verificar TODAS as tabelas que podem conter propostas
SELECT 
    schemaname,
    tablename,
    n_tup_ins as total_inseridos,
    n_tup_upd as total_atualizados,
    n_tup_del as total_deletados
FROM pg_stat_user_tables 
WHERE tablename LIKE '%proposta%' 
ORDER BY n_tup_ins DESC;

-- 2. Contar registros em cada tabela de propostas
DO $$
DECLARE
    table_record RECORD;
    count_result INTEGER;
BEGIN
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE tablename LIKE '%proposta%' 
        AND schemaname = 'public'
    LOOP
        EXECUTE format('SELECT COUNT(*) FROM %I', table_record.tablename) INTO count_result;
        RAISE NOTICE 'Tabela %: % registros', table_record.tablename, count_result;
    END LOOP;
END $$;

-- 3. Verificar estrutura da tabela propostas_corretores
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'propostas_corretores' 
ORDER BY ordinal_position;

-- 4. Mostrar TODAS as propostas com detalhes de criação
SELECT 
    id,
    cliente,
    email_cliente,
    status,
    created_at,
    updated_at,
    corretor_id,
    corretor_nome,
    'propostas_corretores' as origem_tabela
FROM propostas_corretores 
ORDER BY created_at DESC;

-- 5. Verificar se existe tabela propostas (antiga) e mostrar dados
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'propostas') THEN
        RAISE NOTICE 'ATENÇÃO: Tabela propostas (antiga) existe!';
        
        -- Mostrar dados da tabela antiga
        RAISE NOTICE 'Dados da tabela propostas:';
    ELSE
        RAISE NOTICE 'Tabela propostas (antiga) NÃO existe';
    END IF;
END $$;

-- 6. Verificar últimas inserções por data
SELECT 
    DATE(created_at) as data_criacao,
    COUNT(*) as quantidade_propostas,
    array_agg(DISTINCT status) as status_encontrados,
    array_agg(DISTINCT corretor_nome) as corretores
FROM propostas_corretores 
GROUP BY DATE(created_at)
ORDER BY data_criacao DESC;

-- 7. Verificar se há dados duplicados ou inconsistentes
SELECT 
    cliente,
    email_cliente,
    COUNT(*) as quantidade_duplicatas
FROM propostas_corretores 
GROUP BY cliente, email_cliente
HAVING COUNT(*) > 1;

-- 8. Mostrar configuração de status padrão
SELECT 
    column_name,
    column_default,
    data_type
FROM information_schema.columns 
WHERE table_name = 'propostas_corretores' 
AND column_name IN ('status', 'created_at', 'updated_at');
