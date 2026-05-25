#!/bin/bash

# Script para iniciar apenas o Frontend

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 Iniciando Frontend...${NC}"
echo ""

cd frontend

# Verifica se node_modules existe
if [ ! -d "node_modules" ]; then
    echo "❌ Dependências não instaladas. Execute ./setup.sh primeiro"
    exit 1
fi

echo -e "${GREEN}✓ Frontend iniciado!${NC}"
echo ""
echo -e "${YELLOW}Escolha uma opção:${NC}"
echo "  W - Abrir no navegador (web)"
echo "  A - Android Emulator"
echo "  I - iOS Simulator"
echo "  S - Escanear QR code com Expo Go"
echo ""

npm start
