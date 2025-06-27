-- ADICIONAR TODAS AS COLUNAS NECESSÁRIAS NA TABELA propostas
-- ========================================================

-- Verificar se a tabela existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'propostas') THEN
        RAISE EXCEPTION 'Tabela propostas não existe. Execute primeiro o script de criação da tabela.';
    END IF;
END $$;

-- 1. COLUNAS PARA DOCUMENTOS DO TITULAR (URLs individuais)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas' AND column_name = 'rg_frente_url') THEN
        ALTER TABLE propostas ADD COLUMN rg_frente_url TEXT;
        RAISE NOTICE 'Coluna rg_frente_url adicionada';
    ELSE
        RAISE NOTICE 'Coluna rg_frente_url já existe';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas' AND column_name = 'rg_verso_url') THEN
        ALTER TABLE propostas ADD COLUMN rg_verso_url TEXT;
        RAISE NOTICE 'Coluna rg_verso_url adicionada';
    ELSE
        RAISE NOTICE 'Coluna rg_verso_url já existe';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas' AND column_name = 'cpf_url') THEN
        ALTER TABLE propostas ADD COLUMN cpf_url TEXT;
        RAISE NOTICE 'Coluna cpf_url adicionada';
    ELSE
        RAISE NOTICE 'Coluna cpf_url já existe';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas' AND column_name = 'comprovante_residencia_url') THEN
        ALTER TABLE propostas ADD COLUMN comprovante_residencia_url TEXT;
        RAISE NOTICE 'Coluna comprovante_residencia_url adicionada';
    ELSE
        RAISE NOTICE 'Coluna comprovante_residencia_url já existe';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas' AND column_name = 'cns_url') THEN
        ALTER TABLE propostas ADD COLUMN cns_url TEXT;
        RAISE NOTICE 'Coluna cns_url adicionada';
    ELSE
        RAISE NOTICE 'Coluna cns_url já existe';
    END IF;
END $$;

-- 2. COLUNAS JSON PARA DOCUMENTOS (para compatibilidade)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas' AND column_name = 'documentos_urls') THEN
        ALTER TABLE propostas ADD COLUMN documentos_urls JSONB DEFAULT '{}';
        RAISE NOTICE 'Coluna documentos_urls adicionada';
    ELSE
        RAISE NOTICE 'Coluna documentos_urls já existe';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas' AND column_name = 'documentos_dependentes_urls') THEN
        ALTER TABLE propostas ADD COLUMN documentos_dependentes_urls JSONB DEFAULT '{}';
        RAISE NOTICE 'Coluna documentos_dependentes_urls adicionada';
    ELSE
        RAISE NOTICE 'Coluna documentos_dependentes_urls já existe';
    END IF;
END $$;

-- 3. COLUNAS DE CONTROLE DE DOCUMENTOS
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas' AND column_name = 'documentos_enviados') THEN
        ALTER TABLE propostas ADD COLUMN documentos_enviados BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Coluna documentos_enviados adicionada';
    ELSE
        RAISE NOTICE 'Coluna documentos_enviados já existe';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas' AND column_name = 'data_upload_documentos') THEN
        ALTER TABLE propostas ADD COLUMN data_upload_documentos TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Coluna data_upload_documentos adicionada';
    ELSE
        RAISE NOTICE 'Coluna data_upload_documentos já existe';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas' AND column_name = 'total_documentos_anexados') THEN
        ALTER TABLE propostas ADD COLUMN total_documentos_anexados INTEGER DEFAULT 0;
        RAISE NOTICE 'Coluna total_documentos_anexados adicionada';
    ELSE
        RAISE NOTICE 'Coluna total_documentos_anexados já existe';
    END IF;
END $$;

-- 4. COLUNAS PARA INFORMAÇÕES DO CLIENTE (para organização das pastas)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas' AND column_name = 'nome_cliente') THEN
        ALTER TABLE propostas ADD COLUMN nome_cliente VARCHAR(255);
        RAISE NOTICE 'Coluna nome_cliente adicionada';
    ELSE
        RAISE NOTICE 'Coluna nome_cliente já existe';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas' AND column_name = 'cpf_cliente') THEN
        ALTER TABLE propostas ADD COLUMN cpf_cliente VARCHAR(14);
        RAISE NOTICE 'Coluna cpf_cliente adicionada';
    ELSE
        RAISE NOTICE 'Coluna cpf_cliente já existe';
    END IF;
END $$;

-- 5. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_propostas_documentos_enviados 
ON propostas(documentos_enviados);

CREATE INDEX IF NOT EXISTS idx_propostas_data_upload 
ON propostas(data_upload_documentos);

CREATE INDEX IF NOT EXISTS idx_propostas_nome_cliente 
ON propostas(nome_cliente);

CREATE INDEX IF NOT EXISTS idx_propostas_cpf_cliente 
ON propostas(cpf_cliente);

-- Índices GIN para busca em JSON
CREATE INDEX IF NOT EXISTS idx_propostas_documentos_urls_gin 
ON propostas USING GIN (documentos_urls);

CREATE INDEX IF NOT EXISTS idx_propostas_documentos_deps_gin 
ON propostas USING GIN (documentos_dependentes_urls);

-- 6. ADICIONAR COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON COLUMN propostas.rg_frente_url IS 'URL do RG frente do titular';
COMMENT ON COLUMN propostas.rg_verso_url IS 'URL do RG verso do titular';
COMMENT ON COLUMN propostas.cpf_url IS 'URL do CPF do titular';
COMMENT ON COLUMN propostas.comprovante_residencia_url IS 'URL do comprovante de residência';
COMMENT ON COLUMN propostas.cns_url IS 'URL do CNS (Cartão Nacional de Saúde)';
COMMENT ON COLUMN propostas.documentos_urls IS 'URLs dos documentos do titular em formato JSON';
COMMENT ON COLUMN propostas.documentos_dependentes_urls IS 'URLs dos documentos dos dependentes em formato JSON';
COMMENT ON COLUMN propostas.documentos_enviados IS 'Flag indicando se documentos foram enviados';
COMMENT ON COLUMN propostas.data_upload_documentos IS 'Data e hora do upload dos documentos';
COMMENT ON COLUMN propostas.total_documentos_anexados IS 'Número total de documentos anexados';
COMMENT ON COLUMN propostas.nome_cliente IS 'Nome do cliente para organização das pastas';
COMMENT ON COLUMN propostas.cpf_cliente IS 'CPF do cliente para organização das pastas';

-- 7. VERIFICAR RESULTADO FINAL
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name LIKE '%url%' THEN '📎 URL Documento'
        WHEN column_name LIKE '%documentos%' THEN '📄 Controle'
        WHEN column_name LIKE '%data%' THEN '📅 Timestamp'
        WHEN column_name LIKE '%cliente%' THEN '👤 Cliente'
        ELSE '📋 Geral'
    END as categoria
FROM information_schema.columns 
WHERE table_name = 'propostas' 
    AND table_schema = 'public'
    AND column_name IN (
        'rg_frente_url', 'rg_verso_url', 'cpf_url', 'comprovante_residencia_url', 'cns_url',
        'documentos_urls', 'documentos_dependentes_urls', 
        'documentos_enviados', 'data_upload_documentos', 'total_documentos_anexados',
        'nome_cliente', 'cpf_cliente'
    )
ORDER BY categoria, column_name;

RAISE NOTICE '✅ Script executado com sucesso! Todas as colunas necessárias foram adicionadas à tabela propostas.';
