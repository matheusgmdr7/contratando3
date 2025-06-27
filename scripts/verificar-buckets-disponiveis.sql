-- VERIFICAR BUCKETS DISPONÍVEIS E CRIAR ALTERNATIVO SE NECESSÁRIO
-- ==============================================================

-- 1. LISTAR TODOS OS BUCKETS EXISTENTES
SELECT 
    '📦 BUCKETS EXISTENTES:' as info,
    name as bucket_name,
    public as publico,
    file_size_limit as limite_mb,
    created_at,
    updated_at
FROM storage.buckets 
ORDER BY created_at DESC;

-- 2. VERIFICAR BUCKETS COMUNS PARA DOCUMENTOS
SELECT 
    'Buckets para documentos encontrados:' as info,
    name as bucket_name,
    CASE 
        WHEN name LIKE '%documento%' THEN '✅ Bucket de documentos'
        WHEN name LIKE '%arquivo%' THEN '✅ Bucket de arquivos'  
        WHEN name LIKE '%proposta%' THEN '✅ Bucket de propostas'
        ELSE '⚠️ Bucket genérico'
    END as tipo
FROM storage.buckets 
WHERE name ILIKE ANY(ARRAY['%documento%', '%arquivo%', '%proposta%', '%file%'])
ORDER BY name;

-- 3. CRIAR BUCKET GENÉRICO SE NENHUM EXISTIR
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT 
    'documentos',
    'documentos',
    true,
    52428800, -- 50MB
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'image/jpg']
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets 
    WHERE name ILIKE ANY(ARRAY['%documento%', '%arquivo%', '%proposta%'])
);

-- 4. CONFIGURAR POLÍTICAS PARA BUCKET GENÉRICO
DELETE FROM storage.policies WHERE bucket_id = 'documentos';

INSERT INTO storage.policies (id, bucket_id, name, definition, check_expression, command)
SELECT 
    'documentos-' || cmd.command,
    'documentos',
    'Permitir ' || cmd.command || ' em documentos',
    'true',
    'true',
    cmd.command
FROM (VALUES ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE')) AS cmd(command)
WHERE EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'documentos')
AND NOT EXISTS (
    SELECT 1 FROM storage.policies 
    WHERE bucket_id = 'documentos' AND command = cmd.command
);

-- 5. RESULTADO FINAL
SELECT 
    '🎯 BUCKET RECOMENDADO PARA USO:' as info,
    name as bucket_name,
    public as publico,
    ROUND(file_size_limit / 1024.0 / 1024.0, 2) as limite_mb
FROM storage.buckets 
WHERE name ILIKE ANY(ARRAY['%documento%', '%arquivo%', '%proposta%'])
ORDER BY 
    CASE 
        WHEN name LIKE '%proposta%' THEN 1
        WHEN name LIKE '%documento%' THEN 2  
        WHEN name LIKE '%arquivo%' THEN 3
        ELSE 4
    END
LIMIT 1;
