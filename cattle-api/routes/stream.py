import base64
import logging
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from jose import JWTError, jwt
from sqlmodel import Session

from auth_utils import ALGORITHM, SECRET_KEY
from database import engine
from models.flight import Flight
from services.ai_inference import run_inference_frame
from services.notifier import check_and_send_alert

logger = logging.getLogger(__name__)
router = APIRouter()


def _decode_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None


@router.websocket("/ws/stream")
async def live_stream(websocket: WebSocket):
    token = websocket.query_params.get("token")
    operator_id = _decode_token(token) if token else None

    await websocket.accept()

    flight_id = str(uuid.uuid4())
    frame_index = 0
    max_detected = 0
    last_expected_count = None
    last_location = None
    last_pasture_id = None
    last_farm_id = None
    total_conf_sum = 0.0
    total_detection_count = 0

    with Session(engine) as session:
        flight = Flight(
            id=flight_id,
            pasture_id=flight_id,  # atualizado no disconnect quando pastureId chegar
            status="streaming",
            source="live",
            operator_id=operator_id,
        )
        session.add(flight)
        session.commit()

    await websocket.send_json({"flightId": flight_id})

    try:
        while True:
            data = await websocket.receive_json()

            frame_b64 = data.get("frame")
            if not frame_b64:
                await websocket.send_json({"error": "Frame inválido ou corrompido."})
                continue

            if data.get("expectedCount") is not None:
                last_expected_count = data["expectedCount"]
            if data.get("location") is not None:
                last_location = data["location"]
            if data.get("pastureId") is not None:
                last_pasture_id = data["pastureId"]
            if data.get("farmId") is not None:
                last_farm_id = data["farmId"]

            try:
                frame_bytes = base64.b64decode(frame_b64)
            except Exception:
                await websocket.send_json({"error": "Frame inválido ou corrompido."})
                continue

            result = run_inference_frame(frame_bytes, flight_id)
            cattle_count = result.get("cattle_count", 0) if result else 0
            if cattle_count > max_detected:
                max_detected = cattle_count
            if result and cattle_count > 0:
                total_conf_sum += result.get("confidence_avg", 0.0) * cattle_count
                total_detection_count += cattle_count

            frame_index += 1

            await websocket.send_json({
                "flightId": flight_id,
                "frameIndex": frame_index,
                "cattleCount": cattle_count,
                "timestamp": datetime.utcnow().isoformat(),
            })

    except WebSocketDisconnect:
        with Session(engine) as session:
            flight = session.get(Flight, flight_id)
            if flight:
                flight.status = "completed"
                flight.end_ts = datetime.utcnow()
                flight.frame_count = frame_index
                flight.detected_count = max_detected if max_detected > 0 else None
                flight.expected_count = last_expected_count
                flight.pasture_name = last_location
                if last_pasture_id:
                    flight.pasture_id = last_pasture_id
                if last_farm_id:
                    flight.farm_id = last_farm_id
                session.add(flight)
                session.commit()

            confidence_avg = total_conf_sum / total_detection_count if total_detection_count > 0 else 0.0
            check_and_send_alert(
                flight_id=flight_id,
                detected_count=max_detected if max_detected > 0 else None,
                expected_count=last_expected_count,
                confidence_avg=confidence_avg,
                operator_id=operator_id,
                session=session,
                pasture_name=last_location,
            )
