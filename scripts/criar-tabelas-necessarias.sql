-- Verificar e criar tabela de produtos_corretores se não existir
CREATE TABLE IF NOT EXISTS produtos_corretores (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  operadora TEXT,
  tipo TEXT,
  comissao TEXT,
  descricao TEXT,
  disponivel BOOLEAN DEFAULT true,
  tabela_id UUID REFERENCES tabelas_precos(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verificar e criar tabela de tabelas_precos se não existir
CREATE TABLE IF NOT EXISTS tabelas_precos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  operadora TEXT,
  tipo_plano TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verificar e criar tabela de tabelas_precos_faixas se não existir
CREATE TABLE IF NOT EXISTS tabelas_precos_faixas (
  id SERIAL PRIMARY KEY,
  tabela_id UUID REFERENCES tabelas_precos(id) ON DELETE CASCADE,
  faixa_etaria TEXT NOT NULL,
  valor DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verificar e criar tabela de produto_tabela_relacao se não existir
CREATE TABLE IF NOT EXISTS produto_tabela_relacao (
  id SERIAL PRIMARY KEY,
  produto_id INTEGER REFERENCES produtos_corretores(id) ON DELETE CASCADE,
  tabela_id UUID REFERENCES tabelas_precos(id) ON DELETE CASCADE,
  segmentacao TEXT NOT NULL DEFAULT 'Padrão',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(produto_id, tabela_id, segmentacao)
);

-- Adicionar extensão uuid-ossp se não existir
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
