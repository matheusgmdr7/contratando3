-- Criar tabela para questionário de saúde das propostas de corretores
CREATE TABLE IF NOT EXISTS questionario_saude_corretores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    proposta_corretor_id UUID NOT NULL REFERENCES propostas_corretores(id) ON DELETE CASCADE,
    pergunta_id INTEGER NOT NULL,
    pergunta TEXT NOT NULL,
    resposta VARCHAR(10) NOT NULL CHECK (resposta IN ('Sim', 'Não')),
    observacao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_questionario_saude_corretores_proposta_id 
ON questionario_saude_corretores(proposta_corretor_id);

CREATE INDEX IF NOT EXISTS idx_questionario_saude_corretores_pergunta_id 
ON questionario_saude_corretores(pergunta_id);

-- Adicionar comentários
COMMENT ON TABLE questionario_saude_corretores IS 'Armazena as respostas do questionário de saúde das propostas de corretores';
COMMENT ON COLUMN questionario_saude_corretores.proposta_corretor_id IS 'ID da proposta do corretor';
COMMENT ON COLUMN questionario_saude_corretores.pergunta_id IS 'ID da pergunta do questionário';
COMMENT ON COLUMN questionario_saude_corretores.pergunta IS 'Texto da pergunta';
COMMENT ON COLUMN questionario_saude_corretores.resposta IS 'Resposta do cliente (Sim/Não)';
COMMENT ON COLUMN questionario_saude_corretores.observacao IS 'Observações adicionais quando a resposta for Sim';

-- Verificar se a tabela foi criada
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'questionario_saude_corretores'
ORDER BY ordinal_position;
