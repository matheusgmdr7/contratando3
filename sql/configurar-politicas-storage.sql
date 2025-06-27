-- Verificar se o bucket "arquivos" existe e criá-lo se não existir
INSERT INTO storage.buckets (id, name, public)
SELECT 'arquivos', 'arquivos', true
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'arquivos');

-- Remover políticas existentes para o bucket "arquivos" para evitar conflitos
DROP POLICY IF EXISTS "Permitir acesso público de leitura" ON storage.objects;
DROP POLICY IF EXISTS "Permitir upload para usuários autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Permitir upload para todos" ON storage.objects;
DROP POLICY IF EXISTS "Permitir gerenciamento para usuários autenticados" ON storage.objects;

-- Política para permitir leitura pública de todos os arquivos
CREATE POLICY "Permitir acesso público de leitura"
ON storage.objects FOR SELECT
USING (bucket_id = 'arquivos');

-- Política para permitir upload para todos os usuários (incluindo anônimos)
CREATE POLICY "Permitir upload para todos"
ON storage.objects FOR INSERT
USING (bucket_id = 'arquivos');

-- Política para permitir atualização e exclusão para usuários autenticados
CREATE POLICY "Permitir gerenciamento para usuários autenticados"
ON storage.objects FOR UPDATE OR DELETE
USING (bucket_id = 'arquivos' AND auth.role() = 'authenticated');

-- Habilitar o acesso público ao bucket
UPDATE storage.buckets
SET public = true
WHERE name = 'arquivos';
