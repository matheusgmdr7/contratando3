-- SCRIPT SIMPLES PARA CRIAR BUCKET
-- =================================

-- 1. CRIAR BUCKET BÁSICO
INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos-propostas-corretores', 'documentos-propostas-corretores', false)
ON CONFLICT (id) DO NOTHING;

-- 2. POLÍTICA BÁSICA PARA UPLOAD
CREATE POLICY "upload_documentos_corretores"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documentos-propostas-corretores');

-- 3. POLÍTICA BÁSICA PARA VISUALIZAÇÃO
CREATE POLICY "view_documentos_corretores"
ON storage.objects FOR SELECT
USING (bucket_id = 'documentos-propostas-corretores');

-- 4. VERIFICAR CRIAÇÃO
SELECT * FROM storage.buckets WHERE id = 'documentos-propostas-corretores';
