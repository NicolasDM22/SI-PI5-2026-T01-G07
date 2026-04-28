import os
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile
from sqlmodel import Session

from database import get_session
from models.flight import Flight
from services.processor import process_video

router = APIRouter()

ALLOWED_TYPES = ["video/mp4", "video/quicktime", "video/x-msvideo"]
MAX_SIZE_BYTES = 500 * 1024 * 1024  # 500MB
VIDEOS_DIR = "outputs/videos"


@router.post("/flights/upload")
async def upload_flight(
    background_tasks: BackgroundTasks,
    video: UploadFile = File(...),
    pastureId: str = Form(...),
    farmId: str = Form(...),
    flightDate: str = Form(...),
    altitudeEstimated: Optional[float] = Form(None),
    notes: Optional[str] = Form(None),
    session: Session = Depends(get_session),
):
    if video.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Formato de arquivo não suportado. Envie um arquivo mp4, mov ou avi.",
        )

    contents = await video.read()

    if len(contents) > MAX_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail="Arquivo muito grande. O tamanho máximo permitido é 500MB.",
        )

    flight_id = str(uuid.uuid4())
    os.makedirs(VIDEOS_DIR, exist_ok=True)
    video_path = f"{VIDEOS_DIR}/{flight_id}.mp4"

    with open(video_path, "wb") as f:
        f.write(contents)

    flight = Flight(
        id=flight_id,
        pasture_id=pastureId,
        farm_id=farmId,
        start_ts=datetime.fromisoformat(flightDate),
        altitude_estimated=altitudeEstimated,
        notes=notes,
        status="processing",
        source="upload",
        video_path=video_path,
    )
    session.add(flight)
    session.commit()

    background_tasks.add_task(process_video, flight_id)

    return {"flightId": flight_id}
