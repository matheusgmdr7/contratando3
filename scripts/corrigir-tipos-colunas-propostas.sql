-- Script para corrigir tipos de colunas na tabela propostas
-- Execute este script no Supabase SQL Editor

-- 1. PRIMEIRO: Verificar tipos atuais das colunas problemáticas
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'propostas' 
AND column_name IN (
    'nome_cliente', 'email', 'cpf', 'telefone', 'endereco', 
    'cidade', 'estado', 'cep', 'rg', 'orgao_emissor', 
    'cns', 'nome_mae', 'sexo', 'data_nascimento',
    'cobertura', 'acomodacao', 'codigo_plano', 'observacoes'
)
ORDER BY column_name;

-- 2. ALTERAR TIPOS PARA VARCHAR (se necessário)
-- Campos de texto que devem ser VARCHAR

-- Nome do cliente
ALTER TABLE propostas 
ALTER COLUMN nome_cliente TYPE VARCHAR(255);

-- Email
ALTER TABLE propostas 
ALTER COLUMN email TYPE VARCHAR(255);

-- CPF (sem formatação)
ALTER TABLE propostas 
ALTER COLUMN cpf TYPE VARCHAR(11);

-- Telefone
ALTER TABLE propostas 
ALTER COLUMN telefone TYPE VARCHAR(20);

-- Endereço
ALTER TABLE propostas 
ALTER COLUMN endereco TYPE VARCHAR(500);

-- Cidade
ALTER TABLE propostas 
ALTER COLUMN cidade TYPE VARCHAR(100);

-- Estado
ALTER TABLE propostas 
ALTER COLUMN estado TYPE VARCHAR(2);

-- CEP
ALTER TABLE propostas 
ALTER COLUMN cep TYPE VARCHAR(9);

-- RG
ALTER TABLE propostas 
ALTER COLUMN rg TYPE VARCHAR(20);

-- Órgão Emissor
ALTER TABLE propostas 
ALTER COLUMN orgao_emissor TYPE VARCHAR(10);

-- CNS
ALTER TABLE propostas 
ALTER COLUMN cns TYPE VARCHAR(15);

-- Nome da Mãe
ALTER TABLE propostas 
ALTER COLUMN nome_mae TYPE VARCHAR(255);

-- Sexo
ALTER TABLE propostas 
ALTER COLUMN sexo TYPE VARCHAR(10);

-- Data de Nascimento (manter como DATE)
ALTER TABLE propostas 
ALTER COLUMN data_nascimento TYPE DATE;

-- Cobertura
ALTER TABLE propostas 
ALTER COLUMN cobertura TYPE VARCHAR(20);

-- Acomodação
ALTER TABLE propostas 
ALTER COLUMN acomodacao TYPE VARCHAR(20);

-- Código do Plano
ALTER TABLE propostas 
ALTER COLUMN codigo_plano TYPE VARCHAR(50);

-- Observações
ALTER TABLE propostas 
ALTER COLUMN observacoes TYPE TEXT;

-- 3. ADICIONAR COLUNAS QUE PODEM ESTAR FALTANDO
-- Verificar se existem e adicionar se necessário

-- Bairro
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'propostas' AND column_name = 'bairro'
    ) THEN
        ALTER TABLE propostas ADD COLUMN bairro VARCHAR(100);
    END IF;
END $$;

-- Número
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'propostas' AND column_name = 'numero'
    ) THEN
        ALTER TABLE propostas ADD COLUMN numero VARCHAR(10);
    END IF;
END $$;

-- Complemento
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'propostas' AND column_name = 'complemento'
    ) THEN
        ALTER TABLE propostas ADD COLUMN complemento VARCHAR(100);
    END IF;
END $$;

-- Template ID
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'propostas' AND column_name = 'template_id'
    ) THEN
        ALTER TABLE propostas ADD COLUMN template_id UUID;
    END IF;
END $$;

-- Tabela ID
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'propostas' AND column_name = 'tabela_id'
    ) THEN
        ALTER TABLE propostas ADD COLUMN tabela_id VARCHAR(50);
    END IF;
END $$;

-- Produto ID
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'propostas' AND column_name = 'produto_id'
    ) THEN
        ALTER TABLE propostas ADD COLUMN produto_id VARCHAR(50);
    END IF;
END $$;

-- Tem dependentes
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'propostas' AND column_name = 'tem_dependentes'
    ) THEN
        ALTER TABLE propostas ADD COLUMN tem_dependentes BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Quantidade dependentes
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'propostas' AND column_name = 'quantidade_dependentes'
    ) THEN
        ALTER TABLE propostas ADD COLUMN quantidade_dependentes INTEGER DEFAULT 0;
    END IF;
END $$;

-- 4. VERIFICAR RESULTADO FINAL
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'propostas' 
ORDER BY ordinal_position;

-- 5. TESTAR INSERÇÃO DE DADOS
-- Teste com dados de exemplo para verificar se os tipos estão corretos
INSERT INTO propostas (
    nome_cliente,
    email,
    cpf,
    telefone,
    endereco,
    numero,
    complemento,
    bairro,
    cidade,
    estado,
    cep,
    rg,
    orgao_emissor,
    cns,
    nome_mae,
    sexo,
    data_nascimento,
    cobertura,
    acomodacao,
    codigo_plano,
    observacoes,
    tem_dependentes,
    quantidade_dependentes,
    status,
    created_at
) VALUES (
    'João da Silva Teste',
    'joao.teste@email.com',
    '12345678901',
    '(11) 99999-9999',
    'Rua das Flores, 123',
    '123',
    'Apto 45',
    'Centro',
    'São Paulo',
    'SP',
    '01234-567',
    '123456789',
    'SSP/SP',
    '123456789012345',
    'Maria da Silva',
    'Masculino',
    '1990-01-01',
    'Nacional',
    'Apartamento',
    'PLANO-001',
    'Teste de inserção após correção de tipos',
    true,
    2,
    'teste',
    NOW()
);

-- Verificar se a inserção funcionou
SELECT * FROM propostas WHERE status = 'teste' ORDER BY created_at DESC LIMIT 1;

-- Limpar dados de teste
DELETE FROM propostas WHERE status = 'teste';
