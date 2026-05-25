#!/bin/bash

# Script para iniciar Backend E Frontend simultaneamente
# Requer 2 abas/janelas de terminal abertas

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}  AgriMonitor - Iniciar Backend + Frontend${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

# Verifica pré-requisitos
if [ ! -d "cattle-api/.venv" ]; then
    echo -e "${RED}❌ Ambiente virtual não encontrado no backend${NC}"
    echo "   Execute ./setup.sh primeiro"
    exit 1
fi

if [ ! -d "frontend/node_modules" ]; then
    echo -e "${RED}❌ Dependências não instaladas no frontend${NC}"
    echo "   Execute ./setup.sh primeiro"
    exit 1
fi

echo -e "${YELLOW}Este script vai abrir 2 terminais:${NC}"
echo "  1. Backend (http://localhost:8000)"
echo "  2. Frontend (Expo Dev Tools)"
echo ""
echo -e "${GREEN}Iniciando...${NC}"
echo ""

# Inicia backend em nova janela
open -a Terminal "$(pwd)/start-backend.sh"

sleep 3

# Inicia frontend em nova janela
open -a Terminal "$(pwd)/start-frontend.sh"

echo -e "${GREEN}✅ Abra o navegador em http://localhost:3000${NC}"
echo "   ou pressione 'W' no terminal do Expo para abrir no web browser"
