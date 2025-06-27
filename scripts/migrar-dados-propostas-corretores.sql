-- Script para migrar dados da tabela propostas_corretores para a tabela propostas
-- Executar APÓS unificar as estruturas das tabelas

-- Verificar se existem dados para migrar
DO $$
DECLARE
    total_propostas_corretores INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_propostas_corretores FROM propostas_corretores;
    
    IF total_propostas_corretores = 0 THEN
        RAISE NOTICE 'Nenhuma proposta encontrada na tabela propostas_corretores para migrar.';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Encontradas % propostas na tabela propostas_corretores para migrar.', total_propostas_corretores;
END $$;

-- VERIFICAR DADOS EXISTENTES
SELECT 
    'ANTES_MIGRACAO' as status,
    'propostas' as tabela,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN corretor_id IS NOT NULL THEN 1 END) as com_corretor_id
FROM propostas

UNION ALL

SELECT 
    'ANTES_MIGRACAO' as status,
    'propostas_corretores' as tabela,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN corretor_id IS NOT NULL THEN 1 END) as com_corretor_id
FROM propostas_corretores;

-- MIGRAR DADOS DA TABELA propostas_corretores PARA propostas
-- Apenas dados que ainda não existem na tabela propostas
INSERT INTO propostas (
    -- Campos originais da tabela propostas (mapeamento)
    nome,
    email,
    telefone,
    data_nascimento,
    cpf,
    rg,
    endereco,
    numero,
    complemento,
    bairro,
    cidade,
    estado,
    cep,
    cns,
    nome_mae,
    sexo,
    orgao_emissor,
    sigla_plano,
    valor_mensal,
    valor_total,
    status,
    observacoes,
    created_at,
    updated_at,
    
    -- Campos específicos de corretores (novos)
    corretor_id,
    cliente,
    email_cliente,
    whatsapp_cliente,
    telefone_cliente,
    produto,
    produto_nome,
    produto_descricao,
    produto_operadora,
    produto_tipo,
    plano_nome,
    valor_proposta,
    comissao,
    data,
    endereco_cliente,
    cidade_cliente,
    estado_cliente,
    cep_cliente,
    cpf_cliente,
    data_nascimento_cliente,
    rg_cliente,
    orgao_emissor_cliente,
    cns_cliente,
    nome_mae_cliente,
    sexo_cliente,
    cobertura,
    acomodacao,
    codigo_plano,
    tem_dependentes,
    quantidade_dependentes,
    rg_frente_url,
    rg_verso_url,
    cpf_url,
    comprovante_residencia_url,
    cns_url,
    documentos_enviados,
    data_upload_documentos,
    bucket_usado,
    email_validacao_enviado,
    email_enviado_em,
    motivo_rejeicao
)
SELECT 
    -- Mapeamento dos campos originais
    COALESCE(pc.nome_cliente, pc.cliente) as nome,
    COALESCE(pc.email_cliente, pc.email) as email,
    COALESCE(pc.telefone_cliente, pc.whatsapp_cliente) as telefone,
    pc.data_nascimento_cliente as data_nascimento,
    pc.cpf_cliente as cpf,
    pc.rg_cliente as rg,
    pc.endereco_cliente as endereco,
    NULL as numero, -- Extrair do endereco_cliente se necessário
    NULL as complemento,
    NULL as bairro, -- Extrair do endereco_cliente se necessário
    pc.cidade_cliente as cidade,
    pc.estado_cliente as estado,
    pc.cep_cliente as cep,
    pc.cns_cliente as cns,
    pc.nome_mae_cliente as nome_mae,
    pc.sexo_cliente as sexo,
    pc.orgao_emissor_cliente as orgao_emissor,
    pc.codigo_plano as sigla_plano,
    pc.valor_proposta as valor_mensal,
    pc.valor_proposta as valor_total,
    pc.status,
    pc.observacoes,
    pc.created_at,
    pc.updated_at,
    
    -- Campos específicos de corretores
    pc.corretor_id,
    pc.cliente,
    pc.email_cliente,
    pc.whatsapp_cliente,
    pc.telefone_cliente,
    pc.produto,
    pc.produto_nome,
    pc.produto_descricao,
    pc.produto_operadora,
    pc.produto_tipo,
    pc.plano_nome,
    pc.valor_proposta,
    pc.comissao,
    pc.data,
    pc.endereco_cliente,
    pc.cidade_cliente,
    pc.estado_cliente,
    pc.cep_cliente,
    pc.cpf_cliente,
    pc.data_nascimento_cliente,
    pc.rg_cliente,
    pc.orgao_emissor_cliente,
    pc.cns_cliente,
    pc.nome_mae_cliente,
    pc.sexo_cliente,
    pc.cobertura,
    pc.acomodacao,
    pc.codigo_plano,
    pc.tem_dependentes,
    pc.quantidade_dependentes,
    pc.rg_frente_url,
    pc.rg_verso_url,
    pc.cpf_url,
    pc.comprovante_residencia_url,
    pc.cns_url,
    pc.documentos_enviados,
    pc.data_upload_documentos,
    pc.bucket_usado,
    pc.email_validacao_enviado,
    pc.email_enviado_em,
    pc.motivo_rejeicao
FROM propostas_corretores pc
WHERE pc.id NOT IN (
    -- Evitar duplicatas verificando se já existe uma proposta com o mesmo ID de corretor e email
    SELECT DISTINCT p.id 
    FROM propostas p 
    WHERE p.corretor_id = pc.corretor_id 
    AND p.email_cliente = pc.email_cliente
);

-- MIGRAR DEPENDENTES SE NECESSÁRIO
-- Verificar se existem dependentes na tabela dependentes_propostas_corretores
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dependentes_propostas_corretores') THEN
        -- Migrar dependentes da tabela específica de corretores para a tabela geral
        INSERT INTO dependentes (
            proposta_id,
            nome,
            cpf,
            rg,
            data_nascimento,
            cns,
            parentesco,
            nome_mae,
            peso,
            altura,
            valor_individual,
            uf_nascimento,
            sexo,
            orgao_emissor,
            created_at
        )
        SELECT 
            p.id as proposta_id, -- ID da proposta na tabela propostas
            dpc.nome,
            dpc.cpf,
            dpc.rg,
            dpc.data_nascimento,
            dpc.cns,
            dpc.parentesco,
            dpc.nome_mae,
            dpc.peso,
            dpc.altura,
            dpc.valor_individual,
            dpc.uf_nascimento,
            dpc.sexo,
            dpc.orgao_emissor,
            dpc.created_at
        FROM dependentes_propostas_corretores dpc
        INNER JOIN propostas_corretores pc ON dpc.proposta_corretor_id = pc.id
        INNER JOIN propostas p ON p.corretor_id = pc.corretor_id AND p.email_cliente = pc.email_cliente
        WHERE NOT EXISTS (
            -- Evitar duplicatas
            SELECT 1 FROM dependentes d 
            WHERE d.proposta_id = p.id 
            AND d.cpf = dpc.cpf
        );
        
        RAISE NOTICE '✅ Dependentes migrados da tabela dependentes_propostas_corretores';
    ELSE
        RAISE NOTICE 'ℹ️ Tabela dependentes_propostas_corretores não existe';
    END IF;
END $$;

-- MIGRAR QUESTIONÁRIOS DE SAÚDE SE NECESSÁRIO
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'questionario_saude_corretores') THEN
        -- Migrar questionários da tabela específica de corretores para a tabela geral
        INSERT INTO questionario_saude (
            id,
            proposta_id,
            dependente_id,
            pergunta_id,
            pergunta_texto,
            resposta,
            observacoes,
            created_at,
            updated_at
        )
        SELECT 
            qsc.id,
            qsc.proposta_id,
            qsc.dependente_id,
            qsc.pergunta_id,
            qsc.pergunta_texto,
            qsc.resposta,
            qsc.observacoes,
            COALESCE(qsc.created_at, NOW()),
            COALESCE(qsc.updated_at, NOW())
        FROM questionario_saude_corretores qsc
        WHERE qsc.id NOT IN (
            SELECT qs.id 
            FROM questionario_saude qs 
            WHERE qs.id = qsc.id
        )
        ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE '✅ Questionários de saúde migrados da tabela questionario_saude_corretores';
    ELSE
        RAISE NOTICE 'ℹ️ Tabela questionario_saude_corretores não existe';
    END IF;
END $$;

-- VERIFICAR DADOS APÓS MIGRAÇÃO
SELECT 
    'APOS_MIGRACAO' as status,
    'propostas' as tabela,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN corretor_id IS NOT NULL THEN 1 END) as com_corretor_id,
    COUNT(CASE WHEN corretor_id IS NULL THEN 1 END) as sem_corretor_id
FROM propostas

UNION ALL

SELECT 
    'APOS_MIGRACAO' as status,
    'propostas_corretores' as tabela,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN corretor_id IS NOT NULL THEN 1 END) as com_corretor_id,
    COUNT(CASE WHEN corretor_id IS NULL THEN 1 END) as sem_corretor_id
FROM propostas_corretores;

-- VERIFICAR DISTRIBUIÇÃO POR STATUS
SELECT 
    'DISTRIBUICAO_STATUS' as tipo,
    status,
    COUNT(*) as quantidade,
    COUNT(CASE WHEN corretor_id IS NOT NULL THEN 1 END) as via_corretor,
    COUNT(CASE WHEN corretor_id IS NULL THEN 1 END) as direto
FROM propostas
GROUP BY status
ORDER BY quantidade DESC;

-- VERIFICAR DEPENDENTES
SELECT 
    'DEPENDENTES_MIGRADOS' as tipo,
    COUNT(*) as total_dependentes,
    COUNT(DISTINCT proposta_id) as propostas_com_dependentes
FROM dependentes;

-- VERIFICAR QUESTIONÁRIOS
SELECT 
    'QUESTIONARIOS_MIGRADOS' as tipo,
    COUNT(*) as total_respostas,
    COUNT(DISTINCT proposta_id) as propostas_com_questionario
FROM questionario_saude;

-- Verificar resultado da migração
DO $$
DECLARE
    total_migradas INTEGER;
    total_propostas_final INTEGER;
    total_com_corretor INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_migradas 
    FROM propostas 
    WHERE corretor_id IS NOT NULL;
    
    SELECT COUNT(*) INTO total_propostas_final 
    FROM propostas;
    
    SELECT COUNT(*) INTO total_com_corretor 
    FROM propostas 
    WHERE corretor_id IS NOT NULL;
    
    RAISE NOTICE '✅ MIGRAÇÃO CONCLUÍDA!';
    RAISE NOTICE 'Total de propostas na tabela propostas: %', total_propostas_final;
    RAISE NOTICE 'Propostas de corretores migradas: %', total_com_corretor;
    RAISE NOTICE 'Propostas diretas (sem corretor): %', total_propostas_final - total_com_corretor;
END $$;

RAISE NOTICE '🎉 MIGRAÇÃO COMPLETA FINALIZADA!';
RAISE NOTICE 'Dados migrados com sucesso da tabela propostas_corretores para propostas.';
RAISE NOTICE 'Agora todas as propostas estão unificadas na tabela propostas.';
