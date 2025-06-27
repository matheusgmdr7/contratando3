-- CRIAR BUCKET PARA DOCUMENTOS DAS PROPOSTAS DOS CORRETORES
-- =========================================================

-- 1. CRIAR BUCKET PARA DOCUMENTOS (se não existir)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'documentos-propostas-corretores',
    'documentos-propostas-corretores', 
    false,  -- Privado por segurança
    52428800,  -- 50MB limite
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 2. REMOVER POLÍTICAS EXISTENTES (se houver)
DROP POLICY IF EXISTS "Corretores podem fazer upload de documentos" ON storage.objects;
DROP POLICY IF EXISTS "Corretores podem ver seus documentos" ON storage.objects;
DROP POLICY IF EXISTS "Corretores podem atualizar seus documentos" ON storage.objects;
DROP POLICY IF EXISTS "Corretores podem deletar seus documentos" ON storage.objects;

-- 3. CRIAR POLÍTICAS DE ACESSO
-- Política para INSERT (upload)
CREATE POLICY "Corretores podem fazer upload de documentos"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'documentos-propostas-corretores' 
    AND auth.role() = 'authenticated'
);

-- Política para SELECT (visualização)
CREATE POLICY "Corretores podem ver seus documentos"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'documentos-propostas-corretores'
    AND auth.role() = 'authenticated'
);

-- Política para UPDATE (atualização)
CREATE POLICY "Corretores podem atualizar seus documentos"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'documentos-propostas-corretores'
    AND auth.role() = 'authenticated'
);

-- Política para DELETE (exclusão)
CREATE POLICY "Corretores podem deletar seus documentos"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'documentos-propostas-corretores'
    AND auth.role() = 'authenticated'
);

-- 4. VERIFICAR SE O BUCKET FOI CRIADO
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types,
    created_at
FROM storage.buckets 
WHERE name = 'documentos-propostas-corretores';

-- 5. VERIFICAR POLÍTICAS CRIADAS
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'objects' 
    AND policyname ILIKE '%corretor%';

-- 6. MENSAGEM DE SUCESSO
SELECT 'Bucket e políticas criados com sucesso!' as resultado;
