-- Adicionar coluna corretor_id na tabela propostas para associar propostas aos corretores
ALTER TABLE propostas 
ADD COLUMN corretor_id UUID REFERENCES corretores(id);

-- Criar índice para melhorar performance das consultas
CREATE INDEX idx_propostas_corretor_id ON propostas(corretor_id);

-- Adicionar comentário para documentação
COMMENT ON COLUMN propostas.corretor_id IS 'ID do corretor responsável pela proposta (quando vem de link exclusivo)';
