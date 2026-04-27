import os
import pytest
import cv2
import numpy as np

# Importe as funções do seu arquivo original
# Substitua 'video_processor' pelo nome real do seu arquivo .py (sem o .py)
from frame_extractor import extract_frames, cleanup_frames

# --- FIXTURES (Configurações de Teste) ---

@pytest.fixture
def dummy_video(tmp_path):
    """
    Cria um vídeo MP4 falso de 2 segundos (60 frames no total) 
    em uma pasta temporária exclusiva para o teste.
    """
    video_path = str(tmp_path / "dummy_test_video.mp4")
    fps = 30
    duration = 2 # segundos
    total_frames = fps * duration
    
    # Configura o VideoWriter do OpenCV (resolução minúscula 64x64 para ser rápido)
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(video_path, fourcc, fps, (64, 64))
    
    # Gera frames pretos
    for _ in range(total_frames):
        frame = np.zeros((64, 64, 3), dtype=np.uint8)
        out.write(frame)
    
    out.release()
    return video_path

@pytest.fixture
def safe_job_id():
    """
    Gera um job_id para o teste e garante que a pasta 
    seja deletada no final, mesmo se o teste falhar.
    """
    job_id = "test_job_12345"
    yield job_id  # Entrega o ID para o teste usar
    # --- TEARDOWN (Roda após o teste acabar) ---
    cleanup_frames(job_id)


# --- TESTES ---

def test_extract_frames_success(dummy_video, safe_job_id):
    """Testa o caminho feliz: extração de frames de um vídeo válido."""
    
    # Executa a função
    extracted_files = extract_frames(dummy_video, safe_job_id)
    
    # Verificações (Asserts)
    assert len(extracted_files) == 2, "Como o vídeo tem 2 segundos, deve extrair 2 frames"
    
    # Verifica se os arquivos realmente existem no disco
    for file_path in extracted_files:
        assert os.path.exists(file_path), f"Arquivo não encontrado: {file_path}"
        assert file_path.endswith(".jpg")

def test_extract_frames_file_not_found():
    """Testa o comportamento quando o vídeo não existe."""
    
    with pytest.raises(FileNotFoundError, match="Arquivo de vídeo não encontrado"):
        extract_frames("caminho_inventado_que_nao_existe.mp4", "job_error")

def test_cleanup_frames(dummy_video):
    """Testa se a função de limpeza apaga o diretório corretamente."""
    
    job_id = "test_cleanup_job"
    
    # Primeiro, forçamos a criação da pasta e dos frames
    extract_frames(dummy_video, job_id)
    expected_dir = os.path.join("outputs", "frames", job_id)
    
    # Verifica se a pasta foi criada
    assert os.path.exists(expected_dir)
    
    # Executa a limpeza
    cleanup_frames(job_id)
    
    # Verifica se a pasta foi removida
    assert not os.path.exists(expected_dir)