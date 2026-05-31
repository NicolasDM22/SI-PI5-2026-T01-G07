import logging
import os
import shutil
from pathlib import Path

import cv2

logger = logging.getLogger(__name__)


def extract_frames(video_path: str, flight_id: str) -> list[str]:
    """
    Extrai frames de um vídeo (1 frame por segundo) usando OpenCV.

    Args:
        video_path: Caminho para o arquivo de vídeo
        flight_id: ID do voo (usado como nome do subdiretório de saída)

    Returns:
        Lista com caminhos absolutos dos frames extraídos

    Raises:
        FileNotFoundError: Se o arquivo de vídeo não existir
        ValueError: Se não conseguir abrir o vídeo ou nenhum frame for extraído
    """
    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Arquivo de vídeo não encontrado: {video_path}")

    output_dir = os.path.join("outputs", "frames", flight_id)
    Path(output_dir).mkdir(parents=True, exist_ok=True)

    try:
        video = cv2.VideoCapture(video_path)

        if not video.isOpened():
            raise ValueError(f"Não foi possível abrir o vídeo: {video_path}")

        fps = video.get(cv2.CAP_PROP_FPS)
        if fps <= 0:
            fps = 30

        frame_interval = int(fps)
        extracted_frames = []
        frame_count = 0
        frame_index = 0

        logger.info(f"Iniciando extração: {video_path} (FPS: {fps})")

        while True:
            ret, frame = video.read()
            if not ret:
                break

            if frame_count % frame_interval == 0:
                frame_index += 1
                filename = f"frame_{frame_index:03d}.jpg"
                filepath = os.path.join(output_dir, filename)

                if cv2.imwrite(filepath, frame):
                    extracted_frames.append(filepath)
                    logger.debug(f"Frame salvo: {filename}")
                else:
                    logger.error(f"Falha ao salvar frame: {filepath}")

            frame_count += 1

        video.release()
        logger.info(f"Extração concluída. Frames: {len(extracted_frames)}")

        if not extracted_frames:
            raise ValueError("Nenhum frame foi extraído do vídeo")

        return extracted_frames

    except Exception as e:
        logger.error(f"Erro na extração de frames: {e}")
        cleanup_frames(flight_id)
        raise


def get_video_duration(video_path: str) -> float:
    """Retorna a duração do vídeo em segundos usando OpenCV."""
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = cap.get(cv2.CAP_PROP_FRAME_COUNT)
    cap.release()
    if fps > 0 and total_frames > 0:
        return total_frames / fps
    return 0.0


def cleanup_frames(flight_id: str) -> None:
    """Remove os frames de um voo do disco."""
    frames_dir = os.path.join("outputs", "frames", flight_id)
    try:
        if os.path.exists(frames_dir):
            shutil.rmtree(frames_dir)
            logger.info(f"Frames do voo '{flight_id}' removidos")
        else:
            logger.warning(f"Diretório não encontrado: {frames_dir}")
    except Exception as e:
        logger.error(f"Erro ao limpar frames do voo '{flight_id}': {e}")
