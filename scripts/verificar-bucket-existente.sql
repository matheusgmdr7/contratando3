-- VERIFICAR SE BUCKET JÁ EXISTE
-- ==============================

-- 1. VERIFICAR BUCKETS EXISTENTES
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types,
    created_at
FROM storage.buckets 
ORDER BY created_at DESC;

-- 2. VERIFICAR POLÍTICAS EXISTENTES
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'objects'
ORDER BY policyname;

-- 3. VERIFICAR SE BUCKET ESPECÍFICO EXISTE
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'documentos-propostas-corretores') 
        THEN 'Bucket já existe!' 
        ELSE 'Bucket NÃO existe - precisa criar'
    END as status_bucket;
