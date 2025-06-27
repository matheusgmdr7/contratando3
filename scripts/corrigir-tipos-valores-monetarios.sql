-- Script para corrigir tipos de colunas monetárias no Supabase
-- Converte para NUMERIC(10,2) que é o padrão para valores monetários

-- Tabela propostas
ALTER TABLE propostas 
ALTER COLUMN valor_mensal TYPE NUMERIC(10,2) USING valor_mensal::NUMERIC(10,2);

ALTER TABLE propostas 
ALTER COLUMN valor_total TYPE NUMERIC(10,2) USING valor_total::NUMERIC(10,2);

ALTER TABLE propostas 
ALTER COLUMN valor_plano TYPE NUMERIC(10,2) USING valor_plano::NUMERIC(10,2);

-- Tabela propostas_corretores (se ainda existir)
ALTER TABLE propostas_corretores 
ALTER COLUMN valor_proposta TYPE NUMERIC(10,2) USING valor_proposta::NUMERIC(10,2);

ALTER TABLE propostas_corretores 
ALTER COLUMN valor_mensal TYPE NUMERIC(10,2) USING valor_mensal::NUMERIC(10,2);

-- Tabela dependentes
ALTER TABLE dependentes 
ALTER COLUMN valor_individual TYPE NUMERIC(10,2) USING valor_individual::NUMERIC(10,2);

-- Tabela tabelas_precos
ALTER TABLE tabelas_precos 
ALTER COLUMN valor TYPE NUMERIC(10,2) USING valor::NUMERIC(10,2);

-- Comentários para documentação
COMMENT ON COLUMN propostas.valor_mensal IS 'Valor mensal em formato NUMERIC(10,2) - ex: 1212.00 para R$ 1.212,00';
COMMENT ON COLUMN propostas.valor_total IS 'Valor total em formato NUMERIC(10,2) - ex: 1212.00 para R$ 1.212,00';
COMMENT ON COLUMN dependentes.valor_individual IS 'Valor individual do dependente em formato NUMERIC(10,2)';
