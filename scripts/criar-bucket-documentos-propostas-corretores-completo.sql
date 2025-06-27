-- SCRIPT COMPLETO PARA CRIAR E CONFIGURAR BUCKET DE DOCUMENTOS
-- ===========================================================

-- 1. VERIFICAR BUCKETS EXISTENTES
SELECT 
    'Buckets existentes:' as info,
    name as bucket_name,
    public as publico,
    file_size_limit as limite_mb,
    created_at
FROM storage.buckets 
ORDER BY created_at DESC;

-- 2. CRIAR BUCKET SE NÃO EXISTIR (usando INSERT direto)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT 
    'documentos-propostas-corretores',
    'documentos-propostas-corretores', 
    true,
    52428800, -- 50MB
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'image/jpg']
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'documentos-propostas-corretores'
);

-- 3. VERIFICAR SE FOI CRIADO
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'documentos-propostas-corretores')
        THEN '✅ Bucket documentos-propostas-corretores existe'
        ELSE '❌ Bucket documentos-propostas-corretores NÃO existe'
    END as status;

-- 4. REMOVER POLÍTICAS EXISTENTES (se houver)
DELETE FROM storage.policies 
WHERE bucket_id = 'documentos-propostas-corretores';

-- 5. CRIAR POLÍTICAS PERMISSIVAS PARA TESTES
INSERT INTO storage.policies (id, bucket_id, name, definition, check_expression, command)
VALUES 
    (
        'documentos-propostas-corretores-select',
        'documentos-propostas-corretores',
        'Permitir visualização de documentos',
        'true',
        'true', 
        'SELECT'
    ),
    (
        'documentos-propostas-corretores-insert',
        'documentos-propostas-corretores',
        'Permitir upload de documentos',
        'true',
        'true',
        'INSERT'
    ),
    (
        'documentos-propostas-corretores-update',
        'documentos-propostas-corretores', 
        'Permitir atualização de documentos',
        'true',
        'true',
        'UPDATE'
    ),
    (
        'documentos-propostas-corretores-delete',
        'documentos-propostas-corretores',
        'Permitir exclusão de documentos', 
        'true',
        'true',
        'DELETE'
    );

-- 6. VERIFICAR POLÍTICAS CRIADAS
SELECT 
    'Políticas criadas:' as info,
    name as politica,
    command as comando,
    definition as definicao
FROM storage.policies 
WHERE bucket_id = 'documentos-propostas-corretores'
ORDER BY command;

-- 7. VERIFICAR CONFIGURAÇÃO FINAL
SELECT 
    '🎉 CONFIGURAÇÃO FINAL:' as status,
    b.name as bucket_name,
    b.public as publico,
    b.file_size_limit as limite_bytes,
    ROUND(b.file_size_limit / 1024.0 / 1024.0, 2) as limite_mb,
    b.allowed_mime_types as tipos_permitidos,
    COUNT(p.id) as total_politicas
FROM storage.buckets b
LEFT JOIN storage.policies p ON b.id = p.bucket_id
WHERE b.name = 'documentos-propostas-corretores'
GROUP BY b.name, b.public, b.file_size_limit, b.allowed_mime_types;

-- 8. TESTAR ACESSO (opcional)
SELECT 
    CASE 
        WHEN COUNT(*) >= 4 
        THEN '✅ Todas as políticas necessárias estão configuradas'
        ELSE '⚠️ Algumas políticas podem estar faltando'
    END as teste_politicas
FROM storage.policies 
WHERE bucket_id = 'documentos-propostas-corretores';
