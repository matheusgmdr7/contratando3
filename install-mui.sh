#!/bin/bash

# Cores para o terminal
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Instalando Material UI e suas dependências...${NC}"

# Verificar se npm está instalado
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Erro: npm não está instalado. Por favor, instale o Node.js e npm primeiro.${NC}"
    exit 1
fi

# Instalar as dependências
echo -e "${YELLOW}Executando: npm install @mui/material @emotion/react @emotion/styled --save${NC}"
npm install @mui/material @emotion/react @emotion/styled --save

# Verificar se a instalação foi bem-sucedida
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Material UI e suas dependências foram instalados com sucesso!${NC}"
    
    # Verificar se o package.json foi atualizado
    if grep -q "@mui/material" package.json; then
        echo -e "${GREEN}Dependências adicionadas ao package.json.${NC}"
    else
        echo -e "${YELLOW}Aviso: As dependências podem não ter sido adicionadas ao package.json.${NC}"
        echo -e "${YELLOW}Verifique o arquivo package.json manualmente.${NC}"
    fi
else
    echo -e "${RED}Erro ao instalar as dependências.${NC}"
    echo -e "${YELLOW}Tente executar manualmente: npm install @mui/material @emotion/react @emotion/styled --save${NC}"
    exit 1
fi

echo -e "${BLUE}Processo de instalação concluído.${NC}"
