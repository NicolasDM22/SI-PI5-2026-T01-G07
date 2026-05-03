# AgriMonitor — Sistema de Monitoramento de Gado

Sistema de monitoramento de rebanho bovino via drone com detecção automática por IA (YOLOv8). O operador grava o voo, envia o vídeo pelo app e recebe a contagem de animais detectados.

---

## Estrutura do projeto

```
SI-PI5-2026-T01-G07/
├── cattle-api/   # Backend — Python + FastAPI + YOLOv8
└── frontend/     # App mobile — React Native + Expo
```

---

## Pré-requisitos

| Ferramenta | Versão mínima | Download |
|---|---|---|
| Python | 3.11+ | https://www.python.org/downloads/ |
| Node.js | 18+ | https://nodejs.org/ |
| Expo Go (celular, opcional) | qualquer | App Store / Play Store |

> Verifique as instalações: `python --version` e `node --version`

---

## 1. Configurar e rodar o Backend

```bash
cd cattle-api
```

### Instalar dependências

```bash
pip install -r requirements.txt
```

> Na primeira vez o download pode demorar (PyTorch + YOLOv8 são pesados).

### Rodar a API

```bash
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

A API estará disponível em:
- **Local:** `http://localhost:8000`
- **Documentação (Swagger):** `http://localhost:8000/docs`

---

## 2. Configurar e rodar o Frontend

```bash
cd frontend
```

### Instalar dependências

```bash
npm install
```

### Configurar a URL da API

Edite o arquivo `frontend/.env` e troque pelo **IP da sua máquina na rede local**:

```env
EXPO_PUBLIC_API_URL=http://SEU_IP:8000
```

**Como descobrir seu IP:**

- **Windows:** abra o Prompt de Comando e rode `ipconfig` — procure o valor em "Endereço IPv4"
- **macOS/Linux:** rode `ifconfig | grep inet` no terminal

Exemplo: `EXPO_PUBLIC_API_URL=http://192.168.0.145:8000`

> Se for testar **só no browser do computador**, pode deixar `http://localhost:8000`.

### Rodar o app

```bash
npx expo start
```

Vai abrir o Expo Developer Tools. Escolha como visualizar:

| Opção | Como fazer |
|---|---|
| **Browser (mais fácil)** | Pressiona `W` no terminal |
| **Celular (Expo Go)** | Escaneia o QR code com o app Expo Go |
| **Android Emulator** | Pressiona `A` (requer Android Studio) |

---

## 3. Fluxo de uso

1. **Login** — qualquer email e senha funcionam (ambiente de desenvolvimento)
2. **Upload** — seleciona um vídeo `.mp4` de voo e o pasto sobrevoado
3. **Aguarda processamento** — o YOLO analisa frame a frame (pode levar alguns minutos dependendo do tamanho do vídeo)
4. **Voos** — veja o resultado com a contagem de animais detectados
5. **Relatório PDF** — disponível via `GET /flights/{id}/report` no Swagger

---

## 4. Verificar se está funcionando

Após subir o backend, acesse no browser:

```
http://localhost:8000/health
```

Resposta esperada: `{"status": "ok"}`

Para ver os voos registrados:

```
http://localhost:8000/docs → GET /flights/ → Try it out → Execute
```

---

## Endpoints principais da API

| Método | Rota | Descrição |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/auth/login` | Login (retorna token) |
| POST | `/flights/upload` | Envia vídeo para processamento |
| GET | `/flights/` | Lista todos os voos |
| GET | `/flights/{id}` | Detalhes de um voo |
| GET | `/flights/{id}/report` | Download do relatório PDF |
| WS | `/stream/ws/stream` | Stream ao vivo com detecção em tempo real |

---

## Rodando os dois ao mesmo tempo

Abra **dois terminais** lado a lado:

**Terminal 1 — Backend:**
```bash
cd cattle-api
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npx expo start
```
