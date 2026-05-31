import os

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlmodel import Session, select

from auth_utils import get_current_user
from database import get_session
from models.alert import Alert
from models.user import User

router = APIRouter()

_API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")


def _serialize(a: Alert) -> dict:
    return {
        "id": a.id,
        "flightId": a.flight_id,
        "farmId": a.farm_id,
        "pastureId": a.pasture_id,
        "pastureName": a.pasture_name,
        "detectedCount": a.detected_count,
        "expectedCount": a.expected_count,
        "diff": a.diff,
        "severity": a.severity,
        "description": a.description,
        "imageUrl": f"{_API_BASE_URL}/alerts/{a.id}/image" if a.frame_path else None,
        "seen": a.seen,
        "createdAt": a.created_at.isoformat(),
    }


@router.get("/")
def list_alerts(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    query = (
        select(Alert)
        .where(Alert.farm_id == current_user.farm_id)
        .order_by(Alert.created_at.desc())
    )
    return [_serialize(a) for a in session.exec(query).all()]


@router.get("/unseen-count")
def unseen_count(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    alerts = session.exec(
        select(Alert).where(
            Alert.farm_id == current_user.farm_id,
            Alert.seen == False,  # noqa: E712
        )
    ).all()
    return {"count": len(alerts)}


@router.get("/{alert_id}/image")
def get_alert_image(alert_id: str, session: Session = Depends(get_session)):
    alert = session.get(Alert, alert_id)
    if not alert or not alert.frame_path:
        raise HTTPException(status_code=404, detail="Imagem não disponível")
    return FileResponse(alert.frame_path, media_type="image/jpeg")


@router.get("/{alert_id}")
def get_alert(
    alert_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    alert = session.get(Alert, alert_id)
    if not alert or alert.farm_id != current_user.farm_id:
        raise HTTPException(status_code=404, detail="Alerta não encontrado")
    return _serialize(alert)


@router.patch("/{alert_id}/seen")
def mark_seen(
    alert_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    alert = session.get(Alert, alert_id)
    if not alert or alert.farm_id != current_user.farm_id:
        raise HTTPException(status_code=404, detail="Alerta não encontrado")
    alert.seen = True
    session.add(alert)
    session.commit()
    return {"ok": True}
