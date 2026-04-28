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
    """
    logger.info(f"🔬 Executando inferência MOCK para {len(frame_paths)} frames (job_id: {job_id})")
    
    try:
        # Se não houver frames, retorna vazio
        if not frame_paths:
            logger.info("✅ Mock Inferência concluída: sem frames (cattle_count=0)")
            return {
                "cattle_count": 0,
                "annotated_image_path": None,
                "confidence_avg": 0.0,
            }
        
        # Simula detecções com números aleatórios
        np.random.seed(hash(job_id) % (2**32))  # Para reproducibilidade por job_id
        
        cattle_count = np.random.randint(5, 25)
        confidence_scores = np.random.uniform(0.75, 0.99, cattle_count)
        confidence_avg = float(np.mean(confidence_scores))
        
        # Lê o primeiro frame
        frame = cv2.imread(frame_paths[0])
        if frame is None:
            logger.warning(f"Não foi possível ler frame: {frame_paths[0]}")
            frame = np.zeros((720, 1280, 3), dtype=np.uint8)
        
        # Desenha retângulos aleatórios simulando detecções
        frame_annotated = frame.copy()
        for i in range(cattle_count):
            x = np.random.randint(50, frame_annotated.shape[1] - 150)
            y = np.random.randint(50, frame_annotated.shape[0] - 150)
            w = np.random.randint(80, 150)
            h = np.random.randint(80, 150)
            
            # Desenha retângulo verde
            cv2.rectangle(
                frame_annotated,
                (x, y),
                (x + w, y + h),
                (0, 255, 0),
                2
            )
            
            # Adiciona confiança no topo do retângulo
            label = f"Cattle {confidence_scores[i]:.2f}"
            cv2.putText(
                frame_annotated,
                label,
                (x, y - 5),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                (0, 255, 0),
                2
            )
        
        # Adiciona info no canto da imagem
        info_text = f"Mock Detection | Cattle: {cattle_count} | Avg Conf: {confidence_avg:.2f}"
        cv2.putText(
            frame_annotated,
            info_text,
            (10, 30),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (255, 255, 0),
            2
        )
        
        # Salva a imagem anotada
        annotated_path = os.path.join(output_dir, "annotated.jpg")
        cv2.imwrite(annotated_path, frame_annotated)
        logger.info(f"✅ Imagem anotada salva: {annotated_path}")
        
        result = {
            "cattle_count": cattle_count,
            "annotated_image_path": annotated_path,
            "confidence_avg": confidence_avg,
        }
        
        logger.info(
            f"🔬 Mock Inferência concluída: "
            f"cattle_count={cattle_count}, confidence_avg={confidence_avg:.2f}"
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Erro na inferência mock: {e}")
        return {
            "cattle_count": 0,
            "annotated_image_path": None,
            "confidence_avg": 0.0,
            "error": str(e),
        }


def _run_inference_yolo(
    frame_paths: list[str], job_id: str, output_dir: str
) -> dict:
    """
    Versão real da inferência usando o modelo YOLO.
    """
    logger.info(f"🤖 Executando inferência YOLO para {len(frame_paths)} frames (job_id: {job_id})")
    
    try:
        all_detections = []
        all_confidences = []
        frame_annotated = None
        
        # Processa cada frame
        for frame_path in frame_paths:
            if not os.path.exists(frame_path):
                logger.warning(f"Frame não encontrado: {frame_path}")
                continue
            
            frame = cv2.imread(frame_path)
            if frame is None:
                logger.warning(f"Erro ao ler frame: {frame_path}")
                continue
            
            # Roda o modelo YOLO
            results = _model(frame)
            
            # Extrai detecções
            for result in results:
                boxes = result.boxes
                
                for box in boxes:
                    # Verifica se é uma detecção de cattle (classe específica)
                    # YOLO retorna: xyxy (4), confidence (1), class (1)
                    conf = float(box.conf[0])
                    all_confidences.append(conf)
                    
                    # Desenha bounding box
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                    cv2.putText(
                        frame,
                        f"{conf:.2f}",
                        (x1, y1 - 5),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.5,
                        (0, 255, 0),
                        2
                    )
            
            # Guarda o último frame anotado
            frame_annotated = frame
            all_detections.append(len(boxes))
        
        # Calcula estatísticas
        cattle_count = sum(all_detections) if all_detections else 0
        confidence_avg = float(np.mean(all_confidences)) if all_confidences else 0.0
        
        # Salva a imagem anotada (usa o último frame processado)
        annotated_path = os.path.join(output_dir, "annotated.jpg")
        if frame_annotated is not None:
            cv2.imwrite(annotated_path, frame_annotated)
            logger.info(f"✅ Imagem anotada salva: {annotated_path}")
        else:
            annotated_path = None
            logger.warning("Nenhum frame foi processado")
        
        result = {
            "cattle_count": cattle_count,
            "annotated_image_path": annotated_path,
            "confidence_avg": confidence_avg,
        }
        
        logger.info(
            f"✅ YOLO Inferência concluída: "
            f"cattle_count={cattle_count}, confidence_avg={confidence_avg:.2f}"
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Erro na inferência YOLO: {e}")
        return {
            "cattle_count": 0,
            "annotated_image_path": None,
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


