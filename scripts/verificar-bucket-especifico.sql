-- ============================================================
-- SCRIPT PARA VERIFICAR E CRIAR BUCKET ESPECÍFICO
-- ============================================================

DO $$
BEGIN
    RAISE NOTICE '🔍 VERIFICANDO BUCKET ESPECÍFICO...';
    
    -- Verificar se o bucket existe
    IF EXISTS (
        SELECT 1 FROM storage.buckets 
        WHERE name = 'documentos-propostas-corretores'
    ) THEN
        RAISE NOTICE '✅ Bucket "documentos-propostas-corretores" EXISTE!';
        
        -- Mostrar configurações do bucket
        SELECT 
            name,
            public,
            file_size_limit,
            allowed_mime_types
        FROM storage.buckets 
        WHERE name = 'documentos-propostas-corretores';
        
    ELSE
        RAISE NOTICE '❌ Bucket "documentos-propostas-corretores" NÃO EXISTE!';
        RAISE NOTICE '🏗️ Criando bucket...';
        
        -- Criar o bucket
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'documentos-propostas-corretores',
            'documentos-propostas-corretores',
            true,
            52428800, -- 50MB
            ARRAY['image/jpeg', 'image/png', 'application/pdf', 'image/jpg']
        );
        
        RAISE NOTICE '✅ Bucket criado com sucesso!';
    END IF;
    
    RAISE NOTICE '📊 LISTANDO TODOS OS BUCKETS:';
END $$;

-- Listar todos os buckets
SELECT 
    '📦 ' || name as bucket_name,
    CASE WHEN public THEN '🌐 Público' ELSE '🔒 Privado' END as visibilidade,
    CASE 
        WHEN file_size_limit IS NOT NULL 
        THEN '📏 ' || ROUND(file_size_limit / 1024.0 / 1024.0, 1) || 'MB'
        ELSE '📏 Sem limite'
    END as limite_tamanho
FROM storage.buckets
ORDER BY name;
