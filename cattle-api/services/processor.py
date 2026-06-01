import logging
from datetime import datetime, timedelta, timezone

from sqlmodel import Session

from database import engine
from models.flight import Flight
from services.frame_extractor import cleanup_frames, extract_frames, get_video_duration

logger = logging.getLogger(__name__)


def process_video(flight_id: str) -> None:
    """Extrai frames do vídeo e marca o voo como pronto. Inferência é feita sob demanda."""
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
            duration_secs = get_video_duration(flight.video_path)
            frames = extract_frames(flight.video_path, flight_id)

            flight.status = "completed"
            flight.frame_count = len(frames)
            if duration_secs > 0 and flight.start_ts:
                flight.end_ts = flight.start_ts + timedelta(seconds=duration_secs)
            else:
                flight.end_ts = datetime.now(timezone.utc)
            session.add(flight)
            session.commit()

            logger.info(f"Voo {flight_id} pronto: {len(frames)} frames extraídos")

        except Exception as e:
            logger.error(f"Erro ao processar voo {flight_id}: {e}")
            _mark_failed(session, flight)
            cleanup_frames(flight_id)


def _mark_failed(session: Session, flight: Flight) -> None:
    flight.status = "failed"
    flight.end_ts = datetime.utcnow()
    session.add(flight)
    session.commit()
