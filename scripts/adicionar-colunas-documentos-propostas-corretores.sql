-- ADICIONAR COLUNAS PARA DOCUMENTOS NA TABELA propostas_corretores
-- ==============================================================

-- 1. ADICIONAR COLUNAS JSON PARA DOCUMENTOS
ALTER TABLE propostas_corretores 
ADD COLUMN IF NOT EXISTS documentos_urls JSONB DEFAULT '{}';

ALTER TABLE propostas_corretores 
ADD COLUMN IF NOT EXISTS documentos_dependentes_urls JSONB DEFAULT '{}';

-- 2. ADICIONAR COLUNAS INDIVIDUAIS PARA DOCUMENTOS DO TITULAR
ALTER TABLE propostas_corretores 
ADD COLUMN IF NOT EXISTS rg_frente_url TEXT;

ALTER TABLE propostas_corretores 
ADD COLUMN IF NOT EXISTS rg_verso_url TEXT;

ALTER TABLE propostas_corretores 
ADD COLUMN IF NOT EXISTS cpf_url TEXT;

ALTER TABLE propostas_corretores 
ADD COLUMN IF NOT EXISTS comprovante_residencia_url TEXT;

ALTER TABLE propostas_corretores 
ADD COLUMN IF NOT EXISTS cns_url TEXT;

-- 3. ADICIONAR COLUNAS DE CONTROLE
ALTER TABLE propostas_corretores 
ADD COLUMN IF NOT EXISTS documentos_enviados BOOLEAN DEFAULT FALSE;

ALTER TABLE propostas_corretores 
ADD COLUMN IF NOT EXISTS data_upload_documentos TIMESTAMP WITH TIME ZONE;

ALTER TABLE propostas_corretores 
ADD COLUMN IF NOT EXISTS total_documentos_anexados INTEGER DEFAULT 0;

-- 4. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_propostas_corretores_documentos_enviados 
ON propostas_corretores(documentos_enviados);

CREATE INDEX IF NOT EXISTS idx_propostas_corretores_data_upload 
ON propostas_corretores(data_upload_documentos);

-- Índices GIN para busca em JSON
CREATE INDEX IF NOT EXISTS idx_propostas_corretores_documentos_urls_gin 
ON propostas_corretores USING GIN (documentos_urls);

CREATE INDEX IF NOT EXISTS idx_propostas_corretores_documentos_deps_gin 
ON propostas_corretores USING GIN (documentos_dependentes_urls);

-- 5. ADICIONAR COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON COLUMN propostas_corretores.documentos_urls IS 'URLs dos documentos do titular em formato JSON';
COMMENT ON COLUMN propostas_corretores.documentos_dependentes_urls IS 'URLs dos documentos dos dependentes em formato JSON';
COMMENT ON COLUMN propostas_corretores.documentos_enviados IS 'Flag indicando se documentos foram enviados';
COMMENT ON COLUMN propostas_corretores.data_upload_documentos IS 'Data e hora do upload dos documentos';
COMMENT ON COLUMN propostas_corretores.total_documentos_anexados IS 'Número total de documentos anexados';

-- 6. VERIFICAR SE AS COLUNAS FORAM CRIADAS
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name LIKE '%url%' THEN '📎 URL'
        WHEN column_name LIKE '%documentos%' THEN '📄 Controle'
        WHEN column_name LIKE '%data%' THEN '📅 Timestamp'
        ELSE '📋 Geral'
    END as categoria
FROM information_schema.columns 
WHERE table_name = 'propostas_corretores' 
    AND table_schema = 'public'
    AND column_name IN (
        'documentos_urls',
        'documentos_dependentes_urls', 
        'rg_frente_url',
        'rg_verso_url',
        'cpf_url',
        'comprovante_residencia_url',
        'cns_url',
        'documentos_enviados',
        'data_upload_documentos',
        'total_documentos_anexados'
    )
ORDER BY categoria, column_name;

-- 7. VERIFICAR ÍNDICES CRIADOS
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'propostas_corretores' 
    AND indexname LIKE '%documento%'
ORDER BY indexname;

-- 8. MOSTRAR RESULTADO FINAL
SELECT 
    'Colunas de documentos adicionadas com sucesso!' as status,
    COUNT(*) as total_colunas_adicionadas
FROM information_schema.columns 
WHERE table_name = 'propostas_corretores' 
    AND column_name IN (
        'documentos_urls',
        'documentos_dependentes_urls', 
        'rg_frente_url',
        'rg_verso_url',
        'cpf_url',
        'comprovante_residencia_url',
        'cns_url',
        'documentos_enviados',
        'data_upload_documentos',
        'total_documentos_anexados'
    );
