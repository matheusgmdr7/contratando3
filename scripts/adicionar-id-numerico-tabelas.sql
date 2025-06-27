-- Adicionar uma coluna id_numerico às tabelas_precos para permitir busca por ID numérico
ALTER TABLE tabelas_precos ADD COLUMN IF NOT EXISTS id_numerico SERIAL;

-- Atualizar os registros existentes com valores sequenciais
UPDATE tabelas_precos SET id_numerico = DEFAULT WHERE id_numerico IS NULL;

-- Criar um índice para melhorar a performance das consultas por id_numerico
CREATE INDEX IF NOT EXISTS idx_tabelas_precos_id_numerico ON tabelas_precos(id_numerico);

-- Adicionar uma trigger para manter o id_numerico atualizado em novas inserções
CREATE OR REPLACE FUNCTION atualizar_id_numerico()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.id_numerico IS NULL THEN
        NEW.id_numerico = nextval('tabelas_precos_id_numerico_seq');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_atualizar_id_numerico ON tabelas_precos;
CREATE TRIGGER trg_atualizar_id_numerico
BEFORE INSERT ON tabelas_precos
FOR EACH ROW
EXECUTE FUNCTION atualizar_id_numerico();
