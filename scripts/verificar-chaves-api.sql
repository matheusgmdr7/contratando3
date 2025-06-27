-- Este script verifica se as chaves de API do Supabase estão configuradas corretamente

-- Verificar se a tabela propostas existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'propostas'
) AS tabela_propostas_existe;

-- Verificar se a tabela dependentes existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'dependentes'
) AS tabela_dependentes_existe;

-- Verificar se a tabela questionario_saude existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'questionario_saude'
) AS tabela_questionario_existe;

-- Verificar a estrutura da tabela dependentes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'dependentes'
ORDER BY ordinal_position;

-- Verificar se há dados na tabela propostas
SELECT COUNT(*) AS total_propostas FROM propostas;

-- Verificar se há dados na tabela dependentes
SELECT COUNT(*) AS total_dependentes FROM dependentes;

-- Verificar se há dados na tabela questionario_saude
SELECT COUNT(*) AS total_questionarios FROM questionario_saude;

-- Verificar se há propostas com dependentes
SELECT COUNT(*) AS propostas_com_dependentes 
FROM propostas 
WHERE tem_dependentes = true;

-- Verificar se há dependentes associados a propostas
SELECT proposta_id, COUNT(*) AS num_dependentes
FROM dependentes
GROUP BY proposta_id
ORDER BY num_dependentes DESC
LIMIT 5;
