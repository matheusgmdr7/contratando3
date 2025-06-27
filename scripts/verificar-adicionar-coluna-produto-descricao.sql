-- =====================================================
-- SCRIPT: Verificar e Adicionar Coluna produto_descricao
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🔍 VERIFICANDO COLUNA produto_descricao';
    RAISE NOTICE '=====================================';
END $$;

-- 1. Verificar se a coluna produto_descricao existe na tabela propostas
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'propostas' 
        AND column_name = 'produto_descricao'
    ) THEN
        RAISE NOTICE '✅ Coluna "produto_descricao" já existe na tabela "propostas"';
    ELSE
        RAISE NOTICE '❌ Coluna "produto_descricao" NÃO existe na tabela "propostas"';
        RAISE NOTICE '📝 Adicionando coluna "produto_descricao" na tabela "propostas"...';
        
        ALTER TABLE propostas ADD COLUMN IF NOT EXISTS produto_descricao TEXT;
        
        RAISE NOTICE '✅ Coluna "produto_descricao" adicionada na tabela "propostas"';
    END IF;
END $$;

-- 2. Verificar se a coluna produto_descricao existe na tabela propostas_corretores
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'propostas_corretores' 
        AND column_name = 'produto_descricao'
    ) THEN
        RAISE NOTICE '✅ Coluna "produto_descricao" já existe na tabela "propostas_corretores"';
    ELSE
        RAISE NOTICE '❌ Coluna "produto_descricao" NÃO existe na tabela "propostas_corretores"';
        
        -- Verificar se a tabela propostas_corretores existe
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'propostas_corretores') THEN
            RAISE NOTICE '📝 Adicionando coluna "produto_descricao" na tabela "propostas_corretores"...';
            
            ALTER TABLE propostas_corretores ADD COLUMN IF NOT EXISTS produto_descricao TEXT;
            
            RAISE NOTICE '✅ Coluna "produto_descricao" adicionada na tabela "propostas_corretores"';
        ELSE
            RAISE NOTICE '⚠️ Tabela "propostas_corretores" não existe';
        END IF;
    END IF;
END $$;

-- 3. Mostrar estrutura atualizada das tabelas
SELECT 
    '📋 ESTRUTURA ATUALIZADA: propostas' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'propostas' 
    AND column_name IN ('produto_descricao', 'observacoes', 'caracteristicas_plano', 'observacao')
ORDER BY column_name;

-- 4. Verificar se há dados nas colunas relacionadas
SELECT 
    '📊 ESTATÍSTICAS: propostas' as info,
    COUNT(*) as total_propostas,
    COUNT(produto_descricao) as com_produto_descricao,
    COUNT(observacoes) as com_observacoes,
    COUNT(caracteristicas_plano) as com_caracteristicas_plano,
    COUNT(observacao) as com_observacao
FROM propostas
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'propostas');

-- 5. Exemplo de como usar a nova coluna
DO $$
BEGIN
    RAISE NOTICE '📝 EXEMPLO DE USO';
    RAISE NOTICE '================';
    RAISE NOTICE 'Para popular a coluna produto_descricao:';
    RAISE NOTICE '';
    RAISE NOTICE 'UPDATE propostas SET produto_descricao = ''Plano completo com cobertura nacional, apartamento, sem carência para consultas e exames básicos.'' WHERE id = ''sua_proposta_id'';';
    RAISE NOTICE '';
    RAISE NOTICE 'A página /proposta-digital/completar/[id] agora usa esta coluna com prioridade sobre outras descrições.';
END $$;

DO $$
BEGIN
    RAISE NOTICE '✅ VERIFICAÇÃO CONCLUÍDA';
    RAISE NOTICE '========================';
END $$;
