-- SCRIPT SIMPLES PARA VERIFICAR E CORRIGIR O BUCKET documentos-propostas-corretores
-- ================================================================================

-- 1. VERIFICAR SE O BUCKET EXISTE
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'documentos-propostas-corretores') THEN
        RAISE NOTICE '✅ Bucket documentos-propostas-corretores EXISTE';
    ELSE
        RAISE NOTICE '❌ Bucket documentos-propostas-corretores NÃO EXISTE';
        
        -- Criar o bucket se não existir
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'documentos-propostas-corretores',
            'documentos-propostas-corretores', 
            true,
            52428800, -- 50MB
            ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
        );
        
        RAISE NOTICE '✅ Bucket documentos-propostas-corretores CRIADO';
    END IF;
END
$$;

-- 2. VERIFICAR CONFIGURAÇÕES ATUAIS
SELECT 
    'Configurações do bucket:' as info,
    name as bucket_name,
    public as publico,
    CASE 
        WHEN file_size_limit IS NOT NULL 
        THEN ROUND(file_size_limit / 1024.0 / 1024.0, 2) || ' MB'
        ELSE 'Sem limite'
    END as limite_tamanho,
    CASE 
        WHEN allowed_mime_types IS NOT NULL 
        THEN array_length(allowed_mime_types, 1) || ' tipos permitidos'
        ELSE 'Todos os tipos'
    END as tipos_mime,
    created_at
FROM storage.buckets 
WHERE name = 'documentos-propostas-corretores';

-- 3. GARANTIR QUE O BUCKET SEJA PÚBLICO E TENHA CONFIGURAÇÕES CORRETAS
UPDATE storage.buckets 
SET 
    public = true,
    file_size_limit = 52428800, -- 50MB
    allowed_mime_types = ARRAY[
        'image/jpeg', 
        'image/jpg', 
        'image/png', 
        'image/gif', 
        'image/webp', 
        'application/pdf',
        'text/plain'
    ]
WHERE name = 'documentos-propostas-corretores';

-- 4. VERIFICAR SE HÁ ARQUIVOS NO BUCKET
SELECT 
    'Status do bucket:' as info,
    COUNT(*) as total_arquivos,
    CASE 
        WHEN COUNT(*) > 0 
        THEN '✅ Bucket tem arquivos'
        ELSE '📁 Bucket vazio'
    END as status
FROM storage.objects 
WHERE bucket_id = 'documentos-propostas-corretores';

-- 5. LISTAR ALGUNS ARQUIVOS RECENTES (se houver)
SELECT 
    'Arquivos recentes:' as info,
    name as arquivo,
    ROUND(metadata->>'size'::numeric / 1024.0, 2) as tamanho_kb,
    created_at
FROM storage.objects 
WHERE bucket_id = 'documentos-propostas-corretores'
ORDER BY created_at DESC 
LIMIT 5;

-- 6. VERIFICAÇÃO FINAL
SELECT 
    '🎉 VERIFICAÇÃO FINAL:' as resultado,
    CASE 
        WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'documentos-propostas-corretores' AND public = true)
        THEN '✅ Bucket configurado corretamente'
        ELSE '❌ Bucket precisa de ajustes'
    END as status_final;
