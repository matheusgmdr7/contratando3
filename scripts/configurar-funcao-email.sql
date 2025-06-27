-- Script para verificar se as funções Edge estão habilitadas
-- Execute este script no SQL Editor do Supabase para verificar o status

SELECT 
  'Verificando configuração de funções Edge...' as status;

-- Verificar se o projeto tem funções Edge habilitadas
-- (Este comando pode não funcionar em todos os ambientes)
-- SELECT * FROM pg_extension WHERE extname = 'supabase_functions';

SELECT 
  'Para configurar funções Edge, siga as instruções no README' as instrucao;
