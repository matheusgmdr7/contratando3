-- Script para corrigir a estrutura da tabela propostas
-- Adiciona suporte para assinatura digital e controle de questionário

-- 1. Verificar se a tabela existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'propostas') THEN
        RAISE EXCEPTION 'Tabela propostas não encontrada!';
    END IF;
    RAISE NOTICE '✅ Tabela propostas encontrada';
END $$;

-- 2. Adicionar coluna assinado_em se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'propostas' 
        AND column_name = 'assinado_em'
    ) THEN
        ALTER TABLE propostas 
        ADD COLUMN assinado_em TIMESTAMPTZ NULL;
        
        RAISE NOTICE '✅ Coluna assinado_em adicionada';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna assinado_em já existe';
    END IF;
END $$;

-- 3. Adicionar coluna assinatura_imagem se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'propostas' 
        AND column_name = 'assinatura_imagem'
    ) THEN
        ALTER TABLE propostas 
        ADD COLUMN assinatura_imagem TEXT NULL;
        
        RAISE NOTICE '✅ Coluna assinatura_imagem adicionada';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna assinatura_imagem já existe';
    END IF;
END $$;

-- 4. Adicionar coluna assinatura (dados JSON) se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'propostas' 
        AND column_name = 'assinatura'
    ) THEN
        ALTER TABLE propostas 
        ADD COLUMN assinatura TEXT NULL;
        
        RAISE NOTICE '✅ Coluna assinatura adicionada';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna assinatura já existe';
    END IF;
END $$;

-- 5. Adicionar coluna questionario_completo se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'propostas' 
        AND column_name = 'questionario_completo'
    ) THEN
        ALTER TABLE propostas 
        ADD COLUMN questionario_completo BOOLEAN DEFAULT FALSE;
        
        -- Atualizar registros existentes
        UPDATE propostas 
        SET questionario_completo = FALSE 
        WHERE questionario_completo IS NULL;
        
        RAISE NOTICE '✅ Coluna questionario_completo adicionada';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna questionario_completo já existe';
    END IF;
END $$;

-- 6. Adicionar coluna ip_assinatura se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'propostas' 
        AND column_name = 'ip_assinatura'
    ) THEN
        ALTER TABLE propostas 
        ADD COLUMN ip_assinatura INET NULL;
        
        RAISE NOTICE '✅ Coluna ip_assinatura adicionada';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna ip_assinatura já existe';
    END IF;
END $$;

-- 7. Adicionar coluna user_agent se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'propostas' 
        AND column_name = 'user_agent'
    ) THEN
        ALTER TABLE propostas 
        ADD COLUMN user_agent TEXT NULL;
        
        RAISE NOTICE '✅ Coluna user_agent adicionada';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna user_agent já existe';
    END IF;
END $$;

-- 8. Adicionar coluna status_assinatura se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'propostas' 
        AND column_name = 'status_assinatura'
    ) THEN
        ALTER TABLE propostas 
        ADD COLUMN status_assinatura VARCHAR(20) DEFAULT 'pendente';
        
        -- Atualizar registros existentes baseado no status atual
        UPDATE propostas 
        SET status_assinatura = CASE 
            WHEN status = 'finalizada' THEN 'assinado'
            WHEN status = 'rejeitada' THEN 'rejeitado'
            ELSE 'pendente'
        END
        WHERE status_assinatura IS NULL OR status_assinatura = 'pendente';
        
        RAISE NOTICE '✅ Coluna status_assinatura adicionada';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna status_assinatura já existe';
    END IF;
END $$;

-- 9. Adicionar constraint para status_assinatura
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'propostas_status_assinatura_check'
    ) THEN
        ALTER TABLE propostas 
        ADD CONSTRAINT propostas_status_assinatura_check 
        CHECK (status_assinatura IN ('pendente', 'assinado', 'rejeitado', 'expirado'));
        
        RAISE NOTICE '✅ Constraint status_assinatura adicionada';
    ELSE
        RAISE NOTICE 'ℹ️ Constraint status_assinatura já existe';
    END IF;
END $$;

-- 10. Criar índice para assinado_em
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_propostas_assinado_em'
    ) THEN
        CREATE INDEX idx_propostas_assinado_em 
        ON propostas(assinado_em);
        
        RAISE NOTICE '✅ Índice assinado_em criado';
    ELSE
        RAISE NOTICE 'ℹ️ Índice assinado_em já existe';
    END IF;
END $$;

-- 11. Criar índice para status_assinatura
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_propostas_status_assinatura'
    ) THEN
        CREATE INDEX idx_propostas_status_assinatura 
        ON propostas(status_assinatura);
        
        RAISE NOTICE '✅ Índice status_assinatura criado';
    ELSE
        RAISE NOTICE 'ℹ️ Índice status_assinatura já existe';
    END IF;
END $$;

-- 12. Criar índice para questionario_completo
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_propostas_questionario_completo'
    ) THEN
        CREATE INDEX idx_propostas_questionario_completo 
        ON propostas(questionario_completo);
        
        RAISE NOTICE '✅ Índice questionario_completo criado';
    ELSE
        RAISE NOTICE 'ℹ️ Índice questionario_completo já existe';
    END IF;
END $$;

-- 13. Criar índice composto para consultas de assinatura
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_propostas_status_assinatura_data'
    ) THEN
        CREATE INDEX idx_propostas_status_assinatura_data 
        ON propostas(status_assinatura, assinado_em);
        
        RAISE NOTICE '✅ Índice composto status/data criado';
    ELSE
        RAISE NOTICE 'ℹ️ Índice composto já existe';
    END IF;
END $$;

-- 14. Atualizar propostas que já foram finalizadas
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE propostas 
    SET 
        status_assinatura = 'assinado',
        questionario_completo = TRUE,
        assinado_em = COALESCE(updated_at, created_at)
    WHERE status = 'finalizada' 
    AND (status_assinatura = 'pendente' OR status_assinatura IS NULL);
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    IF updated_count > 0 THEN
        RAISE NOTICE '✅ % propostas finalizadas atualizadas', updated_count;
    ELSE
        RAISE NOTICE 'ℹ️ Nenhuma proposta finalizada para atualizar';
    END IF;
END $$;

-- 15. Verificar estrutura final das colunas relacionadas à assinatura
SELECT 
    'propostas' as tabela,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'propostas' 
AND column_name IN ('assinado_em', 'assinatura_imagem', 'assinatura', 'questionario_completo', 'ip_assinatura', 'user_agent', 'status_assinatura')
ORDER BY column_name;
