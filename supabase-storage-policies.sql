-- Adicionar coluna whatsapp_cliente à tabela propostas_corretores
ALTER TABLE propostas_corretores
ADD COLUMN IF NOT EXISTS whatsapp_cliente TEXT;

-- Adicionar coluna tipo à tabela documentos_propostas_corretores
ALTER TABLE documentos_propostas_corretores
ADD COLUMN IF NOT EXISTS tipo TEXT;

-- Criar bucket para documentos de clientes
INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos_clientes', 'documentos_clientes', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas para o bucket 'documentos_clientes'

-- 1. Política para permitir a criação de buckets por usuários autenticados
CREATE POLICY "Permitir criação de buckets para usuários autenticados" ON storage.buckets
FOR INSERT TO authenticated
WITH CHECK (true);

-- 2. Política para permitir leitura de buckets por usuários autenticados
CREATE POLICY "Permitir leitura de buckets para usuários autenticados" ON storage.buckets
FOR SELECT TO authenticated
USING (true);

-- 3. Política para permitir upload de arquivos por usuários autenticados
CREATE POLICY "Permitir upload de arquivos para usuários autenticados" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documentos_clientes');

-- 4. Política para permitir atualização de arquivos por usuários autenticados
CREATE POLICY "Permitir atualização de arquivos para usuários autenticados" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'documentos_clientes')
WITH CHECK (bucket_id = 'documentos_clientes');

-- 5. Política para permitir leitura de arquivos por usuários autenticados
CREATE POLICY "Permitir leitura de arquivos para usuários autenticados" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'documentos_clientes');

-- 6. Política para permitir exclusão de arquivos por usuários autenticados
CREATE POLICY "Permitir exclusão de arquivos para usuários autenticados" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'documentos_clientes');

-- Índices para melhorar a performance das consultas
CREATE INDEX IF NOT EXISTS idx_propostas_corretores_corretor_id ON propostas_corretores(corretor_id);
CREATE INDEX IF NOT EXISTS idx_documentos_propostas_corretores_proposta_id ON documentos_propostas_corretores(proposta_id);
CREATE INDEX IF NOT EXISTS idx_documentos_propostas_corretores_tipo ON documentos_propostas_corretores(tipo);
