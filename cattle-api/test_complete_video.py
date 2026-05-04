#!/usr/bin/env python3
"""
Script de Teste Completo - Inferência YOLO em Video de Gado

Este script testa a implementação completa:
1. Extrai frames do vídeo
2. Roda inferência em todos os frames
3. Retorna:
   - Contagem MÉDIA entre todos os frames
   - Caminho da imagem anotada do frame com MAIOR contagem
   - Confiança MÉDIA das detecções

COMO USAR:
1. Coloque seu vídeo em: cattle-api/test_videos/input/seu_video.mp4
2. Execute: python3 test_complete_video.py test_videos/input/seu_video.mp4

Exemplo:
    python3 test_complete_video.py test_videos/input/gado.mp4
"""

import os
import sys
from pathlib import Path

# Adiciona diretório pai ao path
sys.path.insert(0, str(Path(__file__).parent))

from services.ai_inference import load_model, run_inference
from services.frame_extractor import extract_frames, cleanup_frames


def test_video_inference(video_path: str):
    """
    Testa inferência em um vídeo completo.
    
    Args:
        video_path: Caminho para o arquivo de vídeo
    """
    
    print("\n" + "="*70)
    print("🎬 TESTE DE INFERÊNCIA YOLO EM VÍDEO DE GADO")
    print("="*70 + "\n")
    
    # Validações
    if not os.path.exists(video_path):
        print(f"❌ ERRO: Arquivo não encontrado: {video_path}")
        return
    
    print(f"📹 Vídeo: {video_path}")
    print(f"📊 Tamanho: {os.path.getsize(video_path) / 1024 / 1024:.2f} MB\n")
    
    # Gera ID único para o job
    import uuid
    job_id = str(uuid.uuid4())[:8]
    
    try:
        # 1. Carrega o modelo
        print("1️⃣  Carregando modelo...")
        load_model()
        print("   ✅ Modelo carregado com sucesso\n")
        
        # 2. Extrai frames do vídeo
        print("2️⃣  Extraindo frames do vídeo...")
        frames = extract_frames(video_path, job_id)
        print(f"   ✅ {len(frames)} frames extraídos\n")
        
        # 3. Roda inferência
        print("3️⃣  Executando inferência YOLO (isto pode levar um tempo)...")
        result = run_inference(frames, job_id)
        print("   ✅ Inferência concluída\n")
        
        # 4. Exibe resultados
        print("="*70)
        print("📊 RESULTADOS DA ANÁLISE")
        print("="*70 + "\n")
        
        if "error" in result:
            print(f"❌ ERRO: {result['error']}")
            return
        
        cattle_count_avg = result.get("cattle_count_avg", 0)
        cattle_count_max = result.get("cattle_count_max", 0)
        confidence_avg = result.get("confidence_avg", 0)
        annotated_path = result.get("max_count_frame_path")
        
        print(f"📊 Contagem MÉDIA de gado entre os frames:")
        print(f"   → {cattle_count_avg:.2f} cabeças/frame\n")
        
        print(f"🔝 Contagem MÁXIMA detectada:")
        print(f"   → {cattle_count_max} cabeças (em um único frame)\n")
        
        print(f"💯 Confiança MÉDIA das detecções:")
        print(f"   → {confidence_avg:.2%}\n")
        
        if annotated_path and os.path.exists(annotated_path):
            print(f"🖼️  Imagem anotada do frame com maior contagem:")
            print(f"   → {annotated_path}\n")
            print(f"   Tamanho: {os.path.getsize(annotated_path) / 1024:.2f} KB")
        else:
            print(f"❌ Imagem anotada não foi salva")
        
        # 5. Resumo técnico
        print("\n" + "="*70)
        print("📋 INFORMAÇÕES TÉCNICAS")
        print("="*70 + "\n")
        
        print(f"Total de frames processados: {len(frames)}")
        print(f"Job ID: {job_id}")
        print(f"Diretório de output: outputs/frames/{job_id}/")
        print(f"\nArquivos gerados:")
        output_dir = os.path.join("outputs", "frames", job_id)
        if os.path.exists(output_dir):
            for file in os.listdir(output_dir):
                file_path = os.path.join(output_dir, file)
                size = os.path.getsize(file_path) / 1024
                print(f"  - {file} ({size:.2f} KB)")
        
        print("\n" + "="*70)
        print("✅ TESTE CONCLUÍDO COM SUCESSO!")
        print("="*70 + "\n")
        
        # 6. Pergunta se quer limpar arquivos
        cleanup = input("Deseja limpar os frames extraídos? (s/N): ").lower().strip()
        if cleanup == 's':
            cleanup_frames(job_id)
            print("✅ Frames removidos")
        else:
            print(f"ℹ️  Frames mantidos em: outputs/frames/{job_id}/")
        
    except Exception as e:
        print(f"❌ ERRO: {e}")
        import traceback
        traceback.print_exc()


def main():
    """Ponto de entrada do script."""
    
    if len(sys.argv) < 2:
        print(__doc__)
        
        print("\n📂 ESTRUTURA DE DIRETÓRIOS ESPERADA:")
        print("""
cattle-api/
├── test_videos/
│   └── input/
│       └── seu_video.mp4  ← Coloque seu vídeo aqui
├── test_complete_video.py  ← Este script
└── services/
    └── ai_inference.py
        """)
        
        print("\n💡 EXEMPLOS DE USO:")
        print("""
# Teste com um vídeo de gado
python3 test_complete_video.py test_videos/input/gado.mp4

# Teste com outro vídeo
python3 test_complete_video.py test_videos/input/outro_video.mp4
        """)
        
        sys.exit(1)
    
    video_path = sys.argv[1]
    test_video_inference(video_path)


if __name__ == "__main__":
    main()
