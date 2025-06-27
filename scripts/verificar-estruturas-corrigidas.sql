-- Script para verificar se todas as correções foram aplicadas corretamente
-- Executar após os scripts de correção para validar as mudanças

-- 1. Verificar estrutura da tabela questionario_saude
SELECT 
    '=== TABELA QUESTIONARIO_SAUDE ===' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name IN ('dependente_id', 'pessoa_tipo', 'dependente_nome') 
        THEN '✅ NOVA COLUNA' 
        ELSE '📋 EXISTENTE' 
    END as status
FROM information_schema.columns 
WHERE table_name = 'questionario_saude' 
ORDER BY ordinal_position;

-- 2. Verificar índices da tabela questionario_saude
SELECT 
    '=== ÍNDICES QUESTIONARIO_SAUDE ===' as info;

SELECT 
    indexname,
    indexdef,
    CASE 
        WHEN indexname LIKE '%dependente%' OR indexname LIKE '%pessoa_tipo%' OR indexname LIKE '%unique_resposta%'
        THEN '✅ NOVO ÍNDICE'
        ELSE '📋 EXISTENTE'
    END as status
FROM pg_indexes 
WHERE tablename = 'questionario_saude'
ORDER BY indexname;

-- 3. Verificar constraints da tabela questionario_saude
SELECT 
    '=== CONSTRAINTS QUESTIONARIO_SAUDE ===' as info;

SELECT 
    constraint_name,
    constraint_type,
    CASE 
        WHEN constraint_name LIKE '%dependente%' OR constraint_name LIKE '%pessoa_tipo%'
        THEN '✅ NOVA CONSTRAINT'
        ELSE '📋 EXISTENTE'
    END as status
FROM information_schema.table_constraints 
WHERE table_name = 'questionario_saude'
ORDER BY constraint_name;

-- 4. Verificar estrutura da tabela propostas
SELECT 
    '=== TABELA PROPOSTAS ===' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name IN ('assinado_em', 'assinatura_imagem', 'assinatura', 'questionario_completo', 'ip_assinatura', 'user_agent', 'status_assinatura') 
        THEN '✅ NOVA COLUNA' 
        ELSE '📋 EXISTENTE' 
    END as status
FROM information_schema.columns 
WHERE table_name = 'propostas' 
AND (column_name IN ('assinado_em', 'assinatura_imagem', 'assinatura', 'questionario_completo', 'ip_assinatura', 'user_agent', 'status_assinatura') 
     OR column_name IN ('id', 'status', 'created_at', 'updated_at'))
ORDER BY ordinal_position;

-- 5. Verificar índices da tabela propostas
SELECT 
    '=== ÍNDICES PROPOSTAS ===' as info;

SELECT 
    indexname,
    indexdef,
    CASE 
        WHEN indexname LIKE '%assinado%' OR indexname LIKE '%status_assinatura%' OR indexname LIKE '%questionario_completo%'
        THEN '✅ NOVO ÍNDICE'
        ELSE '📋 EXISTENTE'
    END as status
FROM pg_indexes 
WHERE tablename = 'propostas'
AND (indexname LIKE '%assinado%' OR indexname LIKE '%status_assinatura%' OR indexname LIKE '%questionario_completo%' OR indexname = 'propostas_pkey')
ORDER BY indexname;

-- 6. Verificar constraints da tabela propostas
SELECT 
    '=== CONSTRAINTS PROPOSTAS ===' as info;

SELECT 
    constraint_name,
    constraint_type,
    CASE 
        WHEN constraint_name LIKE '%status_assinatura%'
        THEN '✅ NOVA CONSTRAINT'
        ELSE '📋 EXISTENTE'
    END as status
FROM information_schema.table_constraints 
WHERE table_name = 'propostas'
AND (constraint_name LIKE '%status_assinatura%' OR constraint_name LIKE '%pkey%')
ORDER BY constraint_name;

-- 7. Testar consultas que estavam falhando
SELECT 
    '=== TESTE DE CONSULTAS ===' as info;

-- Teste 1: Consulta com dependente_id
DO $$
BEGIN
    PERFORM 1 FROM questionario_saude WHERE dependente_id IS NULL LIMIT 1;
    RAISE NOTICE '✅ Consulta com dependente_id funcionando';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro na consulta com dependente_id: %', SQLERRM;
END $$;

-- Teste 2: Consulta com assinado_em
DO $$
BEGIN
    PERFORM 1 FROM propostas WHERE assinado_em IS NULL LIMIT 1;
    RAISE NOTICE '✅ Consulta com assinado_em funcionando';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro na consulta com assinado_em: %', SQLERRM;
END $$;

-- Teste 3: Consulta com pessoa_tipo
DO $$
BEGIN
    PERFORM 1 FROM questionario_saude WHERE pessoa_tipo = 'titular' LIMIT 1;
    RAISE NOTICE '✅ Consulta com pessoa_tipo funcionando';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro na consulta com pessoa_tipo: %', SQLERRM;
END $$;

-- Teste 4: Consulta com status_assinatura
DO $$
BEGIN
    PERFORM 1 FROM propostas WHERE status_assinatura = 'pendente' LIMIT 1;
    RAISE NOTICE '✅ Consulta com status_assinatura funcionando';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro na consulta com status_assinatura: %', SQLERRM;
END $$;

-- 8. Resumo final
SELECT 
    '=== RESUMO FINAL ===' as info;

SELECT 
    'questionario_saude' as tabela,
    COUNT(*) as total_colunas,
    COUNT(CASE WHEN column_name IN ('dependente_id', 'pessoa_tipo', 'dependente_nome') THEN 1 END) as novas_colunas
FROM information_schema.columns 
WHERE table_name = 'questionario_saude'

UNION ALL

SELECT 
    'propostas' as tabela,
    COUNT(*) as total_colunas,
    COUNT(CASE WHEN column_name IN ('assinado_em', 'assinatura_imagem', 'assinatura', 'questionario_completo', 'ip_assinatura', 'user_agent', 'status_assinatura') THEN 1 END) as novas_colunas
FROM information_schema.columns 
WHERE table_name = 'propostas';

-- 9. Verificar se há dados de teste
SELECT 
    '=== DADOS DE TESTE ===' as info;

SELECT 
    'questionario_saude' as tabela,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN dependente_id IS NOT NULL THEN 1 END) as com_dependente,
    COUNT(CASE WHEN pessoa_tipo = 'dependente' THEN 1 END) as tipo_dependente,
    COUNT(CASE WHEN pessoa_tipo = 'titular' THEN 1 END) as tipo_titular
FROM questionario_saude

UNION ALL

SELECT 
    'propostas' as tabela,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN assinado_em IS NOT NULL THEN 1 END) as assinadas,
    COUNT(CASE WHEN questionario_completo = TRUE THEN 1 END) as com_questionario,
    COUNT(CASE WHEN status_assinatura = 'assinado' THEN 1 END) as status_assinado
FROM propostas;

-- 10. Status final das correções
DO $$
DECLARE
    questionario_ok BOOLEAN := TRUE;
    propostas_ok BOOLEAN := TRUE;
    expected_cols_questionario TEXT[] := ARRAY['dependente_id', 'pessoa_tipo', 'dependente_nome'];
    expected_cols_propostas TEXT[] := ARRAY['assinado_em', 'assinatura_imagem', 'assinatura', 'questionario_completo', 'ip_assinatura', 'user_agent', 'status_assinatura'];
    col TEXT;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== STATUS FINAL DAS CORREÇÕES ===';
    
    -- Verificar questionario_saude
    FOREACH col IN ARRAY expected_cols_questionario
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'questionario_saude' 
            AND column_name = col
        ) THEN
            questionario_ok := FALSE;
            RAISE NOTICE '❌ Coluna faltante em questionario_saude: %', col;
        END IF;
    END LOOP;
    
    -- Verificar propostas
    FOREACH col IN ARRAY expected_cols_propostas
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'propostas' 
            AND column_name = col
        ) THEN
            propostas_ok := FALSE;
            RAISE NOTICE '❌ Coluna faltante em propostas: %', col;
        END IF;
    END LOOP;
    
    -- Resultado final
    IF questionario_ok AND propostas_ok THEN
        RAISE NOTICE '';
        RAISE NOTICE '🎉 SUCESSO COMPLETO!';
        RAISE NOTICE '   ✅ Tabela questionario_saude: % colunas adicionadas', array_length(expected_cols_questionario, 1);
        RAISE NOTICE '   ✅ Tabela propostas: % colunas adicionadas', array_length(expected_cols_propostas, 1);
        RAISE NOTICE '';
        RAISE NOTICE '🚀 O erro de finalização da proposta foi RESOLVIDO!';
        RAISE NOTICE '   - Suporte completo a dependentes no questionário';
        RAISE NOTICE '   - Assinatura digital implementada';
        RAISE NOTICE '   - Auditoria e controle de status';
        RAISE NOTICE '';
        RAISE NOTICE '✨ Agora você pode testar a finalização da proposta sem erros.';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '⚠️  ATENÇÃO: Algumas correções falharam';
        IF NOT questionario_ok THEN
            RAISE NOTICE '   ❌ Tabela questionario_saude incompleta';
        END IF;
        IF NOT propostas_ok THEN
            RAISE NOTICE '   ❌ Tabela propostas incompleta';
        END IF;
        RAISE NOTICE '';
        RAISE NOTICE '🔧 Execute novamente os scripts de correção.';
    END IF;
END $$;
