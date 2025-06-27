-- SQL para criar a tabela de propostas com validação de CPF

-- Função para validar CPF
CREATE OR REPLACE FUNCTION validar_cpf(cpf TEXT) RETURNS BOOLEAN AS $$
DECLARE
    soma INTEGER := 0;
    resto INTEGER;
    digito1 INTEGER;
    digito2 INTEGER;
    i INTEGER;
    cpf_array INTEGER[];
BEGIN
    -- Remove caracteres não numéricos
    cpf := REGEXP_REPLACE(cpf, '[^0-9]', '', 'g');
    
    -- Verifica se tem 11 dígitos
    IF LENGTH(cpf) != 11 THEN
        RETURN FALSE;
    END IF;
    
    -- Verifica se todos os dígitos são iguais (caso inválido)
    IF cpf ~ '^(\d)\1+$' THEN
        RETURN FALSE;
    END IF;
    
    -- Converte string para array de inteiros
    FOR i IN 1..11 LOOP
        cpf_array[i] := SUBSTRING(cpf FROM i FOR 1)::INTEGER;
    END LOOP;
    
    -- Validação do primeiro dígito verificador
    soma := 0;
    FOR i IN 1..9 LOOP
        soma := soma + cpf_array[i] * (11 - i);
    END LOOP;
    
    resto := (soma * 10) % 11;
    IF resto = 10 THEN
        digito1 := 0;
    ELSE
        digito1 := resto;
    END IF;
    
    IF digito1 != cpf_array[10] THEN
        RETURN FALSE;
    END IF;
    
    -- Validação do segundo dígito verificador
    soma := 0;
    FOR i IN 1..10 LOOP
        soma := soma + cpf_array[i] * (12 - i);
    END LOOP;
    
    resto := (soma * 10) % 11;
    IF resto = 10 THEN
        digito2 := 0;
    ELSE
        digito2 := resto;
    END IF;
    
    RETURN digito2 = cpf_array[11];
END;
$$ LANGUAGE plpgsql;

-- Criar tabela propostas se não existir
CREATE TABLE IF NOT EXISTS propostas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Dados do corretor
    corretor_nome VARCHAR(255) NOT NULL,
    modelo_id UUID NOT NULL,
    
    -- Dados do cliente
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) NOT NULL,
    rg VARCHAR(20) NOT NULL,
    data_nascimento DATE NOT NULL,
    cns VARCHAR(20),
    email VARCHAR(255) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    
    -- Endereço
    endereco TEXT NOT NULL,
    bairro VARCHAR(100) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    estado VARCHAR(2) NOT NULL,
    cep VARCHAR(9) NOT NULL,
    
    -- Dados do plano
    tipo_cobertura VARCHAR(20) NOT NULL,
    tipo_acomodacao VARCHAR(20) NOT NULL,
    codigo_plano VARCHAR(50) NOT NULL,
    valor_plano NUMERIC(10,2) NOT NULL,
    
    -- Dados adicionais
    tem_dependentes BOOLEAN NOT NULL DEFAULT FALSE,
    peso VARCHAR(10) NOT NULL,
    altura VARCHAR(10) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pendente',
    
    -- URLs
    pdf_url TEXT,
    documentos_urls JSONB DEFAULT '{}'::jsonb,
    assinatura_url TEXT,
    
    -- Restrição para validar CPF
    CONSTRAINT cpf_valido CHECK (validar_cpf(cpf))
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_propostas_cpf ON propostas(cpf);
CREATE INDEX IF NOT EXISTS idx_propostas_nome ON propostas(nome);
CREATE INDEX IF NOT EXISTS idx_propostas_status ON propostas(status);
CREATE INDEX IF NOT EXISTS idx_propostas_corretor_nome ON propostas(corretor_nome);

-- Trigger para atualizar o updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON propostas;
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON propostas
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Criar tabela dependentes se não existir
CREATE TABLE IF NOT EXISTS dependentes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    proposta_id UUID NOT NULL REFERENCES propostas(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) NOT NULL,
    rg VARCHAR(20) NOT NULL,
    data_nascimento DATE NOT NULL,
    cns VARCHAR(20),
    parentesco VARCHAR(50) NOT NULL,
    
    -- Restrição para validar CPF
    CONSTRAINT dependente_cpf_valido CHECK (validar_cpf(cpf))
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_dependentes_proposta_id ON dependentes(proposta_id);
CREATE INDEX IF NOT EXISTS idx_dependentes_cpf ON dependentes(cpf);

-- Criar tabela questionario_saude se não existir
CREATE TABLE IF NOT EXISTS questionario_saude (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    proposta_id UUID NOT NULL REFERENCES propostas(id) ON DELETE CASCADE,
    pergunta_id INTEGER NOT NULL,
    pergunta TEXT NOT NULL,
    resposta VARCHAR(3) NOT NULL CHECK (resposta IN ('Sim', 'Não')),
    observacao TEXT
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_questionario_proposta_id ON questionario_saude(proposta_id);
CREATE INDEX IF NOT EXISTS idx_questionario_pergunta_id ON questionario_saude(pergunta_id);
