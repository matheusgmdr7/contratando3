-- VERIFICAR E CRIAR BUCKET documentos_propostas
-- ===============================================

-- 1. VERIFICAR SE O BUCKET JÁ EXISTE
SELECT 
    name as bucket_name,
    created_at,
    updated_at,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE name = 'documentos_propostas';

-- 2. CRIAR O BUCKET SE NÃO EXISTIR
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT 
    'documentos_propostas',
    'documentos_propostas',
    true,
    52428800, -- 50MB
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'documentos_propostas'
);

-- 3. CONFIGURAR POLÍTICAS DE ACESSO
-- Política para INSERT (upload)
INSERT INTO storage.policies (id, bucket_id, name, definition, check_expression, command)
SELECT 
    'documentos-propostas-upload',
    'documentos_propostas',
    'Permitir upload de documentos para propostas',
    'true',
    'true',
    'INSERT'
WHERE NOT EXISTS (
    SELECT 1 FROM storage.policies 
    WHERE bucket_id = 'documentos_propostas' 
    AND command = 'INSERT'
);

-- Política para SELECT (visualização)
INSERT INTO storage.policies (id, bucket_id, name, definition, check_expression, command)
SELECT 
    'documentos-propostas-view',
    'documentos_propostas',
    'Permitir visualização de documentos de propostas',
    'true',
    'true',
    'SELECT'
WHERE NOT EXISTS (
    SELECT 1 FROM storage.policies 
    WHERE bucket_id = 'documentos_propostas' 
    AND command = 'SELECT'
);

-- Política para UPDATE (atualização)
INSERT INTO storage.policies (id, bucket_id, name, definition, check_expression, command)
SELECT 
    'documentos-propostas-update',
    'documentos_propostas',
    'Permitir atualização de documentos de propostas',
    'true',
    'true',
    'UPDATE'
WHERE NOT EXISTS (
    SELECT 1 FROM storage.policies 
    WHERE bucket_id = 'documentos_propostas' 
    AND command = 'UPDATE'
);

-- Política para DELETE (exclusão)
INSERT INTO storage.policies (id, bucket_id, name, definition, check_expression, command)
SELECT 
    'documentos-propostas-delete',
    'documentos_propostas',
    'Permitir exclusão de documentos de propostas',
    'true',
    'true',
    'DELETE'
WHERE NOT EXISTS (
    SELECT 1 FROM storage.policies 
    WHERE bucket_id = 'documentos_propostas' 
    AND command = 'DELETE'
);

-- 4. VERIFICAR CONFIGURAÇÃO FINAL
SELECT 
    'Bucket documentos_propostas configurado!' as status,
    b.name as bucket_name,
    b.public as publico,
    b.file_size_limit as limite_tamanho_bytes,
    ROUND(b.file_size_limit / 1024.0 / 1024.0, 2) as limite_tamanho_mb,
    array_length(b.allowed_mime_types, 1) as tipos_permitidos,
    COUNT(p.id) as total_politicas
FROM storage.buckets b
LEFT JOIN storage.policies p ON b.id = p.bucket_id
WHERE b.name = 'documentos_propostas'
GROUP BY b.name, b.public, b.file_size_limit, b.allowed_mime_types;

-- 5. LISTAR POLÍTICAS CRIADAS
SELECT 
    name as politica,
    command as comando,
    definition as definicao
FROM storage.policies 
WHERE bucket_id = 'documentos_propostas'
ORDER BY command;

-- 6. LISTAR TIPOS MIME PERMITIDOS
SELECT 
    name as bucket_name,
    unnest(allowed_mime_types) as tipo_mime_permitido
FROM storage.buckets 
WHERE name = 'documentos_propostas';

-- 7. VERIFICAR SE BUCKET FOI CRIADO COM SUCESSO
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'documentos_propostas') THEN
        RAISE NOTICE '✅ BUCKET documentos_propostas CRIADO/VERIFICADO COM SUCESSO!';
        RAISE NOTICE '📦 Bucket: documentos_propostas';
        RAISE NOTICE '🔓 Público: true';
        RAISE NOTICE '📏 Limite: 50MB';
        RAISE NOTICE '📄 Tipos: JPEG, PNG, GIF, WebP, PDF';
    ELSE
        RAISE NOTICE '❌ ERRO: Bucket documentos_propostas NÃO foi criado!';
    END IF;
END $$;
