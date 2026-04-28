import logging
from datetime import datetime

from sqlmodel import Session

from database import engine
from models.flight import Flight
from services.ai_inference import run_inference
from services.frame_extractor import cleanup_frames, extract_frames
from services.report_generator import generate_report

logger = logging.getLogger(__name__)


def process_video(flight_id: str) -> None:
    """Orquestra o pipeline completo: extração de frames → inferência → relatório → notificação."""
    with Session(engine) as session:
        flight = session.get(Flight, flight_id)
        if not flight:
            logger.error(f"Voo não encontrado: {flight_id}")
            return

        if not flight.video_path:
            logger.error(f"Voo sem vídeo: {flight_id}")
            _mark_failed(session, flight)
            return

        try:
            frames = extract_frames(flight.video_path, flight_id)

            # Executa inferência em todos os frames de uma vez
            inference_result = run_inference(frames, flight_id)
            
            if not inference_result:
                logger.error(f"Falha na inferência para o voo {flight_id}")
                _mark_failed(session, flight)
                cleanup_frames(flight_id)
                return

            detected_count = inference_result.get("cattle_count", 0)
            confidence_avg = inference_result.get("confidence_avg", 0.0)
            annotated_path = inference_result.get("annotated_image_path")

            # Gera relatório com os resultados da inferência
            report_data = {
                "cattle_count": detected_count,
                "confidence_avg": confidence_avg,
                "annotated_image_path": annotated_path,
            }
            report_path = generate_report(flight_id, report_data)

            flight.status = "completed"
            flight.frame_count = len(frames)
            flight.detected_count = detected_count
            flight.end_ts = datetime.utcnow()
            flight.report_path = report_path
            session.add(flight)
            session.commit()

            logger.info(
                f"Voo {flight_id} concluído: {detected_count} animais detectados em {len(frames)} frames "
                f"(confiança média: {confidence_avg:.2f})"
            )

        except Exception as e:
            logger.error(f"Erro ao processar voo {flight_id}: {e}")
            _mark_failed(session, flight)
            cleanup_frames(flight_id)


def _mark_failed(session: Session, flight: Flight) -> None:
    flight.status = "failed"
    flight.end_ts = datetime.utcnow()
    session.add(flight)
    session.commit()
