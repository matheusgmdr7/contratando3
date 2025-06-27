-- SCRIPT CORRIGIDO PARA VERIFICAR E CONFIGURAR O BUCKET documentos-propostas-corretores
-- ===================================================================================

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

-- 2. VERIFICAR CONFIGURAÇÕES ATUAIS DO BUCKET
SELECT 
    '📋 CONFIGURAÇÕES DO BUCKET:' as info,
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

-- 3. GARANTIR CONFIGURAÇÕES CORRETAS
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

-- 4. VERIFICAR QUANTIDADE DE ARQUIVOS
SELECT 
    '📊 STATUS DO BUCKET:' as info,
    COUNT(*) as total_arquivos,
    CASE 
        WHEN COUNT(*) > 0 
        THEN '✅ Bucket contém ' || COUNT(*) || ' arquivo(s)'
        ELSE '📁 Bucket está vazio'
    END as status
FROM storage.objects 
WHERE bucket_id = 'documentos-propostas-corretores';

-- 5. LISTAR ARQUIVOS RECENTES (VERSÃO CORRIGIDA)
SELECT 
    '📁 ARQUIVOS RECENTES:' as info,
    name as arquivo,
    CASE 
        WHEN metadata IS NOT NULL AND metadata->>'size' ~ '^[0-9]+$' 
        THEN ROUND((metadata->>'size')::numeric / 1024.0, 2) || ' KB'
        ELSE 'Tamanho não disponível'
    END as tamanho,
    created_at::date as data_criacao
FROM storage.objects 
WHERE bucket_id = 'documentos-propostas-corretores'
ORDER BY created_at DESC 
LIMIT 5;

-- 6. VERIFICAR TODOS OS BUCKETS DISPONÍVEIS
SELECT 
    '🗂️ TODOS OS BUCKETS:' as info,
    name as bucket_name,
    public as publico,
    CASE 
        WHEN file_size_limit IS NOT NULL 
        THEN ROUND(file_size_limit / 1024.0 / 1024.0, 2) || ' MB'
        ELSE 'Sem limite'
    END as limite
FROM storage.buckets 
ORDER BY created_at;

-- 7. VERIFICAÇÃO FINAL
SELECT 
    '🎉 RESULTADO FINAL:' as resultado,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM storage.buckets 
            WHERE name = 'documentos-propostas-corretores' 
            AND public = true
            AND file_size_limit IS NOT NULL
        )
        THEN '✅ Bucket documentos-propostas-corretores configurado corretamente!'
        ELSE '❌ Bucket precisa de configuração adicional'
    END as status_final;

-- 8. INFORMAÇÕES PARA DEBUG
SELECT 
    '🔧 INFO PARA DEBUG:' as debug,
    'Bucket: documentos-propostas-corretores' as bucket_alvo,
    'Público: Sim' as configuracao_publica,
    'Limite: 50MB' as limite_arquivo,
    'Tipos: JPEG, PNG, PDF' as tipos_permitidos;
