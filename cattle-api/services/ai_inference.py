from __future__ import annotations

import logging
import os
import tempfile
from pathlib import Path
from typing import Dict, List, Optional

import torch
import warnings

warnings.filterwarnings("ignore")

_original_torch_load = torch.load


def _patched_torch_load(*args, **kwargs):
    kwargs["weights_only"] = False
    return _original_torch_load(*args, **kwargs)


torch.load = _patched_torch_load

from ultralytics import YOLO  # noqa: E402
import cv2  # noqa: E402

logger = logging.getLogger(__name__)

_MODEL_PATH = Path(__file__).resolve().parents[2] / "yolov8n.pt"
_CATTLE_CLASSES = {18, 19}  # COCO: 18=sheep, 19=cow
_CONFIDENCE = 0.25

_model: Optional[YOLO] = None


def _get_model() -> YOLO:
    global _model
    if _model is None:
        logger.info(f"Carregando modelo YOLO: {_MODEL_PATH}")
        _model = YOLO(str(_MODEL_PATH))
    return _model


def run_inference(frame_path: str) -> Dict:
    """Executa detecção YOLO no frame e retorna as detecções."""
    model = _get_model()
    results = model(frame_path, conf=_CONFIDENCE, verbose=False)

    detections: List[Dict] = []
    for result in results:
        for box in result.boxes:
            class_id = int(box.cls[0])
            if class_id not in _CATTLE_CLASSES:
                continue
            conf = float(box.conf[0])
            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            detections.append({"class_id": class_id, "confidence": conf, "bbox": [x1, y1, x2, y2]})

    logger.debug(f"{frame_path}: {len(detections)} animais detectados")
    return {"frame_path": frame_path, "count": len(detections), "detections": detections}


def run_inference_frame(frame_bytes: bytes, flight_id: str) -> Dict:
    """Executa detecção YOLO em um frame raw (live stream) e retorna a contagem.

    Returns dict with keys: cattle_count, confidence_avg
    """
    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
        tmp.write(frame_bytes)
        tmp_path = tmp.name

    try:
        result = run_inference(tmp_path)
        detections = result["detections"]
        confidence_avg = (
            sum(d["confidence"] for d in detections) / len(detections) if detections else 0.0
        )
        return {"cattle_count": result["count"], "confidence_avg": round(confidence_avg, 4)}
    finally:
        os.unlink(tmp_path)
