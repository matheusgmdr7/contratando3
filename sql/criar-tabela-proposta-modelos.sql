-- SQL para criar a tabela proposta_modelos no Supabase

-- Criar a tabela proposta_modelos
CREATE TABLE IF NOT EXISTS proposta_modelos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    operadora VARCHAR(255) NOT NULL,
    tipo_plano VARCHAR(100) NOT NULL,
    arquivo_url TEXT NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Adicionar alguns dados de exemplo
INSERT INTO proposta_modelos (nome, descricao, operadora, tipo_plano, arquivo_url, ativo)
VALUES
    ('Plano Básico - Amil', 'Plano de saúde básico da Amil com cobertura nacional', 'Amil', 'Individual', 'https://jtzbuxoslaotpnwsphqv.supabase.co/storage/v1/object/public/arquivos/modelos-propostas/amil-basico.pdf', TRUE),
    ('Plano Intermediário - Amil', 'Plano de saúde intermediário da Amil com cobertura nacional', 'Amil', 'Familiar', 'https://jtzbuxoslaotpnwsphqv.supabase.co/storage/v1/object/public/arquivos/modelos-propostas/amil-intermediario.pdf', TRUE),
    ('Plano Premium - Amil', 'Plano de saúde premium da Amil com cobertura nacional', 'Amil', 'Empresarial', 'https://jtzbuxoslaotpnwsphqv.supabase.co/storage/v1/object/public/arquivos/modelos-propostas/amil-premium.pdf', TRUE),
    ('Plano Básico - Unimed', 'Plano de saúde básico da Unimed com cobertura estadual', 'Unimed', 'Individual', 'https://jtzbuxoslaotpnwsphqv.supabase.co/storage/v1/object/public/arquivos/modelos-propostas/unimed-basico.pdf', TRUE),
    ('Plano Intermediário - Unimed', 'Plano de saúde intermediário da Unimed com cobertura estadual', 'Unimed', 'Familiar', 'https://jtzbuxoslaotpnwsphqv.supabase.co/storage/v1/object/public/arquivos/modelos-propostas/unimed-intermediario.pdf', TRUE),
    ('Plano Premium - Unimed', 'Plano de saúde premium da Unimed com cobertura nacional', 'Unimed', 'Empresarial', 'https://jtzbuxoslaotpnwsphqv.supabase.co/storage/v1/object/public/arquivos/modelos-propostas/unimed-premium.pdf', TRUE),
    ('Plano Básico - SulAmérica', 'Plano de saúde básico da SulAmérica com cobertura estadual', 'SulAmérica', 'Individual', 'https://jtzbuxoslaotpnwsphqv.supabase.co/storage/v1/object/public/arquivos/modelos-propostas/sulamerica-basico.pdf', TRUE),
    ('Plano Intermediário - SulAmérica', 'Plano de saúde intermediário da SulAmérica com cobertura nacional', 'SulAmérica', 'Familiar', 'https://jtzbuxoslaotpnwsphqv.supabase.co/storage/v1/object/public/arquivos/modelos-propostas/sulamerica-intermediario.pdf', TRUE),
    ('Plano Premium - SulAmérica', 'Plano de saúde premium da SulAmérica com cobertura nacional', 'SulAmérica', 'Empresarial', 'https://jtzbuxoslaotpnwsphqv.supabase.co/storage/v1/object/public/arquivos/modelos-propostas/sulamerica-premium.pdf', TRUE);

-- Criar índices para melhorar a performance
CREATE INDEX IF NOT EXISTS idx_proposta_modelos_nome ON proposta_modelos(nome);
CREATE INDEX IF NOT EXISTS idx_proposta_modelos_operadora ON proposta_modelos(operadora);
CREATE INDEX IF NOT EXISTS idx_proposta_modelos_tipo_plano ON proposta_modelos(tipo_plano);
CREATE INDEX IF NOT EXISTS idx_proposta_modelos_ativo ON proposta_modelos(ativo);

-- Adicionar trigger para atualizar o updated_at
CREATE OR REPLACE FUNCTION update_proposta_modelos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_proposta_modelos_updated_at ON proposta_modelos;
CREATE TRIGGER set_proposta_modelos_updated_at
BEFORE UPDATE ON proposta_modelos
FOR EACH ROW
EXECUTE FUNCTION update_proposta_modelos_updated_at();

-- Adicionar comentários
COMMENT ON TABLE proposta_modelos IS 'Armazena os modelos de propostas disponíveis para preenchimento';
COMMENT ON COLUMN proposta_modelos.nome IS 'Nome do modelo de proposta';
COMMENT ON COLUMN proposta_modelos.descricao IS 'Descrição detalhada do modelo de proposta';
COMMENT ON COLUMN proposta_modelos.operadora IS 'Nome da operadora de saúde';
COMMENT ON COLUMN proposta_modelos.tipo_plano IS 'Tipo do plano (Individual, Familiar, Empresarial)';
COMMENT ON COLUMN proposta_modelos.arquivo_url IS 'URL do arquivo PDF do modelo de proposta';
COMMENT ON COLUMN proposta_modelos.ativo IS 'Indica se o modelo está ativo e disponível para uso';
