-- Criar tabela para dependentes das propostas de corretores
CREATE TABLE IF NOT EXISTS dependentes_propostas_corretores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposta_corretor_id UUID NOT NULL REFERENCES propostas_corretores(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(14),
    rg VARCHAR(20),
    data_nascimento DATE,
    cns VARCHAR(20),
    parentesco VARCHAR(50),
    nome_mae VARCHAR(255),
    peso DECIMAL(5,2),
    altura DECIMAL(5,2),
    valor_individual DECIMAL(10,2),
    uf_nascimento VARCHAR(2),
    sexo VARCHAR(20),
    orgao_emissor VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_dependentes_propostas_corretores_proposta_id 
ON dependentes_propostas_corretores(proposta_corretor_id);

CREATE INDEX IF NOT EXISTS idx_dependentes_propostas_corretores_cpf 
ON dependentes_propostas_corretores(cpf);

-- Adicionar comentários
COMMENT ON TABLE dependentes_propostas_corretores IS 'Tabela para armazenar dependentes das propostas criadas pelos corretores';
COMMENT ON COLUMN dependentes_propostas_corretores.proposta_corretor_id IS 'Referência para a proposta do corretor';
COMMENT ON COLUMN dependentes_propostas_corretores.parentesco IS 'Grau de parentesco com o titular';
COMMENT ON COLUMN dependentes_propostas_corretores.valor_individual IS 'Valor individual do plano para este dependente';
