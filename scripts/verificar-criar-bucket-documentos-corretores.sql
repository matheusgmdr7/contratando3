-- VERIFICAR E CRIAR BUCKET PARA DOCUMENTOS DOS CORRETORES
-- ======================================================

-- 1. VERIFICAR SE O BUCKET JÁ EXISTE
SELECT 
    name as bucket_name,
    created_at,
    updated_at,
    public
FROM storage.buckets 
WHERE name = 'documentos-propostas-corretores';

-- 2. CRIAR O BUCKET SE NÃO EXISTIR
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT 
    'documentos-propostas-corretores',
    'documentos-propostas-corretores',
    true,
    52428800, -- 50MB
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'documentos-propostas-corretores'
);

-- 3. CONFIGURAR POLÍTICAS DE ACESSO
-- Política para INSERT (upload)
INSERT INTO storage.policies (id, bucket_id, name, definition, check_expression, command)
SELECT 
    'propostas-corretores-upload',
    'documentos-propostas-corretores',
    'Permitir upload de documentos para propostas de corretores',
    'true',
    'true',
    'INSERT'
WHERE NOT EXISTS (
    SELECT 1 FROM storage.policies 
    WHERE bucket_id = 'documentos-propostas-corretores' 
    AND command = 'INSERT'
);

-- Política para SELECT (visualização)
INSERT INTO storage.policies (id, bucket_id, name, definition, check_expression, command)
SELECT 
    'propostas-corretores-view',
    'documentos-propostas-corretores',
    'Permitir visualização de documentos de propostas de corretores',
    'true',
    'true',
    'SELECT'
WHERE NOT EXISTS (
    SELECT 1 FROM storage.policies 
    WHERE bucket_id = 'documentos-propostas-corretores' 
    AND command = 'SELECT'
);

-- 4. VERIFICAR CONFIGURAÇÃO FINAL
SELECT 
    'Bucket configurado com sucesso!' as status,
    b.name as bucket_name,
    b.public as publico,
    b.file_size_limit as limite_tamanho_mb,
    COUNT(p.id) as total_politicas
FROM storage.buckets b
LEFT JOIN storage.policies p ON b.id = p.bucket_id
WHERE b.name = 'documentos-propostas-corretores'
GROUP BY b.name, b.public, b.file_size_limit;

-- 5. LISTAR POLÍTICAS CRIADAS
SELECT 
    name as politica,
    command as comando,
    definition as definicao
FROM storage.policies 
WHERE bucket_id = 'documentos-propostas-corretores'
ORDER BY command;
