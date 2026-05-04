# 🎬 Teste Completo - Inferência YOLO em Vídeo de Gado

## 📍 Onde Colocar o Vídeo

### Opção 1: Estrutura Recomendada (Isolado)

```
cattle-api/
├── test_videos/
│   └── input/
│       └── seu_video.mp4  ← COLOQUE SEU VÍDEO AQUI
├── test_complete_video.py
└── services/
```

**Comando:**
```bash
# Crie a pasta se não existir
mkdir -p cattle-api/test_videos/input

# Coloque seu arquivo de vídeo lá
# (pode usar scp, cp, ou drag-and-drop)

# Execute o teste
cd cattle-api
python3 test_complete_video.py test_videos/input/seu_video.mp4
```

---

### Opção 2: Vídeo na Raiz do cattle-api

```
cattle-api/
├── seu_video.mp4  ← OU AQUI
├── test_complete_video.py
└── services/
```

**Comando:**
```bash
cd cattle-api
python3 test_complete_video.py seu_video.mp4
```

---

## 🚀 Como Usar o Script

### Teste Rápido (Mock)
O script vem com **MOCK ativado** por padrão. Execute para teste rápido:

```bash
cd cattle-api
python3 test_complete_video.py test_videos/input/seu_video.mp4
```

### Teste com Modelo Real
Quando o modelo YOLO estiver pronto:

1. Coloque o arquivo em `cattle-api/yolov8n.pt` (ou use modelo customizado)
2. Em `services/ai_inference.py`, mude: `USE_MOCK = False`
3. Execute:

```bash
python3 test_complete_video.py test_videos/input/seu_video.mp4
```

---

## 📊 Saída Esperada

```
======================================================================
🎬 TESTE DE INFERÊNCIA YOLO EM VÍDEO DE GADO
======================================================================

📹 Vídeo: test_videos/input/gado.mp4
📊 Tamanho: 125.50 MB

1️⃣  Carregando modelo...
   ✅ Modelo carregado com sucesso

2️⃣  Extraindo frames do vídeo...
   ✅ 120 frames extraídos

3️⃣  Executando inferência YOLO...
   ✅ Inferência concluída

======================================================================
📊 RESULTADOS DA ANÁLISE
======================================================================

📊 Contagem MÉDIA de gado entre os frames:
   → 12.45 cabeças/frame

🔝 Contagem MÁXIMA detectada:
   → 18 cabeças (em um único frame)

💯 Confiança MÉDIA das detecções:
   → 87.32%

🖼️  Imagem anotada do frame com maior contagem:
   → outputs/frames/a1b2c3d4/annotated_max_count.jpg
   Tamanho: 245.60 KB
```

---

## 📁 Estrutura de Output

Após executar o teste, será criada:

```
cattle-api/
├── outputs/
│   └── frames/
│       └── {ID_UNICO}/
│           ├── frame_001.jpg          ← Frames extraídos
│           ├── frame_002.jpg
│           ├── frame_003.jpg
│           └── annotated_max_count.jpg ← Imagem com maior contagem
│
└── test_videos/
    └── input/
        └── seu_video.mp4
```

---

## 🔍 O que o Script Faz

### 1. **Carrega Modelo** 
   - Uma única vez no startup (padrão Singleton)

### 2. **Extrai Frames**
   - 1 frame por segundo do vídeo
   - Salva em `outputs/frames/{ID}/`

### 3. **Executa Inferência**
   - Processa cada frame
   - Conta gado em cada frame
   - Rastreia o frame com maior contagem

### 4. **Retorna Resultados**
   ```python
   {
       "cattle_count_avg": 12.45,        # Média entre todos os frames
       "cattle_count_max": 18,           # Máximo em um frame
       "max_count_frame_path": "...",    # Caminho da imagem anotada
       "confidence_avg": 0.8732          # Confiança média
   }
   ```

---

## 💾 Exemplos de Comandos

```bash
# Com estrutura recomendada
cd cattle-api
python3 test_complete_video.py test_videos/input/gado.mp4

# Vídeo na raiz
python3 test_complete_video.py meu_video.mp4

# Vídeo em outro local (caminho absoluto)
python3 test_complete_video.py /home/user/videos/gado.mp4
```

---

## ⚙️ Requisitos

- Python 3.8+
- OpenCV (cv2)
- NumPy
- FastAPI/Ultralytics (para YOLO real)

Já instalados em `requirements.txt`:
```bash
pip install -r requirements.txt
```

---

## 🎯 Checklist de Teste

- [ ] Vídeo colocado em `test_videos/input/` (ou outro local)
- [ ] Script `test_complete_video.py` existe em `cattle-api/`
- [ ] Executado: `python3 test_complete_video.py [caminho_video]`
- [ ] Verificou os resultados na saída
- [ ] Imagem anotada foi salva em `outputs/frames/{ID}/`
- [ ] Valores retornados: cattle_count_avg, cattle_count_max, confidence_avg

---

## 🐛 Troubleshooting

### Erro: "ModuleNotFoundError: No module named 'services'"
```bash
# Certifique que está no diretório cattle-api
cd cattle-api
python3 test_complete_video.py test_videos/input/seu_video.mp4
```

### Erro: "File not found: seu_video.mp4"
```bash
# Verifique o caminho do vídeo
ls test_videos/input/  # Veja se o arquivo está lá
```

### Vídeo não está sendo processado
- Verifique formato: MP4, AVI, MOV são suportados
- Certifique que OpenCV consegue ler o vídeo
- Teste com outro vídeo

---

## 📝 Modo Mock vs YOLO Real

**Mock (Padrão - USE_MOCK=True)**
- Simula detecções com números aleatórios
- Rápido para testes
- Reproducível por job_id

**YOLO Real (USE_MOCK=False)**
- Usa modelo Ultralytics YOLO
- Detecções reais
- Mais lento mas preciso

---

## 🚀 Próximas Etapas

1. Teste com Mock (padrão)
2. Quando modelo YOLO estiver treinado:
   - Mude `USE_MOCK = False` em `ai_inference.py`
   - Execute novamente para resultados reais

---

**Última atualização**: 2026-04-28
**Status**: ✅ Pronto para usar
