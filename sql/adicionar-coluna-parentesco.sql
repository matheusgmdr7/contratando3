-- Adicionar coluna parentesco à tabela dependentes
ALTER TABLE dependentes ADD COLUMN IF NOT EXISTS parentesco VARCHAR(50);

-- Adicionar comentário explicativo
COMMENT ON COLUMN dependentes.parentesco IS 'Relação de parentesco com o titular (ex: Cônjuge, Filho(a), Pai/Mãe)';

-- Atualizar registros existentes (opcional)
UPDATE dependentes SET parentesco = 'Não especificado' WHERE parentesco IS NULL;

-- Adicionar índice para melhorar performance de consultas (opcional)
CREATE INDEX IF NOT EXISTS idx_dependentes_parentesco ON dependentes(parentesco);
