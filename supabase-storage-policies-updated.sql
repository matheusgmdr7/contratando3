-- Adicionar coluna whatsapp_cliente à tabela propostas_corretores
ALTER TABLE propostas_corretores
ADD COLUMN IF NOT EXISTS whatsapp_cliente TEXT;

-- Verificar se a tabela documentos_propostas_corretores existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'documentos_propostas_corretores'
    ) THEN
        -- Criar a tabela se não existir
        CREATE TABLE documentos_propostas_corretores (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            proposta_id UUID REFERENCES propostas_corretores(id),
            nome TEXT,
            url TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END
$$;

-- Adicionar coluna tipo à tabela documentos_propostas_corretores
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'documentos_propostas_corretores' 
        AND column_name = 'tipo'
    ) THEN
        ALTER TABLE documentos_propostas_corretores
        ADD COLUMN tipo TEXT;
    END IF;
END
$$;

-- Verificar se o bucket documentos_clientes existe e criar se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM storage.buckets 
        WHERE id = 'documentos_clientes'
    ) THEN
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('documentos_clientes', 'documentos_clientes', false);
    END IF;
END
$$;

-- Verificar se o bucket propostas existe e criar se não existir (bucket de fallback)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM storage.buckets 
        WHERE id = 'propostas'
    ) THEN
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('propostas', 'propostas', false);
    END IF;
END
$$;

-- Políticas para o bucket 'documentos_clientes'
DO $$
BEGIN
    -- 1. Política para permitir a criação de buckets por usuários autenticados
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'buckets' 
        AND schemaname = 'storage' 
        AND policyname = 'Permitir criação de buckets para usuários autenticados'
    ) THEN
        CREATE POLICY "Permitir criação de buckets para usuários autenticados" ON storage.buckets
        FOR INSERT TO authenticated
        WITH CHECK (true);
    END IF;

    -- 2. Política para permitir leitura de buckets por usuários autenticados
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'buckets' 
        AND schemaname = 'storage' 
        AND policyname = 'Permitir leitura de buckets para usuários autenticados'
    ) THEN
        CREATE POLICY "Permitir leitura de buckets para usuários autenticados" ON storage.buckets
        FOR SELECT TO authenticated
        USING (true);
    END IF;

    -- 3. Política para permitir upload de arquivos por usuários autenticados
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Permitir upload de arquivos para usuários autenticados'
    ) THEN
        CREATE POLICY "Permitir upload de arquivos para usuários autenticados" ON storage.objects
        FOR INSERT TO authenticated
        WITH CHECK (bucket_id IN ('documentos_clientes', 'propostas'));
    END IF;

    -- 4. Política para permitir atualização de arquivos por usuários autenticados
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Permitir atualização de arquivos para usuários autenticados'
    ) THEN
        CREATE POLICY "Permitir atualização de arquivos para usuários autenticados" ON storage.objects
        FOR UPDATE TO authenticated
        USING (bucket_id IN ('documentos_clientes', 'propostas'))
        WITH CHECK (bucket_id IN ('documentos_clientes', 'propostas'));
    END IF;

    -- 5. Política para permitir leitura de arquivos por usuários autenticados
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Permitir leitura de arquivos para usuários autenticados'
    ) THEN
        CREATE POLICY "Permitir leitura de arquivos para usuários autenticados" ON storage.objects
        FOR SELECT TO authenticated
        USING (bucket_id IN ('documentos_clientes', 'propostas'));
    END IF;

    -- 6. Política para permitir exclusão de arquivos por usuários autenticados
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Permitir exclusão de arquivos para usuários autenticados'
    ) THEN
        CREATE POLICY "Permitir exclusão de arquivos para usuários autenticados" ON storage.objects
        FOR DELETE TO authenticated
        USING (bucket_id IN ('documentos_clientes', 'propostas'));
    END IF;
END
$$;

-- Índices para melhorar a performance das consultas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'propostas_corretores' 
        AND indexname = 'idx_propostas_corretores_corretor_id'
    ) THEN
        CREATE INDEX idx_propostas_corretores_corretor_id ON propostas_corretores(corretor_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'documentos_propostas_corretores' 
        AND indexname = 'idx_documentos_propostas_corretores_proposta_id'
    ) THEN
        CREATE INDEX idx_documentos_propostas_corretores_proposta_id ON documentos_propostas_corretores(proposta_id);
    END IF;

    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'documentos_propostas_corretores' 
        AND column_name = 'tipo'
    ) AND NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'documentos_propostas_corretores' 
        AND indexname = 'idx_documentos_propostas_corretores_tipo'
    ) THEN
        CREATE INDEX idx_documentos_propostas_corretores_tipo ON documentos_propostas_corretores(tipo);
    END IF;
END
$$;
