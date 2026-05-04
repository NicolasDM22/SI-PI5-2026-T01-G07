import io
import logging
import os
from pathlib import Path

import cv2
import numpy as np
from ultralytics import YOLO

logger = logging.getLogger(__name__)

# Caminho do modelo: var de ambiente MODEL_PATH ou padrão relativo ao projeto
_DEFAULT_MODEL = Path(__file__).parent.parent.parent / "runs" / "detect" / "train4" / "weights" / "best.pt"
MODEL_PATH = os.getenv("MODEL_PATH", str(_DEFAULT_MODEL))

# Parâmetros de inferência (ajustáveis via env)
CONF_THRESHOLD = float(os.getenv("YOLO_CONF", "0.30"))
IOU_THRESHOLD = float(os.getenv("YOLO_IOU", "0.45"))
IMG_SIZE = int(os.getenv("YOLO_IMGSZ", "640"))

_model: YOLO | None = None


def _get_model() -> YOLO:
    global _model
    if _model is None:
        logger.info(f"Carregando modelo YOLO: {MODEL_PATH}")
        _model = YOLO(MODEL_PATH)
    return _model


def _parse_results(results) -> dict:
    """Extrai contagem e detecções de um resultado YOLO."""
    detections = []
    confidences = []

    boxes = results[0].boxes
    if boxes is not None and len(boxes) > 0:
        for box in boxes:
            conf = float(box.conf[0])
            xyxy = box.xyxy[0].tolist()
            detections.append({"bbox": xyxy, "confidence": round(conf, 4)})
            confidences.append(conf)

    return {
        "count": len(detections),
        "confidence_avg": round(sum(confidences) / len(confidences), 4) if confidences else 0.0,
        "detections": detections,
    }


def run_inference(frame_path: str) -> dict:
    """Executa detecção YOLO no frame e retorna as detecções.

    Returns dict with keys: frame_path, count, confidence_avg, detections
    """
    try:
        model = _get_model()
        results = model.predict(
            source=frame_path,
            conf=CONF_THRESHOLD,
            iou=IOU_THRESHOLD,
            imgsz=IMG_SIZE,
            verbose=False,
        )
        parsed = _parse_results(results)
        parsed["frame_path"] = frame_path
        logger.debug(f"Frame {frame_path}: {parsed['count']} animais detectados")
        return parsed
    except Exception as e:
        logger.error(f"Erro na inferência do frame {frame_path}: {e}")
        return {"frame_path": frame_path, "count": 0, "confidence_avg": 0.0, "detections": []}


def run_inference_frame(frame_bytes: bytes, flight_id: str) -> dict:
    """Executa detecção YOLO em um frame raw (live stream) e retorna a contagem.

    Returns dict with keys: cattle_count, confidence_avg
    """
    try:
        arr = np.frombuffer(frame_bytes, dtype=np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if img is None:
            logger.warning(f"[{flight_id}] Frame inválido — não foi possível decodificar imagem")
            return {"cattle_count": 0, "confidence_avg": 0.0}

        model = _get_model()
        results = model.predict(
            source=img,
            conf=CONF_THRESHOLD,
            iou=IOU_THRESHOLD,
            imgsz=IMG_SIZE,
            verbose=False,
        )
        parsed = _parse_results(results)
        logger.debug(f"[{flight_id}] Live frame: {parsed['count']} animais detectados")
        return {"cattle_count": parsed["count"], "confidence_avg": parsed["confidence_avg"]}
    except Exception as e:
        logger.error(f"[{flight_id}] Erro na inferência do frame live: {e}")
        return {"cattle_count": 0, "confidence_avg": 0.0}
