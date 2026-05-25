#!/bin/bash

# Script de setup inicial do projeto AgriMonitor
# Instala dependências do backend e frontend

set -e  # Para em caso de erro

echo "🚀 Configurando AgriMonitor..."
echo ""

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # Sem cor

# =============== BACKEND ===============
echo -e "${BLUE}📦 Configurando Backend (Python + FastAPI)${NC}"
echo ""

cd cattle-api

# Verifica se venv já existe
if [ ! -d ".venv" ]; then
    echo "Criando ambiente virtual..."
    python3 -m venv .venv
else
    echo "Ambiente virtual já existe ✓"
fi

# Ativa o venv
source .venv/bin/activate

# Instala dependências
echo "Instalando dependências Python..."
pip install -r requirements.txt

echo -e "${GREEN}✓ Backend configurado!${NC}"
echo ""

cd ..

# =============== FRONTEND ===============
echo -e "${BLUE}📦 Configurando Frontend (React Native + Expo)${NC}"
echo ""

cd frontend

# Verifica se node_modules já existe
if [ ! -d "node_modules" ]; then
    echo "Instalando dependências Node.js..."
    npm install
else
    echo "Dependências Node.js já instaladas ✓"
fi

echo -e "${GREEN}✓ Frontend configurado!${NC}"
echo ""

cd ..

# =============== RESUMO ===============
echo -e "${GREEN}✅ Setup concluído com sucesso!${NC}"
echo ""
echo -e "${YELLOW}Para iniciar o projeto:${NC}"
echo ""
echo "Terminal 1 - Backend:"
echo "  ./start-backend.sh"
echo ""
echo "Terminal 2 - Frontend:"
echo "  ./start-frontend.sh"
echo ""
echo "Depois pressione 'W' para abrir no navegador (ou escanear QR code para celular)"
