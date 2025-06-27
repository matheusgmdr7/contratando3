-- Este script remove a restrição de chave única que impede múltiplas tabelas com a mesma segmentação
-- para um produto

-- Primeiro, identificamos o nome da restrição
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

-- Adicionar um novo campo para diferenciar tabelas com a mesma segmentação
ALTER TABLE produto_tabela_relacao ADD COLUMN IF NOT EXISTS descricao TEXT;

-- Adicionar um índice para melhorar a performance de consultas
CREATE INDEX IF NOT EXISTS idx_produto_tabela_relacao_produto_segmentacao 
ON produto_tabela_relacao(produto_id, segmentacao);

-- Atualizar a coluna is_default para garantir que apenas uma tabela seja padrão por segmentação
CREATE OR REPLACE FUNCTION atualizar_tabela_padrao()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default THEN
        UPDATE produto_tabela_relacao
        SET is_default = FALSE
        WHERE produto_id = NEW.produto_id 
        AND segmentacao = NEW.segmentacao
        AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover o trigger se já existir
DROP TRIGGER IF EXISTS trigger_atualizar_tabela_padrao ON produto_tabela_relacao;

-- Criar o trigger
CREATE TRIGGER trigger_atualizar_tabela_padrao
BEFORE INSERT OR UPDATE ON produto_tabela_relacao
FOR EACH ROW
EXECUTE FUNCTION atualizar_tabela_padrao();
