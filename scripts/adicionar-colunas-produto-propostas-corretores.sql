-- Script para adicionar colunas de produto na tabela propostas_corretores

-- Verificar se a tabela propostas_corretores existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'propostas_corretores') THEN
        RAISE EXCEPTION 'Tabela propostas_corretores não existe. Verifique se a tabela foi criada corretamente.';
    END IF;
END $$;

-- Adicionar colunas de produto uma por uma (com verificação se já existem)

-- Descrição do produto
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas_corretores' AND column_name = 'produto_descricao') THEN
        ALTER TABLE propostas_corretores ADD COLUMN produto_descricao TEXT;
        RAISE NOTICE 'Coluna produto_descricao adicionada';
    ELSE
        RAISE NOTICE 'Coluna produto_descricao já existe';
    END IF;
END $$;

-- Operadora do produto
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas_corretores' AND column_name = 'produto_operadora') THEN
        ALTER TABLE propostas_corretores ADD COLUMN produto_operadora VARCHAR(255);
        RAISE NOTICE 'Coluna produto_operadora adicionada';
    ELSE
        RAISE NOTICE 'Coluna produto_operadora já existe';
    END IF;
END $$;

-- Tipo do produto
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas_corretores' AND column_name = 'produto_tipo') THEN
        ALTER TABLE propostas_corretores ADD COLUMN produto_tipo VARCHAR(100);
        RAISE NOTICE 'Coluna produto_tipo adicionada';
    ELSE
        RAISE NOTICE 'Coluna produto_tipo já existe';
    END IF;
END $$;

-- ID do produto (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas_corretores' AND column_name = 'produto_id') THEN
        ALTER TABLE propostas_corretores ADD COLUMN produto_id BIGINT;
        RAISE NOTICE 'Coluna produto_id adicionada';
    ELSE
        RAISE NOTICE 'Coluna produto_id já existe';
    END IF;
END $$;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_propostas_corretores_produto_id ON propostas_corretores(produto_id);
CREATE INDEX IF NOT EXISTS idx_propostas_corretores_produto_operadora ON propostas_corretores(produto_operadora);
CREATE INDEX IF NOT EXISTS idx_propostas_corretores_produto_tipo ON propostas_corretores(produto_tipo);

-- Atualizar comentários das colunas
COMMENT ON COLUMN propostas_corretores.produto_descricao IS 'Descrição detalhada do produto selecionado';
COMMENT ON COLUMN propostas_corretores.produto_operadora IS 'Nome da operadora do produto';
COMMENT ON COLUMN propostas_corretores.produto_tipo IS 'Tipo/categoria do produto';
COMMENT ON COLUMN propostas_corretores.produto_id IS 'ID do produto na tabela produtos_corretores';

-- Verificar estrutura final das colunas de produto
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'propostas_corretores' 
  AND column_name LIKE 'produto_%'
ORDER BY column_name;

RAISE NOTICE '✅ Script executado com sucesso! Colunas de produto adicionadas à tabela propostas_corretores.';
