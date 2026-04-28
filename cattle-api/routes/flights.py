import os
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlmodel import Session, select

from database import get_session
from models.flight import Flight

router = APIRouter()


def _serialize(flight: Flight) -> dict:
    return {
        "id": flight.id,
        "pastureId": flight.pasture_id,
        "pastureName": flight.pasture_name,
        "farmId": flight.farm_id,
        "operatorId": flight.operator_id,
        "startTs": flight.start_ts,
        "endTs": flight.end_ts,
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
        raise HTTPException(
            status_code=404,
            detail="Relatório ainda não disponível. O voo pode estar em processamento.",
        )
    if not os.path.exists(flight.report_path):
        raise HTTPException(status_code=404, detail="Arquivo do relatório não encontrado no servidor.")
    return FileResponse(
        path=flight.report_path,
        media_type="application/pdf",
        filename=f"relatorio_{flight_id}.pdf",
    )


@router.get("/{flight_id}")
def get_flight(flight_id: str, session: Session = Depends(get_session)):
    flight = session.get(Flight, flight_id)
    if not flight:
        raise HTTPException(status_code=404, detail="Voo não encontrado.")
    return _serialize(flight)
