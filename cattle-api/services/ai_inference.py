import logging
import os
from pathlib import Path
from typing import Optional

import cv2
import numpy as np

logger = logging.getLogger(__name__)

# Variável global para armazenar o modelo carregado uma única vez
_model = None
USE_MOCK = True  # Mude para False quando o modelo YOLO estiver pronto


def load_model():
    """
    Carrega o modelo YOLO uma única vez na inicialização.
    Essa função é chamada no lifespan do FastAPI.
    """
    global _model
    
    if _model is not None:
        logger.info("Modelo YOLO já está carregado")
        return
    
    if USE_MOCK:
        logger.warning("🔬 MODO MOCK ATIVADO - Usando inferência simulada")
        _model = {"type": "mock"}
        return
    
    try:
        from ultralytics import YOLO
        
        # Tenta carregar o modelo pré-treinado (yolov8n.pt ou outro)
        model_path = "yolov8n.pt"
        if os.path.exists(model_path):
            _model = YOLO(model_path)
            logger.info(f"✅ Modelo YOLO carregado com sucesso: {model_path}")
        else:
            logger.warning(f"⚠️ Arquivo {model_path} não encontrado. Usando mock.")
            _model = {"type": "mock"}
            
    except ImportError as e:
        logger.error(f"❌ Erro ao importar YOLO: {e}. Usando mock.")
        _model = {"type": "mock"}
    except Exception as e:
        logger.error(f"❌ Erro ao carregar modelo YOLO: {e}. Usando mock.")
        _model = {"type": "mock"}


def run_inference(
    frame_paths: list[str], job_id: str
) -> dict:
    """
    Executa inferência do modelo YOLO em múltiplos frames.
    
    Args:
        frame_paths: Lista com caminhos para os arquivos de frame
        job_id: ID do trabalho/voo para nomear os outputs
        
    Returns:
        Dict contendo:
        - cattle_count: Número total de gado detectado
        - annotated_image_path: Caminho da imagem anotada salva
        - confidence_avg: Confiança média das detecções
    """
    global _model
    
    if _model is None:
        logger.warning("Modelo não foi carregado. Carregando agora...")
        load_model()
    
    # Cria diretório de output
    output_dir = os.path.join("outputs", "frames", job_id)
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    
    try:
        if isinstance(_model, dict) and _model.get("type") == "mock":
            return _run_inference_mock(frame_paths, job_id, output_dir)
        else:
            return _run_inference_yolo(frame_paths, job_id, output_dir)
            
    except Exception as e:
        logger.error(f"Erro na inferência: {e}")
        return {
            "cattle_count": 0,
            "annotated_image_path": None,
            "confidence_avg": 0.0,
            "error": str(e),
        }


def _run_inference_mock(
    frame_paths: list[str], job_id: str, output_dir: str
) -> dict:
    """
    Versão mock da inferência usando dados simulados.
    Rastreia qual frame teve a maior contagem de gado.
    """
    logger.info(f"🔬 Executando inferência MOCK para {len(frame_paths)} frames (job_id: {job_id})")
    
    try:
        # Se não houver frames, retorna vazio
        if not frame_paths:
            logger.info("✅ Mock Inferência concluída: sem frames (cattle_count=0)")
            return {
                "cattle_count_avg": 0,
                "cattle_count_max": 0,
                "max_count_frame_path": None,
                "confidence_avg": 0.0,
            }
        
        # Processa cada frame e rastreia o de maior contagem
        all_counts = []
        all_confidences = []
        max_count = 0
        max_count_idx = 0
        
        for idx, frame_path in enumerate(frame_paths):
            # Simula detecções com números aleatórios
            np.random.seed(hash(f"{job_id}_{idx}") % (2**32))  # Seed por frame
            
            cattle_count = np.random.randint(5, 25)
            confidence_scores = np.random.uniform(0.75, 0.99, cattle_count)
            
            all_counts.append(cattle_count)
            all_confidences.extend(confidence_scores)
            
            # Rastreia o frame com maior contagem
            if cattle_count > max_count:
                max_count = cattle_count
                max_count_idx = idx
        
        # Calcula médias
        cattle_count_avg = float(np.mean(all_counts))
        confidence_avg = float(np.mean(all_confidences)) if all_confidences else 0.0
        
        # Processa o frame com maior contagem para salvar anotação
        best_frame_path = frame_paths[max_count_idx]
        frame = cv2.imread(best_frame_path)
        if frame is None:
            logger.warning(f"Não foi possível ler frame: {best_frame_path}")
            frame = np.zeros((720, 1280, 3), dtype=np.uint8)
        
        # Desenha retângulos no frame com maior contagem
        frame_annotated = frame.copy()
        np.random.seed(hash(f"{job_id}_{max_count_idx}") % (2**32))
        confidence_scores = np.random.uniform(0.75, 0.99, max_count)
        
        for i in range(max_count):
            x = np.random.randint(50, frame_annotated.shape[1] - 150)
            y = np.random.randint(50, frame_annotated.shape[0] - 150)
            w = np.random.randint(80, 150)
            h = np.random.randint(80, 150)
            
            cv2.rectangle(frame_annotated, (x, y), (x + w, y + h), (0, 255, 0), 2)
            label = f"Cattle {confidence_scores[i]:.2f}"
            cv2.putText(frame_annotated, label, (x, y - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
        
        # Adiciona info no canto
        info_text = f"Max Frame | Cattle: {max_count} | Avg Conf: {confidence_avg:.2f}"
        cv2.putText(frame_annotated, info_text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 0), 2)
        
        # Salva a imagem anotada do frame com maior contagem
        annotated_path = os.path.join(output_dir, "annotated_max_count.jpg")
        cv2.imwrite(annotated_path, frame_annotated)
        logger.info(f"✅ Imagem do frame de maior contagem salva: {annotated_path}")
        
        result = {
            "cattle_count_avg": cattle_count_avg,
            "cattle_count_max": max_count,
            "max_count_frame_path": annotated_path,
            "confidence_avg": confidence_avg,
        }
        
        logger.info(
            f"🔬 Mock Inferência concluída: "
            f"frames={len(frame_paths)}, avg={cattle_count_avg:.2f}, max={max_count}, conf_avg={confidence_avg:.2f}"
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Erro na inferência mock: {e}")
        return {
            "cattle_count_avg": 0,
            "cattle_count_max": 0,
            "max_count_frame_path": None,
            "confidence_avg": 0.0,
            "error": str(e),
        }



def _run_inference_yolo(
    frame_paths: list[str], job_id: str, output_dir: str
) -> dict:
    """
    Versão real da inferência usando o modelo YOLO.
    Rastreia qual frame teve a maior contagem de gado.
    """
    logger.info(f"🤖 Executando inferência YOLO para {len(frame_paths)} frames (job_id: {job_id})")
    
    try:
        all_confidences = []
        frame_counts = []
        max_count = 0
        max_count_idx = 0
        max_count_frame = None
        
        # Processa cada frame
        for idx, frame_path in enumerate(frame_paths):
            if not os.path.exists(frame_path):
                logger.warning(f"Frame não encontrado: {frame_path}")
                frame_counts.append(0)
                continue
            
            frame = cv2.imread(frame_path)
            if frame is None:
                logger.warning(f"Erro ao ler frame: {frame_path}")
                frame_counts.append(0)
                continue
            
            # Roda o modelo YOLO
            results = _model(frame)
            
            frame_detections = 0
            frame_copy = frame.copy()
            
            # Extrai detecções
            for result in results:
                boxes = result.boxes
                frame_detections = len(boxes)
                
                for box in boxes:
                    conf = float(box.conf[0])
                    all_confidences.append(conf)
                    
                    # Desenha bounding box
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    cv2.rectangle(frame_copy, (x1, y1), (x2, y2), (0, 255, 0), 2)
                    cv2.putText(
                        frame_copy,
                        f"{conf:.2f}",
                        (x1, y1 - 5),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.5,
                        (0, 255, 0),
                        2
                    )
            
            frame_counts.append(frame_detections)
            
            # Rastreia o frame com maior contagem
            if frame_detections > max_count:
                max_count = frame_detections
                max_count_idx = idx
                max_count_frame = frame_copy
        
        # Calcula estatísticas
        cattle_count_avg = float(np.mean(frame_counts)) if frame_counts else 0.0
        confidence_avg = float(np.mean(all_confidences)) if all_confidences else 0.0
        
        # Salva a imagem anotada do frame com maior contagem
        annotated_path = os.path.join(output_dir, "annotated_max_count.jpg")
        if max_count_frame is not None:
            cv2.imwrite(annotated_path, max_count_frame)
            logger.info(f"✅ Imagem do frame de maior contagem salva: {annotated_path}")
        else:
            annotated_path = None
            logger.warning("Nenhum frame foi processado")
        
        result = {
            "cattle_count_avg": cattle_count_avg,
            "cattle_count_max": max_count,
            "max_count_frame_path": annotated_path,
            "confidence_avg": confidence_avg,
        }
        
        logger.info(
            f"✅ YOLO Inferência concluída: "
            f"frames={len(frame_paths)}, avg={cattle_count_avg:.2f}, max={max_count}, conf_avg={confidence_avg:.2f}"
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Erro na inferência YOLO: {e}")
        return {
            "cattle_count_avg": 0,
            "cattle_count_max": 0,
            "max_count_frame_path": None,
            "confidence_avg": 0.0,
            "error": str(e),
        }


def run_inference_frame(frame_bytes: bytes, flight_id: str) -> dict:
    """
    Executa detecção YOLO em um frame raw (live stream).
    
    Args:
        frame_bytes: Bytes da imagem codificada (JPEG/PNG)
        flight_id: ID do voo (para seeding do mock)
        
    Returns:
        Dict contendo:
        - cattle_count: Número de gado detectado no frame
        - confidence_avg: Confiança média das detecções
    """
    global _model
    
    if _model is None:
        logger.warning("Modelo não foi carregado. Carregando agora...")
        load_model()
    
    try:
        # Decodifica bytes em imagem OpenCV
        nparr = np.frombuffer(frame_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            logger.error("Erro ao decodificar frame do stream")
            return {
                "cattle_count": 0,
                "confidence_avg": 0.0,
                "error": "Invalid frame bytes",
            }
        
        if isinstance(_model, dict) and _model.get("type") == "mock":
            return _run_inference_frame_mock(frame, flight_id)
        else:
            return _run_inference_frame_yolo(frame)
            
    except Exception as e:
        logger.error(f"Erro na inferência do frame do stream: {e}")
        return {
            "cattle_count": 0,
            "confidence_avg": 0.0,
            "error": str(e),
        }


def _run_inference_frame_mock(frame: np.ndarray, flight_id: str) -> dict:
    """Mock de inferência para um frame individual (live stream)."""
    try:
        # Usa seed baseado no flight_id para reproducibilidade
        np.random.seed(hash(flight_id) % (2**32))
        
        cattle_count = np.random.randint(0, 15)  # 0-15 para frames individuais
        
        if cattle_count == 0:
            confidence_avg = 0.0
        else:
            confidence_scores = np.random.uniform(0.70, 0.98, cattle_count)
            confidence_avg = float(np.mean(confidence_scores))
        
        return {
            "cattle_count": cattle_count,
            "confidence_avg": confidence_avg,
        }
        
    except Exception as e:
        logger.error(f"Erro na mock de frame do stream: {e}")
        return {
            "cattle_count": 0,
            "confidence_avg": 0.0,
            "error": str(e),
        }


def _run_inference_frame_yolo(frame: np.ndarray) -> dict:
    """YOLO real de inferência para um frame individual (live stream)."""
    try:
        # Roda o modelo YOLO
        results = _model(frame)
        
        cattle_count = 0
        confidence_scores = []
        
        # Extrai detecções
        for result in results:
            boxes = result.boxes
            cattle_count = len(boxes)
            
            for box in boxes:
                conf = float(box.conf[0])
                confidence_scores.append(conf)
        
        confidence_avg = float(np.mean(confidence_scores)) if confidence_scores else 0.0
        
        return {
            "cattle_count": cattle_count,
            "confidence_avg": confidence_avg,
        }
        
    except Exception as e:
        logger.error(f"Erro na YOLO de frame do stream: {e}")
        return {
            "cattle_count": 0,
            "confidence_avg": 0.0,
            "error": str(e),
        }


