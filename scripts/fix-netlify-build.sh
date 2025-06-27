#!/bin/bash

# Script para corrigir problemas de build no Netlify
echo "🔧 Corrigindo problemas de build..."

# Remove cache e dependências
echo "🗑️ Removendo cache e dependências antigas..."
rm -rf node_modules
rm -rf package-lock.json
rm -rf .next
rm -rf .npm

# Limpa cache do npm
echo "🧹 Limpando cache do npm..."
npm cache clean --force

# Instala dependências com flags de compatibilidade
echo "📦 Instalando dependências..."
npm install --legacy-peer-deps --no-optional

# Build do projeto
echo "🏗️ Fazendo build do projeto..."
npm run build

echo "✅ Build concluído!"
