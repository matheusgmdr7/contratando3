-- Script para verificar e criar o bucket documentos_propostas
DO $$
BEGIN
    -- Verificar se o bucket existe
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets 
        WHERE id = 'documentos_propostas'
    ) THEN
        -- Criar o bucket se não existir
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('documentos_propostas', 'documentos_propostas', true);
        
        RAISE NOTICE 'Bucket documentos_propostas criado com sucesso!';
    ELSE
        RAISE NOTICE 'Bucket documentos_propostas já existe.';
    END IF;
    
    -- Limpar políticas existentes
    DELETE FROM storage.policies 
    WHERE bucket_id = 'documentos_propostas';
    
    -- Criar políticas de acesso
    INSERT INTO storage.policies (bucket_id, name, permission, definition)
    VALUES 
        ('documentos_propostas', 'Permitir uploads públicos', 'INSERT', 'true'),
        ('documentos_propostas', 'Permitir leitura pública', 'SELECT', 'true'),
        ('documentos_propostas', 'Permitir atualização pública', 'UPDATE', 'true'),
        ('documentos_propostas', 'Permitir exclusão pública', 'DELETE', 'true');
    
    RAISE NOTICE 'Políticas de acesso configuradas com sucesso!';
    
END $$;

-- Verificar buckets existentes
SELECT id, name, public FROM storage.buckets ORDER BY created_at;
