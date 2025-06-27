-- SQL para criar a tabela de contratos

-- Criar tabela contratos se não existir
CREATE TABLE IF NOT EXISTS contratos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Dados do contrato
    numero_contrato VARCHAR(50),
    nome_cliente VARCHAR(255) NOT NULL,
    cpf_cliente VARCHAR(14) NOT NULL,
    
    -- Dados do plano
    plano VARCHAR(255) NOT NULL,
    operadora VARCHAR(100),
    tipo_plano VARCHAR(50),
    tipo_acomodacao VARCHAR(50),
    
    -- Valores e datas
    valor_mensal NUMERIC(10,2) NOT NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE,
    
    -- Status e documentos
    status VARCHAR(20) NOT NULL DEFAULT 'pendente',
    documento_url TEXT,
    observacoes TEXT,
    
    -- Relacionamentos
    corretor_id UUID,
    proposta_id UUID
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_contratos_numero_contrato ON contratos(numero_contrato);
CREATE INDEX IF NOT EXISTS idx_contratos_nome_cliente ON contratos(nome_cliente);
CREATE INDEX IF NOT EXISTS idx_contratos_cpf_cliente ON contratos(cpf_cliente);
CREATE INDEX IF NOT EXISTS idx_contratos_status ON contratos(status);
CREATE INDEX IF NOT EXISTS idx_contratos_data_inicio ON contratos(data_inicio);

-- Trigger para atualizar o updated_at
CREATE OR REPLACE FUNCTION update_contratos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_contratos_updated_at ON contratos;
CREATE TRIGGER set_contratos_updated_at
BEFORE UPDATE ON contratos
FOR EACH ROW
EXECUTE FUNCTION update_contratos_updated_at();

-- Inserir alguns dados de exemplo para testes
INSERT INTO contratos (
    numero_contrato, 
    nome_cliente, 
    cpf_cliente, 
    plano, 
    operadora, 
    tipo_plano, 
    tipo_acomodacao, 
    valor_mensal, 
    data_inicio, 
    status
) VALUES 
('CONT-2023-001', 'Maria Silva', '123.456.789-00', 'Plano Família Premium', 'Amil', 'Familiar', 'Apartamento', 1250.00, '2023-01-15', 'ativo'),
('CONT-2023-002', 'João Santos', '987.654.321-00', 'Plano Individual Básico', 'Unimed', 'Individual', 'Enfermaria', 450.00, '2023-02-20', 'ativo'),
('CONT-2023-003', 'Ana Oliveira', '456.789.123-00', 'Plano Empresarial Plus', 'SulAmérica', 'Empresarial', 'Apartamento', 3200.00, '2023-03-10', 'pendente'),
('CONT-2023-004', 'Carlos Ferreira', '321.654.987-00', 'Plano Senior Care', 'Bradesco Saúde', 'Individual', 'Apartamento', 850.00, '2023-04-05', 'suspenso'),
('CONT-2023-005', 'Juliana Costa', '789.123.456-00', 'Plano Família Básico', 'Amil', 'Familiar', 'Enfermaria', 980.00, '2023-05-12', 'cancelado')
ON CONFLICT (id) DO NOTHING;
