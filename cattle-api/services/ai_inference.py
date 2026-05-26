import base64
import logging
import warnings
from pathlib import Path

import cv2
import numpy as np

warnings.filterwarnings("ignore")

logger = logging.getLogger(__name__)

_model = None
_MODEL_PATH = Path(__file__).resolve().parent.parent.parent / "yolov8n.pt"
_CATTLE_CLASS_IDS = {18, 19}
_CONFIDENCE = 0.05


def _get_model():
    global _model
    if _model is not None:
        return _model
    try:
        import torch

        _original_load = torch.load

        def _patched_load(*args, **kwargs):
            kwargs["weights_only"] = False
            return _original_load(*args, **kwargs)

        torch.load = _patched_load
        from ultralytics import YOLO

        _model = YOLO(str(_MODEL_PATH))
        torch.load = _original_load
        logger.info(f"Modelo YOLOv8 carregado: {_MODEL_PATH}")
    except Exception as e:
        logger.error(f"Falha ao carregar modelo YOLO: {e}")
        raise
    return _model


def _draw_boxes(img, results):
    count = 0
    for result in results:
        for box in result.boxes:
            if int(box.cls[0]) not in _CATTLE_CLASS_IDS:
                continue
            count += 1
            conf = float(box.conf[0])
            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(img, f"Gado {conf:.2f}", (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
    cv2.putText(img, f"Gado: {count}", (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
    return count


def run_inference(frame_path: str) -> dict:
    """Executa detecção YOLO no frame e retorna contagem + imagem anotada em base64."""
    try:
        model = _get_model()
        results = model(frame_path, conf=_CONFIDENCE, verbose=False)
        img = cv2.imread(frame_path)
        count = _draw_boxes(img, results)
        _, buf = cv2.imencode(".jpg", img)
        annotated_b64 = base64.b64encode(buf).decode("utf-8")
        return {"count": count, "annotatedImageB64": annotated_b64}
    except Exception as e:
        logger.error(f"Erro na inferência ({frame_path}): {e}")
        return {"count": 0, "annotatedImageB64": None}


def run_inference_batch(frame_paths: list[str], flight_id: str = None) -> dict:
    """Roda YOLO em batch em todos os frames e retorna o max count e imagem anotada."""
    try:
        model = _get_model()
        results = model(frame_paths, conf=_CONFIDENCE, verbose=False)
        max_count = 0
        max_idx = 0
        frame_results = []

        for i, result in enumerate(results):
            count = sum(1 for box in result.boxes if int(box.cls[0]) in _CATTLE_CLASS_IDS)
            detections = [
                {"bbox": box.xyxy[0].tolist(), "conf": float(box.conf[0]), "class": int(box.cls[0])}
                for box in result.boxes if int(box.cls[0]) in _CATTLE_CLASS_IDS
            ]
            frame_results.append({"frame_path": frame_paths[i], "count": count, "detections": detections})
            if count > max_count:
                max_count = count
                max_idx = i

        annotated_image_path = None
        if frame_results:
            best_frame = frame_paths[max_idx]
            img = cv2.imread(best_frame)
            if img is not None:
                _draw_boxes(img, [results[max_idx]])
                annotated_path = Path(best_frame).parent / "annotated_max_count.jpg"
                cv2.imwrite(str(annotated_path), img)
                annotated_image_path = str(annotated_path)

        return {"max_count": max_count, "frame_results": frame_results, "annotated_image_path": annotated_image_path}
    except Exception as e:
        logger.error(f"Erro na inferência batch: {e}")
        return {"max_count": 0, "frame_results": [], "annotated_image_path": None}


def run_inference_frame(frame_bytes: bytes, flight_id: str) -> dict:
    """Executa detecção YOLO em bytes de frame (live stream)."""
    try:
        model = _get_model()
        nparr = np.frombuffer(frame_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        results = model(img, conf=_CONFIDENCE, verbose=False)
        count = 0
        total_conf = 0.0
        for result in results:
            for box in result.boxes:
                if int(box.cls[0]) in _CATTLE_CLASS_IDS:
                    count += 1
                    total_conf += float(box.conf[0])
        return {"cattle_count": count, "confidence_avg": total_conf / count if count > 0 else 0.0}
    except Exception as e:
        logger.error(f"Erro na inferência ao vivo (voo {flight_id}): {e}")
        return {"cattle_count": 0, "confidence_avg": 0.0}
