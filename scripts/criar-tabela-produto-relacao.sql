-- Criar tabela de relação entre produtos e tabelas de preços
CREATE TABLE IF NOT EXISTS produto_tabela_relacao (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  produto_id UUID NOT NULL REFERENCES produtos_corretores(id) ON DELETE CASCADE,
  tabela_id UUID NOT NULL REFERENCES tabelas_precos(id) ON DELETE CASCADE,
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
