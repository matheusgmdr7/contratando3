-- Este script remove o conceito de tabela padrão e simplifica a estrutura

-- Remover a coluna is_default se ela existir
ALTER TABLE produto_tabela_relacao DROP COLUMN IF EXISTS is_default;

-- Remover o trigger que gerenciava tabelas padrão
DROP TRIGGER IF EXISTS trigger_atualizar_tabela_padrao ON produto_tabela_relacao;
DROP FUNCTION IF EXISTS atualizar_tabela_padrao();

-- Adicionar um campo para diferenciar tabelas com a mesma segmentação (se ainda não existir)
ALTER TABLE produto_tabela_relacao ADD COLUMN IF NOT EXISTS descricao TEXT;

-- Adicionar um índice para melhorar a performance de consultas
CREATE INDEX IF NOT EXISTS idx_produto_tabela_relacao_produto_segmentacao 
ON produto_tabela_relacao(produto_id, segmentacao);

-- Remover a restrição de chave única se existir
DO $$
DECLARE
    constraint_name text;
BEGIN
    SELECT tc.constraint_name INTO constraint_name
    FROM information_schema.table_constraints tc
    WHERE tc.table_name = 'produto_tabela_relacao'
    AND tc.constraint_type = 'UNIQUE'
    AND tc.constraint_name LIKE '%produto_id_segmentacao%';
    
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE produto_tabela_relacao DROP CONSTRAINT IF EXISTS ' || constraint_name;
        RAISE NOTICE 'Restrição % removida com sucesso', constraint_name;
    ELSE
        RAISE NOTICE 'Restrição de chave única para produto_id e segmentação não encontrada';
    END IF;
END $$;
