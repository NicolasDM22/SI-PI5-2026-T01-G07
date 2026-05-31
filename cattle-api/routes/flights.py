import os
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlmodel import Session, select

from database import get_session
from models.alert import Alert
from models.flight import Flight
from services.ai_inference import run_inference, run_inference_batch
from services.report_generator import generate_report

router = APIRouter()

_FRAMES_DIR = Path("outputs") / "frames"


def _serialize(flight: Flight) -> dict:
    return {
        "id": flight.id,
        "name": flight.name,
        "pastureId": flight.pasture_id,
        "pastureName": flight.pasture_name,
        "farmId": flight.farm_id,
        "operatorId": flight.operator_id,
        "startTs": flight.start_ts.isoformat() if flight.start_ts else None,
        "endTs": flight.end_ts.isoformat() if flight.end_ts else None,
        "altitudeEstimated": flight.altitude_estimated,
        "status": flight.status,
        "detectedCount": flight.detected_count,
        "expectedCount": flight.expected_count,
        "alertsCount": flight.alerts_count,
        "notes": flight.notes,
        "source": flight.source,
        "aiSyncStatus": flight.ai_sync_status,
        "frameCount": flight.frame_count,
    }


@router.get("/")
def list_flights(farmId: Optional[str] = None, pastureId: Optional[str] = None, session: Session = Depends(get_session)):
    query = select(Flight).order_by(Flight.created_at.desc())
    if farmId:
        query = query.where(Flight.farm_id == farmId)
    if pastureId:
        query = query.where(Flight.pasture_id == pastureId)
    return [_serialize(f) for f in session.exec(query).all()]


@router.get("/{flight_id}/report")
def get_flight_report(flight_id: str, session: Session = Depends(get_session)):
    flight = session.get(Flight, flight_id)
    if not flight:
        raise HTTPException(status_code=404, detail="Voo não encontrado.")
    if not flight.report_path:
        raise HTTPException(status_code=404, detail="Relatório ainda não disponível.")
    if not os.path.exists(flight.report_path):
        raise HTTPException(status_code=404, detail="Arquivo do relatório não encontrado no servidor.")
    return FileResponse(path=flight.report_path, media_type="application/pdf", filename=f"relatorio_{flight_id}.pdf")


@router.get("/{flight_id}/frames")
def list_frames(flight_id: str, session: Session = Depends(get_session)):
    flight = session.get(Flight, flight_id)
    if not flight:
        raise HTTPException(status_code=404, detail="Voo não encontrado.")
    frames_path = _FRAMES_DIR / flight_id
    if not frames_path.exists():
        return []
    frames = sorted(frames_path.glob("frame_*.jpg"))
    return [{"name": f.name, "index": i + 1} for i, f in enumerate(frames)]


@router.get("/{flight_id}/frames/{frame_name}")
def get_frame_image(flight_id: str, frame_name: str):
    frame_path = _FRAMES_DIR / flight_id / frame_name
    if not frame_path.exists():
        raise HTTPException(status_code=404, detail="Frame não encontrado.")
    return FileResponse(path=str(frame_path), media_type="image/jpeg")


@router.post("/{flight_id}/analyze")
def analyze_flight(flight_id: str, session: Session = Depends(get_session)):
    flight = session.get(Flight, flight_id)
    if not flight:
        raise HTTPException(status_code=404, detail="Voo não encontrado.")
    frames_path = _FRAMES_DIR / flight_id
    frame_files = sorted(str(p) for p in frames_path.glob("frame_*.jpg"))
    if not frame_files:
        raise HTTPException(status_code=404, detail="Nenhum frame disponível para análise.")

    result = run_inference_batch(frame_files, flight_id=flight_id)
    flight.detected_count = result["max_count"]
    flight.status = "completed"

    if flight.expected_count is not None:
        diff = flight.detected_count - flight.expected_count
        abs_diff = abs(diff)
        if abs_diff > 0:
            severity = "critical" if abs_diff >= 5 else "warning"
            direction = "abaixo" if diff < 0 else "acima"
            description = (
                f"Contagem {direction} do esperado: "
                f"{flight.detected_count} detectados, {flight.expected_count} esperados "
                f"(diferença de {abs_diff} animal{'is' if abs_diff > 1 else ''})."
            )
            alert = Alert(
                flight_id=flight.id,
                farm_id=flight.farm_id,
                pasture_id=flight.pasture_id,
                pasture_name=flight.pasture_name,
                detected_count=flight.detected_count,
                expected_count=flight.expected_count,
                diff=diff,
                severity=severity,
                description=description,
                frame_path=result.get("annotated_image_path"),
            )
            session.add(alert)
            flight.alerts_count = (flight.alerts_count or 0) + 1

    session.add(flight)
    session.commit()
    session.refresh(flight)

    frame_results = result.get("frame_results", [])
    if result.get("annotated_image_path"):
        frame_results = [{"annotated_image_path": result["annotated_image_path"]}] + frame_results

    report_path = generate_report(flight_id, frame_results)

    return {
        "detectedCount": result["max_count"],
        "reportPath": report_path,
        "annotatedImagePath": result.get("annotated_image_path"),
    }


@router.post("/{flight_id}/frames/{frame_name}/detect")
def detect_frame(flight_id: str, frame_name: str, session: Session = Depends(get_session)):
    if not session.get(Flight, flight_id):
        raise HTTPException(status_code=404, detail="Voo não encontrado.")
    frame_path = _FRAMES_DIR / flight_id / frame_name
    if not frame_path.exists():
        raise HTTPException(status_code=404, detail="Frame não encontrado.")
    result = run_inference(str(frame_path))
    return {"count": result.get("count", 0), "annotatedImageB64": result.get("annotatedImageB64")}


@router.get("/{flight_id}")
def get_flight(flight_id: str, session: Session = Depends(get_session)):
    flight = session.get(Flight, flight_id)
    if not flight:
        raise HTTPException(status_code=404, detail="Voo não encontrado.")
    return _serialize(flight)
