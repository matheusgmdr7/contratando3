#!/bin/bash

echo "🔧 Corrigindo problemas de build do Netlify..."

# Limpar cache e dependências
echo "🧹 Limpando cache e dependências..."
rm -rf node_modules
rm -f package-lock.json
rm -rf .next

# Limpar cache do npm
echo "🗑️ Limpando cache do npm..."
npm cache clean --force

# Instalar dependências com flags de compatibilidade
echo "📦 Instalando dependências..."
npm install --legacy-peer-deps --no-optional

# Verificar se a instalação foi bem-sucedida
if [ $? -eq 0 ]; then
    echo "✅ Dependências instaladas com sucesso!"
    
    # Tentar fazer o build
    echo "🏗️ Fazendo build..."
    npm run build
    
    if [ $? -eq 0 ]; then
        echo "🎉 Build concluído com sucesso!"
    else
        echo "❌ Erro no build"
        exit 1
    fi
else
    echo "❌ Erro na instalação das dependências"
    exit 1
fi
