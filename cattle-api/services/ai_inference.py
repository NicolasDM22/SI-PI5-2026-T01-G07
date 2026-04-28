def run_inference(frame_path: str) -> dict:
    """Executa detecção YOLO no frame e retorna as detecções."""
    ...


def run_inference_frame(frame_bytes: bytes, flight_id: str) -> dict:
    """Executa detecção YOLO em um frame raw (live stream) e retorna a contagem.

    Returns dict with keys: cattle_count, confidence_avg
    """
    ...
