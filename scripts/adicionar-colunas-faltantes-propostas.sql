-- Script para adicionar apenas as colunas que existem em propostas_corretores
-- mas não existem em propostas, mantendo a estrutura original da tabela propostas

-- VERIFICAR SE A TABELA PROPOSTAS EXISTE
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'propostas') THEN
        RAISE EXCEPTION 'Tabela propostas não existe!';
    END IF;
    RAISE NOTICE 'Tabela propostas encontrada ✅';
END $$;

-- ADICIONAR APENAS AS COLUNAS QUE FALTAM (baseado na estrutura típica de propostas_corretores)

-- Campo do corretor (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas' AND column_name = 'corretor_id') THEN
        ALTER TABLE propostas ADD COLUMN corretor_id UUID REFERENCES corretores(id);
        RAISE NOTICE 'Coluna corretor_id adicionada ✅';
    ELSE
        RAISE NOTICE 'Coluna corretor_id já existe ✅';
    END IF;
END $$;

-- Campo cliente (nome alternativo)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas' AND column_name = 'cliente') THEN
        ALTER TABLE propostas ADD COLUMN cliente VARCHAR(255);
        RAISE NOTICE 'Coluna cliente adicionada ✅';
    ELSE
        RAISE NOTICE 'Coluna cliente já existe ✅';
    END IF;
END $$;

-- Campo email_cliente (alternativo ao email)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas' AND column_name = 'email_cliente') THEN
        ALTER TABLE propostas ADD COLUMN email_cliente VARCHAR(255);
        RAISE NOTICE 'Coluna email_cliente adicionada ✅';
    ELSE
        RAISE NOTICE 'Coluna email_cliente já existe ✅';
    END IF;
END $$;

-- Campo whatsapp_cliente
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas' AND column_name = 'whatsapp_cliente') THEN
        ALTER TABLE propostas ADD COLUMN whatsapp_cliente VARCHAR(20);
        RAISE NOTICE 'Coluna whatsapp_cliente adicionada ✅';
    ELSE
        RAISE NOTICE 'Coluna whatsapp_cliente já existe ✅';
    END IF;
END $$;

-- Campo produto (nome do produto)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas' AND column_name = 'produto') THEN
        ALTER TABLE propostas ADD COLUMN produto VARCHAR(255);
        RAISE NOTICE 'Coluna produto adicionada ✅';
    ELSE
        RAISE NOTICE 'Coluna produto já existe ✅';
    END IF;
END $$;

-- Campo produto_nome
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas' AND column_name = 'produto_nome') THEN
        ALTER TABLE propostas ADD COLUMN produto_nome VARCHAR(255);
        RAISE NOTICE 'Coluna produto_nome adicionada ✅';
    ELSE
        RAISE NOTICE 'Coluna produto_nome já existe ✅';
    END IF;
END $$;

-- Campo produto_descricao
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas' AND column_name = 'produto_descricao') THEN
        ALTER TABLE propostas ADD COLUMN produto_descricao TEXT;
        RAISE NOTICE 'Coluna produto_descricao adicionada ✅';
    ELSE
        RAISE NOTICE 'Coluna produto_descricao já existe ✅';
    END IF;
END $$;

-- Campo produto_operadora
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas' AND column_name = 'produto_operadora') THEN
        ALTER TABLE propostas ADD COLUMN produto_operadora VARCHAR(255);
        RAISE NOTICE 'Coluna produto_operadora adicionada ✅';
    ELSE
        RAISE NOTICE 'Coluna produto_operadora já existe ✅';
    END IF;
END $$;

-- Campo produto_tipo
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas' AND column_name = 'produto_tipo') THEN
        ALTER TABLE propostas ADD COLUMN produto_tipo VARCHAR(100);
        RAISE NOTICE 'Coluna produto_tipo adicionada ✅';
    ELSE
        RAISE NOTICE 'Coluna produto_tipo já existe ✅';
    END IF;
END $$;

-- Campo plano_nome
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas' AND column_name = 'plano_nome') THEN
        ALTER TABLE propostas ADD COLUMN plano_nome VARCHAR(255);
        RAISE NOTICE 'Coluna plano_nome adicionada ✅';
    ELSE
        RAISE NOTICE 'Coluna plano_nome já existe ✅';
    END IF;
END $$;

-- Campo valor_proposta
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas' AND column_name = 'valor_proposta') THEN
        ALTER TABLE propostas ADD COLUMN valor_proposta DECIMAL(10,2);
        RAISE NOTICE 'Coluna valor_proposta adicionada ✅';
    ELSE
        RAISE NOTICE 'Coluna valor_proposta já existe ✅';
    END IF;
END $$;

-- Campo comissao
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas' AND column_name = 'comissao') THEN
        ALTER TABLE propostas ADD COLUMN comissao DECIMAL(10,2) DEFAULT 0;
        RAISE NOTICE 'Coluna comissao adicionada ✅';
    ELSE
        RAISE NOTICE 'Coluna comissao já existe ✅';
    END IF;
END $$;

-- Campo data (alternativo ao created_at)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas' AND column_name = 'data') THEN
        ALTER TABLE propostas ADD COLUMN data TIMESTAMP;
        RAISE NOTICE 'Coluna data adicionada ✅';
    ELSE
        RAISE NOTICE 'Coluna data já existe ✅';
    END IF;
END $$;

-- Campos de endereço detalhado
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas' AND column_name = 'endereco_cliente') THEN
        ALTER TABLE propostas ADD COLUMN endereco_cliente TEXT;
        RAISE NOTICE 'Coluna endereco_cliente adicionada ✅';
    ELSE
        RAISE NOTICE 'Coluna endereco_cliente já existe ✅';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas' AND column_name = 'cidade_cliente') THEN
        ALTER TABLE propostas ADD COLUMN cidade_cliente VARCHAR(100);
        RAISE NOTICE 'Coluna cidade_cliente adicionada ✅';
    ELSE
        RAISE NOTICE 'Coluna cidade_cliente já existe ✅';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas' AND column_name = 'estado_cliente') THEN
        ALTER TABLE propostas ADD COLUMN estado_cliente VARCHAR(2);
        RAISE NOTICE 'Coluna estado_cliente adicionada ✅';
    ELSE
        RAISE NOTICE 'Coluna estado_cliente já existe ✅';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas' AND column_name = 'cep_cliente') THEN
        ALTER TABLE propostas ADD COLUMN cep_cliente VARCHAR(10);
        RAISE NOTICE 'Coluna cep_cliente adicionada ✅';
    ELSE
        RAISE NOTICE 'Coluna cep_cliente já existe ✅';
    END IF;
END $$;

-- Campos de dados pessoais adicionais
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas' AND column_name = 'cpf_cliente') THEN
        ALTER TABLE propostas ADD COLUMN cpf_cliente VARCHAR(14);
        RAISE NOTICE 'Coluna cpf_cliente adicionada ✅';
    ELSE
        RAISE NOTICE 'Coluna cpf_cliente já existe ✅';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas' AND column_name = 'data_nascimento_cliente') THEN
        ALTER TABLE propostas ADD COLUMN data_nascimento_cliente DATE;
        RAISE NOTICE 'Coluna data_nascimento_cliente adicionada ✅';
    ELSE
        RAISE NOTICE 'Coluna data_nascimento_cliente já existe ✅';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas' AND column_name = 'rg_cliente') THEN
        ALTER TABLE propostas ADD COLUMN rg_cliente VARCHAR(20);
        RAISE NOTICE 'Coluna rg_cliente adicionada ✅';
    ELSE
        RAISE NOTICE 'Coluna rg_cliente já existe ✅';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas' AND column_name = 'orgao_emissor_cliente') THEN
        ALTER TABLE propostas ADD COLUMN orgao_emissor_cliente VARCHAR(20);
        RAISE NOTICE 'Coluna orgao_emissor_cliente adicionada ✅';
    ELSE
        RAISE NOTICE 'Coluna orgao_emissor_cliente já existe ✅';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas' AND column_name = 'cns_cliente') THEN
        ALTER TABLE propostas ADD COLUMN cns_cliente VARCHAR(20);
        RAISE NOTICE 'Coluna cns_cliente adicionada ✅';
    ELSE
        RAISE NOTICE 'Coluna cns_cliente já existe ✅';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas' AND column_name = 'nome_mae_cliente') THEN
        ALTER TABLE propostas ADD COLUMN nome_mae_cliente VARCHAR(255);
        RAISE NOTICE 'Coluna nome_mae_cliente adicionada ✅';
    ELSE
        RAISE NOTICE 'Coluna nome_mae_cliente já existe ✅';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas' AND column_name = 'sexo_cliente') THEN
        ALTER TABLE propostas ADD COLUMN sexo_cliente VARCHAR(10);
        RAISE NOTICE 'Coluna sexo_cliente adicionada ✅';
    ELSE
        RAISE NOTICE 'Coluna sexo_cliente já existe ✅';
    END IF;
END $$;

-- Campos de cobertura e acomodação
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas' AND column_name = 'cobertura') THEN
        ALTER TABLE propostas ADD COLUMN cobertura VARCHAR(50);
        RAISE NOTICE 'Coluna cobertura adicionada ✅';
    ELSE
        RAISE NOTICE 'Coluna cobertura já existe ✅';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas' AND column_name = 'acomodacao') THEN
        ALTER TABLE propostas ADD COLUMN acomodacao VARCHAR(50);
        RAISE NOTICE 'Coluna acomodacao adicionada ✅';
    ELSE
        RAISE NOTICE 'Coluna acomodacao já existe ✅';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas' AND column_name = 'codigo_plano') THEN
        ALTER TABLE propostas ADD COLUMN codigo_plano VARCHAR(50);
        RAISE NOTICE 'Coluna codigo_plano adicionada ✅';
    ELSE
        RAISE NOTICE 'Coluna codigo_plano já existe ✅';
    END IF;
END $$;

-- Campos de controle de dependentes
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas' AND column_name = 'tem_dependentes') THEN
        ALTER TABLE propostas ADD COLUMN tem_dependentes BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Coluna tem_dependentes adicionada ✅';
    ELSE
        RAISE NOTICE 'Coluna tem_dependentes já existe ✅';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas' AND column_name = 'quantidade_dependentes') THEN
        ALTER TABLE propostas ADD COLUMN quantidade_dependentes INTEGER DEFAULT 0;
        RAISE NOTICE 'Coluna quantidade_dependentes adicionada ✅';
    ELSE
        RAISE NOTICE 'Coluna quantidade_dependentes já existe ✅';
    END IF;
END $$;

-- Campos de documentos (URLs individuais)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas' AND column_name = 'rg_frente_url') THEN
        ALTER TABLE propostas ADD COLUMN rg_frente_url TEXT;
        RAISE NOTICE 'Coluna rg_frente_url adicionada ✅';
    ELSE
        RAISE NOTICE 'Coluna rg_frente_url já existe ✅';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas' AND column_name = 'rg_verso_url') THEN
        ALTER TABLE propostas ADD COLUMN rg_verso_url TEXT;
        RAISE NOTICE 'Coluna rg_verso_url adicionada ✅';
    ELSE
        RAISE NOTICE 'Coluna rg_verso_url já existe ✅';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas' AND column_name = 'cpf_url') THEN
        ALTER TABLE propostas ADD COLUMN cpf_url TEXT;
        RAISE NOTICE 'Coluna cpf_url adicionada ✅';
    ELSE
        RAISE NOTICE 'Coluna cpf_url já existe ✅';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas' AND column_name = 'comprovante_residencia_url') THEN
        ALTER TABLE propostas ADD COLUMN comprovante_residencia_url TEXT;
        RAISE NOTICE 'Coluna comprovante_residencia_url adicionada ✅';
    ELSE
        RAISE NOTICE 'Coluna comprovante_residencia_url já existe ✅';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas' AND column_name = 'cns_url') THEN
        ALTER TABLE propostas ADD COLUMN cns_url TEXT;
        RAISE NOTICE 'Coluna cns_url adicionada ✅';
    ELSE
        RAISE NOTICE 'Coluna cns_url já existe ✅';
    END IF;
END $$;

-- Campos de controle de documentos
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas' AND column_name = 'documentos_enviados') THEN
        ALTER TABLE propostas ADD COLUMN documentos_enviados BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Coluna documentos_enviados adicionada ✅';
    ELSE
        RAISE NOTICE 'Coluna documentos_enviados já existe ✅';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas' AND column_name = 'data_upload_documentos') THEN
        ALTER TABLE propostas ADD COLUMN data_upload_documentos TIMESTAMP;
        RAISE NOTICE 'Coluna data_upload_documentos adicionada ✅';
    ELSE
        RAISE NOTICE 'Coluna data_upload_documentos já existe ✅';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas' AND column_name = 'bucket_usado') THEN
        ALTER TABLE propostas ADD COLUMN bucket_usado VARCHAR(100);
        RAISE NOTICE 'Coluna bucket_usado adicionada ✅';
    ELSE
        RAISE NOTICE 'Coluna bucket_usado já existe ✅';
    END IF;
END $$;

-- Campos de controle de email
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas' AND column_name = 'email_validacao_enviado') THEN
        ALTER TABLE propostas ADD COLUMN email_validacao_enviado BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Coluna email_validacao_enviado adicionada ✅';
    ELSE
        RAISE NOTICE 'Coluna email_validacao_enviado já existe ✅';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas' AND column_name = 'email_enviado_em') THEN
        ALTER TABLE propostas ADD COLUMN email_enviado_em TIMESTAMP;
        RAISE NOTICE 'Coluna email_enviado_em adicionada ✅';
    ELSE
        RAISE NOTICE 'Coluna email_enviado_em já existe ✅';
    END IF;
END $$;

-- Campo para telefone alternativo
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas' AND column_name = 'telefone_cliente') THEN
        ALTER TABLE propostas ADD COLUMN telefone_cliente VARCHAR(20);
        RAISE NOTICE 'Coluna telefone_cliente adicionada ✅';
    ELSE
        RAISE NOTICE 'Coluna telefone_cliente já existe ✅';
    END IF;
END $$;

-- Campo para motivo de rejeição
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas' AND column_name = 'motivo_rejeicao') THEN
        ALTER TABLE propostas ADD COLUMN motivo_rejeicao TEXT;
        RAISE NOTICE 'Coluna motivo_rejeicao adicionada ✅';
    ELSE
        RAISE NOTICE 'Coluna motivo_rejeicao já existe ✅';
    END IF;
END $$;

-- Criar índices para melhor performance (apenas se não existirem)
CREATE INDEX IF NOT EXISTS idx_propostas_corretor_id ON propostas(corretor_id);
CREATE INDEX IF NOT EXISTS idx_propostas_status ON propostas(status);
CREATE INDEX IF NOT EXISTS idx_propostas_email_cliente ON propostas(email_cliente);
CREATE INDEX IF NOT EXISTS idx_propostas_cpf_cliente ON propostas(cpf_cliente);

-- Verificar estrutura final
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'propostas' 
ORDER BY ordinal_position;

RAISE NOTICE '🎉 COLUNAS FALTANTES ADICIONADAS COM SUCESSO!';
RAISE NOTICE 'A tabela propostas agora pode receber propostas de clientes diretos e de corretores.';
