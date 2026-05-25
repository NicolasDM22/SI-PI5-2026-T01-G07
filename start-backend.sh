#!/bin/bash

# Script para iniciar apenas o Backend

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${BLUE}🚀 Iniciando Backend...${NC}"
echo ""

cd cattle-api

# Ativa o venv
if [ ! -d ".venv" ]; then
    echo "❌ Ambiente virtual não encontrado. Execute ./setup.sh primeiro"
    exit 1
fi

source .venv/bin/activate

echo -e "${GREEN}✓ Backend iniciado em http://localhost:8000${NC}"
echo -e "${GREEN}✓ Swagger em http://localhost:8000/docs${NC}"
echo ""

# Inicia a API
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
