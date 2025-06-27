#!/bin/bash

echo "🚀 Configurando Edge Function para Email no Supabase..."

# Verificar se Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI não encontrado. Instalando..."
    npm install -g supabase
fi

# Verificar se está logado
echo "🔐 Verificando login no Supabase..."
supabase projects list

# Verificar se projeto está linkado
echo "🔗 Verificando link do projeto..."
supabase status

# Criar função se não existir
if [ ! -d "supabase/functions/enviar-email" ]; then
    echo "📁 Criando função enviar-email..."
    supabase functions new enviar-email
fi

# Deploy da função
echo "🚀 Fazendo deploy da função..."
supabase functions deploy enviar-email

# Verificar se foi deployada
echo "✅ Verificando deploy..."
supabase functions list

echo "🎉 Setup concluído! Agora configure as variáveis de ambiente no painel do Supabase."
