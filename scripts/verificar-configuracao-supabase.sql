-- Script para verificar se as tabelas necessárias existem
SELECT 
  'propostas' as tabela,
  COUNT(*) as total_registros
FROM propostas
UNION ALL
SELECT 
  'dependentes' as tabela,
  COUNT(*) as total_registros  
FROM dependentes
UNION ALL
SELECT 
  'questionario_saude' as tabela,
  COUNT(*) as total_registros
FROM questionario_saude;

-- Verificar se há propostas com dependentes
SELECT 
  p.id,
  p.nome_cliente,
  p.tem_dependentes,
  COUNT(d.id) as dependentes_salvos
FROM propostas p
LEFT JOIN dependentes d ON p.id = d.proposta_id
WHERE p.tem_dependentes = true
GROUP BY p.id, p.nome_cliente, p.tem_dependentes
ORDER BY p.created_at DESC
LIMIT 10;
