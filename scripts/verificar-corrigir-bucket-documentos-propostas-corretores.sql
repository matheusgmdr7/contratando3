-- SCRIPT PARA VERIFICAR E CORRIGIR O BUCKET documentos-propostas-corretores
-- ========================================================================

-- 1. VERIFICAR SE O BUCKET EXISTE
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'documentos-propostas-corretores')
        THEN '✅ Bucket documentos-propostas-corretores EXISTE'
        ELSE '❌ Bucket documentos-propostas-corretores NÃO EXISTE'
    END as status_bucket;

-- 2. VERIFICAR CONFIGURAÇÕES DO BUCKET
SELECT 
    'Configurações atuais:' as info,
    name as bucket_name,
    public as publico,
    file_size_limit as limite_bytes,
    ROUND(file_size_limit / 1024.0 / 1024.0, 2) as limite_mb,
    allowed_mime_types as tipos_permitidos,
    created_at
FROM storage.buckets 
WHERE name = 'documentos-propostas-corretores';

-- 3. VERIFICAR POLÍTICAS DE ACESSO
SELECT 
    'Políticas atuais:' as info,
    name as politica,
    command as comando,
    definition as definicao,
    check_expression as verificacao
FROM storage.policies 
WHERE bucket_id = 'documentos-propostas-corretores'
ORDER BY command;

-- 4. CORRIGIR CONFIGURAÇÕES DO BUCKET (se necessário)
UPDATE storage.buckets 
SET 
    public = true,
    file_size_limit = 52428800, -- 50MB
    allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
WHERE name = 'documentos-propostas-corretores';

-- 5. REMOVER POLÍTICAS RESTRITIVAS (se houver)
DELETE FROM storage.policies 
WHERE bucket_id = 'documentos-propostas-corretores'
AND (
    definition LIKE '%auth.uid()%' OR 
    definition LIKE '%auth.role()%' OR
    definition != 'true'
);

-- 6. CRIAR POLÍTICAS PERMISSIVAS PARA UPLOAD
INSERT INTO storage.policies (id, bucket_id, name, definition, check_expression, command)
VALUES 
    (
        'documentos-propostas-corretores-select-public',
        'documentos-propostas-corretores',
        'Permitir visualização pública de documentos',
        'true',
        'true', 
        'SELECT'
    ),
    (
        'documentos-propostas-corretores-insert-public',
        'documentos-propostas-corretores',
        'Permitir upload público de documentos',
        'true',
        'true',
        'INSERT'
    ),
    (
        'documentos-propostas-corretores-update-public',
        'documentos-propostas-corretores', 
        'Permitir atualização pública de documentos',
        'true',
        'true',
        'UPDATE'
    ),
    (
        'documentos-propostas-corretores-delete-public',
        'documentos-propostas-corretores',
        'Permitir exclusão pública de documentos', 
        'true',
        'true',
        'DELETE'
    )
ON CONFLICT (id) DO UPDATE SET
    definition = EXCLUDED.definition,
    check_expression = EXCLUDED.check_expression;

-- 7. VERIFICAR CONFIGURAÇÃO FINAL
SELECT 
    '🎉 VERIFICAÇÃO FINAL:' as status,
    b.name as bucket_name,
    b.public as publico,
    ROUND(b.file_size_limit / 1024.0 / 1024.0, 2) as limite_mb,
    array_length(b.allowed_mime_types, 1) as tipos_mime_count,
    COUNT(p.id) as total_politicas
FROM storage.buckets b
LEFT JOIN storage.policies p ON b.id = p.bucket_id
WHERE b.name = 'documentos-propostas-corretores'
GROUP BY b.name, b.public, b.file_size_limit, b.allowed_mime_types;

-- 8. TESTAR PERMISSÕES
SELECT 
    CASE 
        WHEN COUNT(*) >= 4 
        THEN '✅ Todas as políticas necessárias estão configuradas'
        ELSE '⚠️ Faltam políticas - encontradas: ' || COUNT(*)::text
    END as teste_politicas
FROM storage.policies 
WHERE bucket_id = 'documentos-propostas-corretores';

-- 9. LISTAR ARQUIVOS EXISTENTES (para debug)
SELECT 
    'Arquivos no bucket:' as info,
    COUNT(*) as total_arquivos
FROM storage.objects 
WHERE bucket_id = 'documentos-propostas-corretores';
