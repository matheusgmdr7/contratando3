-- Adicionar coluna tabela_id na tabela produtos_corretores
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'produtos_corretores' AND column_name = 'tabela_id'
    ) THEN
        ALTER TABLE produtos_corretores ADD COLUMN tabela_id UUID REFERENCES tabelas_precos(id);
        RAISE NOTICE 'Coluna tabela_id adicionada à tabela produtos_corretores';
    ELSE
        RAISE NOTICE 'Coluna tabela_id já existe na tabela produtos_corretores';
    END IF;
END $$;

-- Criar view para facilitar consultas de produtos com suas tabelas
CREATE OR REPLACE VIEW produtos_com_tabelas AS
SELECT 
    p.*,
    t.titulo AS tabela_titulo,
    t.descricao AS tabela_descricao
FROM 
    produtos_corretores p
LEFT JOIN 
    tabelas_precos t ON p.tabela_id = t.id;

-- Função para obter o valor de um produto com base na idade
CREATE OR REPLACE FUNCTION obter_valor_produto_por_idade(produto_id UUID, idade INTEGER)
RETURNS DECIMAL AS $$
DECLARE
    tabela_id UUID;
    valor DECIMAL := 0;
    faixa RECORD;
    min_idade INTEGER;
    max_idade INTEGER;
BEGIN
    -- Obter o ID da tabela vinculada ao produto
    SELECT p.tabela_id INTO tabela_id FROM produtos_corretores p WHERE p.id = produto_id;
    
    -- Se não houver tabela vinculada, retornar 0
    IF tabela_id IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Buscar nas faixas etárias
    FOR faixa IN 
        SELECT faixa_etaria, valor 
        FROM tabelas_precos_faixas 
        WHERE tabela_id = tabela_id
    LOOP
        -- Verificar se é uma faixa com formato "min-max"
        IF position('-' in faixa.faixa_etaria) > 0 THEN
            min_idade := CAST(split_part(faixa.faixa_etaria, '-', 1) AS INTEGER);
            max_idade := CAST(split_part(faixa.faixa_etaria, '-', 2) AS INTEGER);
            
            IF idade >= min_idade AND idade <= max_idade THEN
                valor := faixa.valor;
                EXIT;
            END IF;
        -- Verificar se é uma faixa com formato "min+" (idade mínima)
        ELSIF position('+' in faixa.faixa_etaria) > 0 THEN
            min_idade := CAST(replace(faixa.faixa_etaria, '+', '') AS INTEGER);
            
            IF idade >= min_idade THEN
                valor := faixa.valor;
                EXIT;
            END IF;
        -- Verificar se é uma idade específica
        ELSE
            IF idade = CAST(faixa.faixa_etaria AS INTEGER) THEN
                valor := faixa.valor;
                EXIT;
            END IF;
        END IF;
    END LOOP;
    
    RETURN valor;
END;
$$ LANGUAGE plpgsql;

-- Exemplo de uso:
-- SELECT obter_valor_produto_por_idade('produto_id_aqui', 35);
