-- Verificar o tipo da coluna id na tabela produtos_corretores
DO $$
DECLARE
    column_type TEXT;
BEGIN
    SELECT data_type INTO column_type
    FROM information_schema.columns
    WHERE table_name = 'produtos_corretores' AND column_name = 'id';
    
    RAISE NOTICE 'Tipo da coluna id na tabela produtos_corretores: %', column_type;
END $$;

-- Verificar o tipo da coluna id na tabela tabelas_precos
DO $$
DECLARE
    column_type TEXT;
BEGIN
    SELECT data_type INTO column_type
    FROM information_schema.columns
    WHERE table_name = 'tabelas_precos' AND column_name = 'id';
    
    RAISE NOTICE 'Tipo da coluna id na tabela tabelas_precos: %', column_type;
END $$;

-- Criar tabela de relação entre produtos e tabelas de preços com o tipo correto
CREATE TABLE IF NOT EXISTS produto_tabela_relacao (
  id BIGSERIAL PRIMARY KEY,
  produto_id BIGINT NOT NULL REFERENCES produtos_corretores(id) ON DELETE CASCADE,
  tabela_id BIGINT NOT NULL REFERENCES tabelas_precos(id) ON DELETE CASCADE,
  segmentacao VARCHAR(255) NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(produto_id, segmentacao)
);

-- Migrar dados existentes
INSERT INTO produto_tabela_relacao (produto_id, tabela_id, segmentacao, is_default)
SELECT id, tabela_id, 'Padrão', true
FROM produtos_corretores
WHERE tabela_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Criar função para atualizar o timestamp de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar o timestamp
CREATE TRIGGER update_produto_tabela_relacao_updated_at
BEFORE UPDATE ON produto_tabela_relacao
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_produto_tabela_relacao_produto_id ON produto_tabela_relacao(produto_id);
CREATE INDEX IF NOT EXISTS idx_produto_tabela_relacao_tabela_id ON produto_tabela_relacao(tabela_id);
