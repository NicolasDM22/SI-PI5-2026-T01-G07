# Cattle Monitor API

API de monitoramento de rebanho bovino via drone com visão computacional.

## Stack

- **Python 3.11+**
- **FastAPI** — framework web
- **SQLModel** — ORM com SQLite
- **Ultralytics YOLOv8** — inferência de IA
- **OpenCV** — extração de frames
- **FPDF2** — geração de relatórios PDF

## Estrutura do projeto

```
cattle-api/
├── main.py                  # App FastAPI + registro de rotas
├── database.py              # Engine SQLite e sessão
├── routes/
│   ├── upload.py            # POST /upload — recebe vídeo
│   ├── jobs.py              # GET /jobs, GET /jobs/{id}, DELETE /jobs/{id}
│   └── stream.py            # WS /stream/ws/{job_id} — progresso em tempo real
├── services/
│   ├── frame_extractor.py   # Extrai frames do vídeo
│   ├── ai_inference.py      # Roda YOLO nos frames
│   ├── report_generator.py  # Gera PDF com resultados
│   ├── notifier.py          # Envia alertas
│   └── processor.py         # Orquestra o pipeline completo
├── outputs/
│   ├── videos/              # Vídeos enviados
│   ├── frames/              # Frames extraídos
│   └── reports/             # PDFs gerados
├── .env                     # Variáveis de ambiente (não commitado)
├── .gitignore
├── requirements.txt
└── README.md
```

## Como rodar localmente

### Pré-requisitos

- Python 3.11 ou superior
- Git

### 1. Clonar o repositório

```bash
git clone https://github.com/<org>/SI-PI5-2026-T01-G07.git
cd SI-PI5-2026-T01-G07/cattle-api
```

### 2. Criar e ativar o ambiente virtual

```bash
# Windows
python -m venv .venv
.venv\Scripts\activate

# macOS / Linux
python3 -m venv .venv
source .venv/bin/activate
```

> **Windows — erro de política de execução:** se aparecer `cannot be loaded because running scripts is disabled`, rode uma vez no PowerShell e tente novamente:
> ```powershell
> Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
> ```
> Ou ative pelo `cmd` sem precisar mudar a política:
> ```cmd
> .venv\Scripts\activate.bat
> ```

### 3. Instalar as dependências

```bash
pip install -r requirements.txt
```

### 4. Configurar as variáveis de ambiente

O arquivo `.env` já vem com o valor padrão para desenvolvimento local:

```
DATABASE_URL=sqlite:///./cattle.db
```

Edite conforme necessário.

### 5. Rodar a API

```bash
uvicorn main:app --reload
```

A API estará disponível em `http://localhost:8000`.

Documentação interativa (Swagger): `http://localhost:8000/docs`

## Endpoints disponíveis

| Método | Caminho              | Descrição                        |
|--------|----------------------|----------------------------------|
| GET    | /health              | Health check                     |
| POST   | /upload/             | Envia vídeo para processamento   |
| GET    | /jobs/               | Lista todos os jobs              |
| GET    | /jobs/{job_id}       | Retorna status de um job         |
| DELETE | /jobs/{job_id}       | Remove um job                    |
| WS     | /stream/ws/{job_id}  | Stream de progresso via WebSocket|
