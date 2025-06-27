-- Criar o bucket documentos_propostas se não existir
DO $$
BEGIN
    -- Criar o bucket se não existir
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('documentos_propostas', 'documentos_propostas', false)
    ON CONFLICT (id) DO NOTHING;
    
    -- Limpar políticas existentes para o bucket (opcional)
    DELETE FROM storage.policies 
    WHERE bucket_id = 'documentos_propostas';
    
    -- Política para permitir upload de arquivos para qualquer usuário autenticado
    INSERT INTO storage.policies (bucket_id, name, permission, definition)
    VALUES (
        'documentos_propostas',
        'Permitir uploads para usuários autenticados',
        'INSERT',
        '(auth.role() = ''authenticated'')'
    );
    
    -- Política para permitir leitura de arquivos para qualquer usuário autenticado
    INSERT INTO storage.policies (bucket_id, name, permission, definition)
    VALUES (
        'documentos_propostas',
        'Permitir leitura para usuários autenticados',
        'SELECT',
        '(auth.role() = ''authenticated'')'
    );
    
    -- Política para permitir atualização de arquivos para qualquer usuário autenticado
    INSERT INTO storage.policies (bucket_id, name, permission, definition)
    VALUES (
        'documentos_propostas',
        'Permitir atualização para usuários autenticados',
        'UPDATE',
        '(auth.role() = ''authenticated'')'
    );
    
    -- Política para permitir exclusão de arquivos para qualquer usuário autenticado
    INSERT INTO storage.policies (bucket_id, name, permission, definition)
    VALUES (
        'documentos_propostas',
        'Permitir exclusão para usuários autenticados',
        'DELETE',
        '(auth.role() = ''authenticated'')'
    );
END $$;

-- Adicionar coluna tipo à tabela documentos_propostas_corretores se não existir
DO $$
BEGIN
    -- Verificar se a coluna já existe
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'documentos_propostas_corretores'
        AND column_name = 'tipo'
    ) THEN
        -- Adicionar a coluna tipo
        ALTER TABLE documentos_propostas_corretores ADD COLUMN tipo TEXT;
    END IF;
END $$;
