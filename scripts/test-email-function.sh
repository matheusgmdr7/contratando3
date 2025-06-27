#!/bin/bash

echo "🧪 Testando Edge Function de Email..."

# Obter a URL do projeto
PROJECT_URL=$(supabase status | grep "API URL" | awk '{print $3}')
ANON_KEY=$(supabase status | grep "anon key" | awk '{print $3}')

if [ -z "$PROJECT_URL" ] || [ -z "$ANON_KEY" ]; then
    echo "❌ Não foi possível obter URL do projeto ou chave anon"
    echo "Execute 'supabase status' para verificar"
    exit 1
fi

echo "🔗 URL do projeto: $PROJECT_URL"
echo "🔑 Chave anon: ${ANON_KEY:0:20}..."

# Teste local (se estiver rodando supabase start)
echo "🧪 Testando função localmente..."
curl -X POST "${PROJECT_URL}/functions/v1/enviar-email" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "teste@exemplo.com",
    "subject": "Teste de Email",
    "nome": "João Teste",
    "corretor": "Maria Corretora",
    "link": "https://exemplo.com/proposta/123"
  }' \
  --verbose

echo ""
echo "✅ Teste concluído! Verifique os logs acima."
echo "📝 Se houver erro 404, a função ainda não foi deployada."
echo "🔧 Se houver erro 500, verifique as variáveis de ambiente."
