-- Script para verificar e debugar o bucket documentos-propostas-corretores

-- 1. Verificar se o bucket existe
SELECT 
    name,
    id,
    created_at,
    updated_at,
    public
FROM storage.buckets 
WHERE name = 'documentos-propostas-corretores';

-- 2. Listar todos os buckets disponíveis
SELECT 
    name,
    id,
    created_at,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
ORDER BY created_at DESC;

-- 3. Verificar políticas do bucket (se existir)
SELECT 
    id,
    name,
    bucket_id,
    roles,
    cmd,
    definition
FROM storage.policies 
WHERE bucket_id = (
    SELECT id FROM storage.buckets WHERE name = 'documentos-propostas-corretores'
);

-- 4. Se o bucket não existir, criar com configurações corretas
DO $$
BEGIN
    -- Verificar se o bucket já existe
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets WHERE name = 'documentos-propostas-corretores'
    ) THEN
        -- Criar o bucket
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'documentos-propostas-corretores',
            'documentos-propostas-corretores',
            true,
            52428800, -- 50MB
            ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
        );
        
        RAISE NOTICE 'Bucket documentos-propostas-corretores criado com sucesso!';
    ELSE
        RAISE NOTICE 'Bucket documentos-propostas-corretores já existe!';
    END IF;
END $$;

-- 5. Criar políticas de acesso se não existirem
DO $$
BEGIN
    -- Política para SELECT (visualizar arquivos)
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'documentos-propostas-corretores' 
        AND name = 'Permitir visualização de documentos'
    ) THEN
        INSERT INTO storage.policies (name, bucket_id, roles, cmd, definition)
        VALUES (
            'Permitir visualização de documentos',
            'documentos-propostas-corretores',
            ARRAY['public'],
            'SELECT',
            'true'
        );
    END IF;

    -- Política para INSERT (upload de arquivos)
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'documentos-propostas-corretores' 
        AND name = 'Permitir upload de documentos'
    ) THEN
        INSERT INTO storage.policies (name, bucket_id, roles, cmd, definition)
        VALUES (
            'Permitir upload de documentos',
            'documentos-propostas-corretores',
            ARRAY['public'],
            'INSERT',
            'true'
        );
    END IF;

    -- Política para UPDATE (atualizar arquivos)
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'documentos-propostas-corretores' 
        AND name = 'Permitir atualização de documentos'
    ) THEN
        INSERT INTO storage.policies (name, bucket_id, roles, cmd, definition)
        VALUES (
            'Permitir atualização de documentos',
            'documentos-propostas-corretores',
            ARRAY['public'],
            'UPDATE',
            'true'
        );
    END IF;

    RAISE NOTICE 'Políticas de acesso configuradas!';
END $$;

-- 6. Verificar novamente se tudo foi criado corretamente
SELECT 
    'BUCKET' as tipo,
    name as nome,
    'Criado em: ' || created_at::text as detalhes
FROM storage.buckets 
WHERE name = 'documentos-propostas-corretores'

UNION ALL

SELECT 
    'POLÍTICA' as tipo,
    name as nome,
    'Comando: ' || cmd || ' | Roles: ' || array_to_string(roles, ', ') as detalhes
FROM storage.policies 
WHERE bucket_id = 'documentos-propostas-corretores'
ORDER BY tipo, nome;
