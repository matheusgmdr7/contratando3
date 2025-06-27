-- Adicionar a coluna whatsapp_cliente à tabela propostas_corretores se ela não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'propostas_corretores' 
        AND column_name = 'whatsapp_cliente'
    ) THEN
        ALTER TABLE propostas_corretores 
        ADD COLUMN whatsapp_cliente TEXT;
    END IF;
END $$;

-- Verificar se o bucket 'propostas' existe, se não, criá-lo
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM storage.buckets 
        WHERE name = 'propostas'
    ) THEN
        INSERT INTO storage.buckets (id, name)
        VALUES ('propostas', 'propostas');
    END IF;
END $$;

-- Criar políticas para o bucket 'propostas' se não existirem
DO $$
BEGIN
    -- Política para inserção
    IF NOT EXISTS (
        SELECT 1 
        FROM storage.policies 
        WHERE bucket_id = 'propostas' 
        AND name = 'Usuários autenticados podem fazer upload'
    ) THEN
        CREATE POLICY "Usuários autenticados podem fazer upload"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (bucket_id = 'propostas');
    END IF;

    -- Política para seleção
    IF NOT EXISTS (
        SELECT 1 
        FROM storage.policies 
        WHERE bucket_id = 'propostas' 
        AND name = 'Usuários autenticados podem visualizar'
    ) THEN
        CREATE POLICY "Usuários autenticados podem visualizar"
        ON storage.objects FOR SELECT
        TO authenticated
        USING (bucket_id = 'propostas');
    END IF;

    -- Política para atualização
    IF NOT EXISTS (
        SELECT 1 
        FROM storage.policies 
        WHERE bucket_id = 'propostas' 
        AND name = 'Usuários autenticados podem atualizar'
    ) THEN
        CREATE POLICY "Usuários autenticados podem atualizar"
        ON storage.objects FOR UPDATE
        TO authenticated
        USING (bucket_id = 'propostas');
    END IF;

    -- Política para exclusão
    IF NOT EXISTS (
        SELECT 1 
        FROM storage.policies 
        WHERE bucket_id = 'propostas' 
        AND name = 'Usuários autenticados podem excluir'
    ) THEN
        CREATE POLICY "Usuários autenticados podem excluir"
        ON storage.objects FOR DELETE
        TO authenticated
        USING (bucket_id = 'propostas');
    END IF;
END $$;

-- Criar índice para melhorar a performance das consultas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'propostas_corretores' 
        AND indexname = 'idx_propostas_corretores_corretor_id'
    ) THEN
        CREATE INDEX idx_propostas_corretores_corretor_id 
        ON propostas_corretores(corretor_id);
    END IF;
END $$;
