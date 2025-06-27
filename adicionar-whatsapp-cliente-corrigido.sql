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
BEGIN;
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('propostas', 'propostas', true)
    ON CONFLICT (id) DO NOTHING;
COMMIT;

-- Criar políticas para o bucket 'propostas'
-- Nota: Não podemos verificar facilmente se as políticas já existem,
-- então vamos tentar criá-las e ignorar erros se já existirem

-- Política para inserção
BEGIN;
    DROP POLICY IF EXISTS "Usuários autenticados podem fazer upload" ON storage.objects;
    CREATE POLICY "Usuários autenticados podem fazer upload"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'propostas');
COMMIT;

-- Política para seleção
BEGIN;
    DROP POLICY IF EXISTS "Usuários autenticados podem visualizar" ON storage.objects;
    CREATE POLICY "Usuários autenticados podem visualizar"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'propostas');
COMMIT;

-- Política para atualização
BEGIN;
    DROP POLICY IF EXISTS "Usuários autenticados podem atualizar" ON storage.objects;
    CREATE POLICY "Usuários autenticados podem atualizar"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'propostas');
COMMIT;

-- Política para exclusão
BEGIN;
    DROP POLICY IF EXISTS "Usuários autenticados podem excluir" ON storage.objects;
    CREATE POLICY "Usuários autenticados podem excluir"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'propostas');
COMMIT;

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
