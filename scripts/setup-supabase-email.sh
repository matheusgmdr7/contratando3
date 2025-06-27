#!/bin/bash

echo "🚀 Configurando Supabase para envio de emails..."
echo ""

# Passo 1: Instalar Supabase CLI
echo "📦 Passo 1: Instalando Supabase CLI..."
npm install -g supabase

echo "✅ Supabase CLI instalado!"
echo ""

# Passo 2: Login no Supabase
echo "🔐 Passo 2: Fazendo login no Supabase..."
echo "Execute o comando abaixo e siga as instruções:"
echo "supabase login"
echo ""

# Passo 3: Inicializar projeto
echo "🏗️ Passo 3: Inicializando projeto..."
echo "Execute os comandos abaixo na raiz do seu projeto:"
echo ""
echo "supabase init"
echo "supabase link --project-ref SEU_PROJECT_REF"
echo ""
echo "⚠️  Substitua SEU_PROJECT_REF pelo ID do seu projeto Supabase"
echo "   (encontre em: Supabase Dashboard → Settings → General → Reference ID)"
echo ""

echo "🎉 Setup inicial concluído!"
echo ""
echo "📋 Próximos passos:"
echo "1. Execute: supabase login"
echo "2. Execute: supabase init"
echo "3. Execute: supabase link --project-ref SEU_PROJECT_REF"
echo "4. Execute: supabase functions new enviar-email"
