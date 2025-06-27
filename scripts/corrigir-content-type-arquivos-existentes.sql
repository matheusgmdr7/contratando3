-- Script para identificar arquivos com content-type incorreto no Supabase Storage
-- Este script deve ser executado no painel do Supabase ou via API

-- Verificar arquivos no bucket documentos_propostas
SELECT 
    name,
    metadata->>'mimetype' as content_type,
    metadata->>'size' as file_size,
    created_at,
    updated_at
FROM storage.objects 
WHERE bucket_id = 'documentos_propostas'
    AND (
        metadata->>'mimetype' = 'application/json' 
        OR metadata->>'mimetype' = 'application/octet-stream'
        OR metadata->>'mimetype' IS NULL
    )
ORDER BY created_at DESC
LIMIT 50;

-- Verificar estatísticas de tipos de arquivo
SELECT 
    metadata->>'mimetype' as content_type,
    COUNT(*) as quantidade
FROM storage.objects 
WHERE bucket_id = 'documentos_propostas'
GROUP BY metadata->>'mimetype'
ORDER BY quantidade DESC;

-- Verificar arquivos recentes que podem ter o problema
SELECT 
    name,
    metadata->>'mimetype' as content_type,
    metadata->>'size' as file_size,
    created_at
FROM storage.objects 
WHERE bucket_id = 'documentos_propostas'
    AND created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
