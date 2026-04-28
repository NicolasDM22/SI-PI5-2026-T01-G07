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

            results = []
            for frame in frames:
                result = run_inference(frame)
                if result:
                    results.append(result)

            detected_count = max((r.get("count", 0) for r in results), default=0) if results else None
            report_path = generate_report(flight_id, results)

            flight.status = "completed"
            flight.frame_count = len(frames)
            flight.detected_count = detected_count
            flight.end_ts = datetime.utcnow()
            flight.report_path = report_path
            session.add(flight)
            session.commit()

            logger.info(f"Voo {flight_id} concluído: {detected_count} animais detectados em {len(frames)} frames")

        except Exception as e:
            logger.error(f"Erro ao processar voo {flight_id}: {e}")
            _mark_failed(session, flight)
            cleanup_frames(flight_id)


def _mark_failed(session: Session, flight: Flight) -> None:
    flight.status = "failed"
    flight.end_ts = datetime.utcnow()
    session.add(flight)
    session.commit()
