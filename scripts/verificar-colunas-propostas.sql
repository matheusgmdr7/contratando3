-- Script para verificar e corrigir estrutura da tabela propostas
-- Executa verificações e correções necessárias para otimizar performance

-- 1. Verificar estrutura atual da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'propostas' 
ORDER BY ordinal_position;

-- 2. Adicionar colunas necessárias se não existirem
ALTER TABLE propostas ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE propostas ADD COLUMN IF NOT EXISTS email_validacao_enviado BOOLEAN DEFAULT FALSE;
ALTER TABLE propostas ADD COLUMN IF NOT EXISTS email_enviado_em TIMESTAMPTZ;

-- 3. Criar índices para melhorar performance das consultas
CREATE INDEX IF NOT EXISTS idx_propostas_id ON propostas(id);
CREATE INDEX IF NOT EXISTS idx_propostas_status ON propostas(status);
CREATE INDEX IF NOT EXISTS idx_propostas_corretor_id ON propostas(corretor_id);
CREATE INDEX IF NOT EXISTS idx_propostas_created_at ON propostas(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_propostas_email_enviado ON propostas(email_validacao_enviado);

-- 4. Criar índices para tabela dependentes
CREATE INDEX IF NOT EXISTS idx_dependentes_proposta_id ON dependentes(proposta_id);
CREATE INDEX IF NOT EXISTS idx_dependentes_created_at ON dependentes(created_at);

-- 5. Criar índices para tabela questionario_saude
CREATE INDEX IF NOT EXISTS idx_questionario_proposta_id ON questionario_saude(proposta_id);
CREATE INDEX IF NOT EXISTS idx_questionario_pergunta_id ON questionario_saude(pergunta_id);

-- 6. Atualizar trigger para updated_at se não existir
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger na tabela propostas
DROP TRIGGER IF EXISTS update_propostas_updated_at ON propostas;
CREATE TRIGGER update_propostas_updated_at
    BEFORE UPDATE ON propostas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Corrigir propostas existentes que deveriam ter email marcado como enviado
-- (Propostas com status diferente de 'rascunho' ou 'parcial' provavelmente tiveram email enviado)
UPDATE propostas 
SET 
    email_validacao_enviado = true, 
    email_enviado_em = COALESCE(updated_at, created_at)
WHERE 
    status IN ('pendente', 'aprovada', 'rejeitada', 'finalizada', 'assinada')
    AND (email_validacao_enviado IS NULL OR email_validacao_enviado = false);

-- 8. Estatísticas após correções
SELECT 
    'Propostas por Status' as categoria,
    status,
    COUNT(*) as quantidade,
    COUNT(CASE WHEN email_validacao_enviado = true THEN 1 END) as com_email_enviado,
    COUNT(CASE WHEN email_validacao_enviado = false OR email_validacao_enviado IS NULL THEN 1 END) as sem_email_enviado
FROM propostas 
GROUP BY status
ORDER BY quantidade DESC;

-- 9. Verificar performance das consultas principais
EXPLAIN ANALYZE SELECT * FROM propostas WHERE id = '7897efbf-1a2a-4f55-8cf0-8e40a4de85df';
EXPLAIN ANALYZE SELECT * FROM dependentes WHERE proposta_id = '7897efbf-1a2a-4f55-8cf0-8e40a4de85df';

-- 10. Mostrar índices criados
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('propostas', 'dependentes', 'questionario_saude')
ORDER BY tablename, indexname;

-- 11. Verificar tamanho das tabelas
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE tablename IN ('propostas', 'dependentes', 'questionario_saude', 'propostas_corretores')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 12. Análise de performance - propostas que demoram para carregar
SELECT 
    id,
    nome_cliente,
    status,
    created_at,
    updated_at,
    email_validacao_enviado,
    CASE 
        WHEN tem_dependentes = true THEN 'Com dependentes'
        ELSE 'Sem dependentes'
    END as tipo_proposta
FROM propostas 
WHERE created_at >= NOW() - INTERVAL '30 days'
ORDER BY created_at DESC
LIMIT 20;

-- 13. Verificar se existem propostas órfãs ou com problemas
SELECT 
    'Propostas sem corretor válido' as problema,
    COUNT(*) as quantidade
FROM propostas p
LEFT JOIN corretores c ON p.corretor_id = c.id
WHERE p.corretor_id IS NOT NULL AND c.id IS NULL

UNION ALL

SELECT 
    'Dependentes sem proposta válida' as problema,
    COUNT(*) as quantidade
FROM dependentes d
LEFT JOIN propostas p ON d.proposta_id = p.id
WHERE p.id IS NULL

UNION ALL

SELECT 
    'Questionários sem proposta válida' as problema,
    COUNT(*) as quantidade
FROM questionario_saude q
LEFT JOIN propostas p ON q.proposta_id = p.id
WHERE p.id IS NULL;

-- 14. Comando para limpar cache de consultas (se necessário)
-- RESET query_plan_cache;

-- 15. Verificação final - mostrar proposta específica que estava lenta
SELECT 
    p.*,
    c.nome as corretor_nome_real,
    c.email as corretor_email_real,
    (SELECT COUNT(*) FROM dependentes WHERE proposta_id = p.id) as total_dependentes,
    (SELECT COUNT(*) FROM questionario_saude WHERE proposta_id = p.id) as total_respostas_questionario
FROM propostas p
LEFT JOIN corretores c ON p.corretor_id = c.id
WHERE p.id = '7897efbf-1a2a-4f55-8cf0-8e40a4de85df';
