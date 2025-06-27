-- Verificar se a tabela já existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'produto_tabela_relacao') THEN
        -- Criar tabela de relação entre produtos e tabelas de preços
        CREATE TABLE produto_tabela_relacao (
            id BIGSERIAL PRIMARY KEY,
            produto_id BIGINT REFERENCES produtos_corretores(id) ON DELETE CASCADE,
            tabela_id UUID REFERENCES tabelas_precos(id) ON DELETE CASCADE,
            segmentacao VARCHAR(255) NOT NULL,
            is_default BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Adicionar índices para melhorar performance
        CREATE INDEX idx_produto_tabela_relacao_produto_id ON produto_tabela_relacao(produto_id);
        CREATE INDEX idx_produto_tabela_relacao_tabela_id ON produto_tabela_relacao(tabela_id);
        
        -- Adicionar restrição única para evitar duplicatas de segmentação por produto
        CREATE UNIQUE INDEX idx_produto_tabela_relacao_unique_segmentacao 
        ON produto_tabela_relacao(produto_id, segmentacao);
        
        -- Migrar dados existentes
        INSERT INTO produto_tabela_relacao (produto_id, tabela_id, segmentacao, is_default)
        SELECT id, tabela_id, 'Padrão', true
        FROM produtos_corretores
        WHERE tabela_id IS NOT NULL;
        
        -- Criar trigger para atualizar o timestamp de updated_at
        CREATE OR REPLACE FUNCTION update_produto_tabela_relacao_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        CREATE TRIGGER trigger_update_produto_tabela_relacao_updated_at
        BEFORE UPDATE ON produto_tabela_relacao
        FOR EACH ROW
        EXECUTE FUNCTION update_produto_tabela_relacao_updated_at();
        
        RAISE NOTICE 'Tabela produto_tabela_relacao criada com sucesso!';
    ELSE
        RAISE NOTICE 'Tabela produto_tabela_relacao já existe.';
    END IF;
END $$;
