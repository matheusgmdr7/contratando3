-- Script para verificar onde os dados das propostas estão sendo salvos
-- e analisar a estrutura completa

-- 1. Verificar estrutura da tabela propostas_corretores
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'propostas_corretores'
ORDER BY ordinal_position;

-- 2. Verificar últimas propostas criadas
SELECT 
    id,
    cliente,
    email_cliente,
    status,
    created_at,
    link_validacao,
    email_validacao_enviado
FROM propostas_corretores 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. Verificar se existe tabela para dados completos da proposta digital
SELECT table_name 
FROM information_schema.tables 
WHERE table_name LIKE '%proposta%' 
   OR table_name LIKE '%digital%';

-- 4. Verificar dependentes das propostas
SELECT 
    pc.id as proposta_id,
    pc.cliente,
    dpc.nome as dependente_nome,
    dpc.parentesco
FROM propostas_corretores pc
LEFT JOIN dependentes_propostas_corretores dpc ON pc.id = dpc.proposta_corretor_id
ORDER BY pc.created_at DESC
LIMIT 10;

-- 5. Verificar se existe tabela para dados de saúde/assinatura
SELECT table_name 
FROM information_schema.tables 
WHERE table_name LIKE '%saude%' 
   OR table_name LIKE '%assinatura%'
   OR table_name LIKE '%questionario%';
