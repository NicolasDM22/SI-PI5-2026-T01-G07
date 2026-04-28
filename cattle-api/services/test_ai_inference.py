"""
Testes para o módulo ai_inference.py

Execute com: python -m pytest services/test_ai_inference.py -v
             ou: python3 services/test_ai_inference.py
"""

import os
import sys
import pytest
import numpy as np
import cv2
from pathlib import Path

# Adiciona o diretório pai ao path para importações funcionarem
sys.path.insert(0, str(Path(__file__).parent.parent))

from services.ai_inference import load_model, run_inference, run_inference_frame, USE_MOCK



@pytest.fixture
def setup_test_frames():
    """Cria frames de teste temporários."""
    test_dir = "test_frames"
    Path(test_dir).mkdir(exist_ok=True)
    
    frame_paths = []
    for i in range(3):
        # Cria frame dummy (imagem preta)
        frame = np.zeros((720, 1280, 3), dtype=np.uint8)
        path = os.path.join(test_dir, f"frame_{i:03d}.jpg")
        cv2.imwrite(path, frame)
        frame_paths.append(path)
    
    yield frame_paths
    
    # Limpeza
    for path in frame_paths:
        if os.path.exists(path):
            os.remove(path)
    if os.path.exists(test_dir):
        os.rmdir(test_dir)


def test_load_model():
    """Testa carregamento do modelo na inicialização."""
    load_model()
    from services.ai_inference import _model
    assert _model is not None
    print("✅ Modelo carregado com sucesso")


def test_run_inference_mock(setup_test_frames):
    """Testa inferência com mock."""
    if not USE_MOCK:
        pytest.skip("Modo MOCK desativado")
    
    load_model()
    
    frame_paths = setup_test_frames
    job_id = "test_job_123"
    
    result = run_inference(frame_paths, job_id)
    
    assert isinstance(result, dict)
    assert "cattle_count" in result
    assert "annotated_image_path" in result
    assert "confidence_avg" in result
    
    assert isinstance(result["cattle_count"], (int, np.integer))
    assert isinstance(result["confidence_avg"], (float, np.floating))
    assert result["cattle_count"] >= 0
    assert 0.0 <= result["confidence_avg"] <= 1.0
    
    # Verifica se a imagem anotada foi salva
    if result["annotated_image_path"]:
        assert os.path.exists(result["annotated_image_path"])
        print(f"✅ Imagem anotada salva em: {result['annotated_image_path']}")
    
    print(f"✅ Teste passed: cattle_count={result['cattle_count']}, confidence_avg={result['confidence_avg']:.2f}")


def test_run_inference_empty_frames():
    """Testa inferência com lista vazia de frames."""
    load_model()
    
    job_id = "test_empty"
    result = run_inference([], job_id)
    
    assert isinstance(result, dict)
    assert result.get("cattle_count") == 0
    print("✅ Teste passou com lista vazia de frames")


def test_output_directory_creation(setup_test_frames):
    """Testa criação automática do diretório de output."""
    load_model()
    
    frame_paths = setup_test_frames
    job_id = "test_dir_creation"
    
    result = run_inference(frame_paths, job_id)
    
    output_dir = os.path.join("outputs", "frames", job_id)
    assert os.path.exists(output_dir)
    
    # Limpa
    import shutil
    if os.path.exists(output_dir):
        shutil.rmtree(output_dir)
    
    print(f"✅ Diretório criado corretamente: {output_dir}")


def test_run_inference_frame():
    """Testa inferência de frame individual para live stream."""
    if not USE_MOCK:
        pytest.skip("Modo MOCK desativado")
    
    load_model()
    
    # Cria uma imagem dummy
    frame = np.zeros((720, 1280, 3), dtype=np.uint8)
    
    # Codifica como JPEG
    success, frame_bytes = cv2.imencode('.jpg', frame)
    assert success, "Erro ao codificar frame"
    
    flight_id = "test_live_stream"
    result = run_inference_frame(frame_bytes.tobytes(), flight_id)
    
    assert isinstance(result, dict)
    assert "cattle_count" in result
    assert "confidence_avg" in result
    
    assert isinstance(result["cattle_count"], (int, np.integer))
    assert isinstance(result["confidence_avg"], (float, np.floating))
    assert result["cattle_count"] >= 0
    assert 0.0 <= result["confidence_avg"] <= 1.0
    
    print(f"✅ Teste live stream passed: cattle_count={result['cattle_count']}, confidence_avg={result['confidence_avg']:.2f}")


if __name__ == "__main__":
    # Testes rápidos sem pytest
    print("\n🧪 Iniciando testes de ai_inference.py...\n")
    
    test_load_model()
    
    # Cria frames de teste
    test_dir = "test_frames"
    Path(test_dir).mkdir(exist_ok=True)
    
    frame_paths = []
    for i in range(3):
        frame = np.zeros((720, 1280, 3), dtype=np.uint8)
        path = os.path.join(test_dir, f"frame_{i:03d}.jpg")
        cv2.imwrite(path, frame)
        frame_paths.append(path)
    
    test_run_inference_mock(frame_paths)
    test_run_inference_empty_frames()
    test_output_directory_creation(frame_paths)
    test_run_inference_frame()
    
    # Limpeza
    import shutil
    for path in frame_paths:
        if os.path.exists(path):
            os.remove(path)
    if os.path.exists(test_dir):
        os.rmdir(test_dir)
    if os.path.exists("outputs"):
        try:
            shutil.rmtree("outputs")
        except:
            pass
    
    print("\n✅ Todos os testes passaram!\n")
