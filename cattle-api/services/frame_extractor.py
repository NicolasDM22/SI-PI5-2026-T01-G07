import cv2
import os
import logging
import shutil
from pathlib import Path

logger = logging.getLogger(__name__)


def extract_frames(video_path: str, job_id: str) -> list[str]:
    """
    Extrai frames de um vídeo (1 frame por segundo) usando OpenCV.
    
    Args:
        video_path: Caminho para o arquivo de vídeo
        job_id: ID único para o job (usado como nome do diretório)
    
    Returns:
        Lista com caminhos absolutos dos frames extraídos
    
    Raises:
        FileNotFoundError: Se o arquivo de vídeo não existir
        ValueError: Se não conseguir ler o vídeo ou extrair frames
    """
    
    # Validar arquivo de vídeo
    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Arquivo de vídeo não encontrado: {video_path}")
    
    # Criar diretório para frames
    output_dir = os.path.join("outputs", "frames", job_id)
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    
    try:
        # Abrir vídeo
        video = cv2.VideoCapture(video_path)
        
        if not video.isOpened():
            raise ValueError(f"Não foi possível abrir o vídeo: {video_path}")
        
        # Obter FPS (frames por segundo)
        fps = video.get(cv2.CAP_PROP_FPS)
        if fps <= 0:
            fps = 30  # Valor padrão se não conseguir detectar
        
        # Calcular intervalo de frames (1 frame por segundo)
        frame_interval = int(fps)
        
        extracted_frames = []
        frame_count = 0
        frame_index = 0
        
        logger.info(f"Iniciando extração de frames do vídeo: {video_path} (FPS: {fps})")
        
        while True:
            ret, frame = video.read()
            
            if not ret:
                break
            
            # Extrair 1 frame por segundo
            if frame_count % frame_interval == 0:
                frame_index += 1
                filename = f"frame_{frame_index:03d}.jpg"
                filepath = os.path.join(output_dir, filename)
                
                # Salvar frame
                success = cv2.imwrite(filepath, frame)
                
                if success:
                    extracted_frames.append(filepath)
                    logger.debug(f"Frame '{filename}' salvo com sucesso")
                else:
                    logger.error(f"Erro ao salvar frame: {filepath}")
            
            frame_count += 1
        
        video.release()
        
        logger.info(f"Extração concluída. Total de frames: {len(extracted_frames)}")
        
        if not extracted_frames:
            raise ValueError("Nenhum frame foi extraído do vídeo")
        
        return extracted_frames
    
    except Exception as e:
        logger.error(f"Erro durante extração de frames: {str(e)}")
        # Limpar diretório em caso de erro
        cleanup_frames(job_id)
        raise


def cleanup_frames(job_id: str) -> None:
    """
    Remove os frames extraídos para evitar consumo excessivo de disco.
    
    Args:
        job_id: ID do job cujos frames devem ser deletados
    """
    frames_dir = os.path.join("outputs", "frames", job_id)
    
    try:
        if os.path.exists(frames_dir):
            shutil.rmtree(frames_dir)
            logger.info(f"Frames do job '{job_id}' removidos com sucesso")
        else:
            logger.warning(f"Diretório de frames não encontrado: {frames_dir}")
    
    except Exception as e:
        logger.error(f"Erro ao limpar frames do job '{job_id}': {str(e)}")
