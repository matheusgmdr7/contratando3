-- Adicionar coluna para rastrear qual bucket foi usado para salvar os documentos
-- Isso ajuda a manter consistência e facilita futuras buscas

DO $$
BEGIN
    -- Verificar se a coluna já existe antes de tentar adicioná-la
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'propostas_corretores' 
        AND column_name = 'bucket_usado'
    ) THEN
        -- Adicionar a coluna bucket_usado
        ALTER TABLE propostas_corretores 
        ADD COLUMN bucket_usado VARCHAR(100) DEFAULT 'documentos_propostas';
        
        RAISE NOTICE 'Coluna bucket_usado adicionada com sucesso à tabela propostas_corretores';
    ELSE
        RAISE NOTICE 'Coluna bucket_usado já existe na tabela propostas_corretores';
    END IF;
    
    -- Verificar se a coluna de documentos existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'propostas_corretores' 
        AND column_name = 'documentos_urls'
    ) THEN
        -- Adicionar coluna para URLs dos documentos
        ALTER TABLE propostas_corretores 
        ADD COLUMN documentos_urls JSONB DEFAULT '{}';
        
        RAISE NOTICE 'Coluna documentos_urls adicionada com sucesso à tabela propostas_corretores';
    ELSE
        RAISE NOTICE 'Coluna documentos_urls já existe na tabela propostas_corretores';
    END IF;
    
    -- Verificar se a coluna de documentos dos dependentes existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'propostas_corretores' 
        AND column_name = 'documentos_dependentes_urls'
    ) THEN
        -- Adicionar coluna para URLs dos documentos dos dependentes
        ALTER TABLE propostas_corretores 
        ADD COLUMN documentos_dependentes_urls JSONB DEFAULT '[]';
        
        RAISE NOTICE 'Coluna documentos_dependentes_urls adicionada com sucesso à tabela propostas_corretores';
    ELSE
        RAISE NOTICE 'Coluna documentos_dependentes_urls já existe na tabela propostas_corretores';
    END IF;
    
    -- Verificar e adicionar colunas de URLs de documentos do titular
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'propostas_corretores' 
        AND column_name = 'rg_frente_url'
    ) THEN
        ALTER TABLE propostas_corretores 
        ADD COLUMN rg_frente_url TEXT,
        ADD COLUMN rg_verso_url TEXT,
        ADD COLUMN cpf_url TEXT,
        ADD COLUMN comprovante_residencia_url TEXT,
        ADD COLUMN cns_url TEXT,
        ADD COLUMN foto_3x4_url TEXT,
        ADD COLUMN certidao_nascimento_url TEXT,
        ADD COLUMN comprovante_renda_url TEXT;
        
        RAISE NOTICE 'Colunas de URLs de documentos do titular adicionadas com sucesso';
    ELSE
        RAISE NOTICE 'Colunas de URLs de documentos do titular já existem';
    END IF;

    -- Verificar e adicionar colunas de controle de upload
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'propostas_corretores' 
        AND column_name = 'documentos_enviados'
    ) THEN
        ALTER TABLE propostas_corretores 
        ADD COLUMN documentos_enviados BOOLEAN DEFAULT FALSE,
        ADD COLUMN data_envio_documentos TIMESTAMP,
        ADD COLUMN total_documentos_enviados INTEGER DEFAULT 0;
        
        RAISE NOTICE 'Colunas de controle de upload adicionadas com sucesso';
    ELSE
        RAISE NOTICE 'Colunas de controle de upload já existem';
    END IF;

    -- Atualizar registros existentes que não têm bucket_usado definido
    UPDATE propostas_corretores 
    SET bucket_usado = 'documentos_propostas' 
    WHERE bucket_usado IS NULL;
    
    RAISE NOTICE 'Registros existentes atualizados com bucket padrão';
    
END $$;

-- Verificar o resultado
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'propostas_corretores' 
AND column_name IN (
    'bucket_usado', 
    'rg_frente_url', 
    'rg_verso_url', 
    'cpf_url', 
    'comprovante_residencia_url',
    'cns_url',
    'foto_3x4_url',
    'certidao_nascimento_url',
    'comprovante_renda_url',
    'documentos_enviados',
    'data_envio_documentos',
    'total_documentos_enviados'
)
ORDER BY column_name;
