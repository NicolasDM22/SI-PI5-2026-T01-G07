from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlmodel import Session, select

from auth_utils import get_current_user
from database import get_session
from models.farm import Farm, Pasture
from models.user import User

router = APIRouter()


class PastureCreate(BaseModel):
    name: str
    expected_count: int = Field(..., gt=0, description="Quantidade de animais esperados (deve ser maior que zero)")


class PastureUpdate(BaseModel):
    name: Optional[str] = None
    expected_count: Optional[int] = Field(None, gt=0)


def _pasture_response(p: Pasture) -> dict:
    return {"id": p.id, "farmId": p.farm_id, "name": p.name, "expectedCount": p.expected_count}


@router.get("/mine")
def get_my_farm(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if not current_user.farm_id:
        raise HTTPException(status_code=404, detail="Fazenda não encontrada")
    farm = session.get(Farm, current_user.farm_id)
    if not farm:
        raise HTTPException(status_code=404, detail="Fazenda não encontrada")
    pastures = session.exec(select(Pasture).where(Pasture.farm_id == farm.id)).all()
    total_animals = sum(p.expected_count for p in pastures)
    return {
        "id": farm.id,
        "name": farm.name,
        "ownerId": farm.owner_id,
        "totalArea": farm.total_area,
        "totalAnimals": total_animals,
    }


@router.get("/{farm_id}/pastures")
def get_pastures(
    farm_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if current_user.farm_id != farm_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso negado")
    pastures = session.exec(select(Pasture).where(Pasture.farm_id == farm_id)).all()
    return [_pasture_response(p) for p in pastures]


@router.post("/{farm_id}/pastures", status_code=status.HTTP_201_CREATED)
def create_pasture(
    farm_id: str,
    body: PastureCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if current_user.farm_id != farm_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso negado")
    pasture = Pasture(farm_id=farm_id, name=body.name, expected_count=body.expected_count)
    session.add(pasture)
    session.commit()
    session.refresh(pasture)
    return _pasture_response(pasture)


@router.put("/{farm_id}/pastures/{pasture_id}")
def update_pasture(
    farm_id: str,
    pasture_id: str,
    body: PastureUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if current_user.farm_id != farm_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso negado")
    pasture = session.get(Pasture, pasture_id)
    if not pasture or pasture.farm_id != farm_id:
        raise HTTPException(status_code=404, detail="Pasto não encontrado")
    if body.name is not None:
        pasture.name = body.name
    if body.expected_count is not None:
        pasture.expected_count = body.expected_count
    session.add(pasture)
    session.commit()
    session.refresh(pasture)
    return _pasture_response(pasture)


@router.delete("/{farm_id}/pastures/{pasture_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_pasture(
    farm_id: str,
    pasture_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if current_user.farm_id != farm_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso negado")
    pasture = session.get(Pasture, pasture_id)
    if not pasture or pasture.farm_id != farm_id:
        raise HTTPException(status_code=404, detail="Pasto não encontrado")
    session.delete(pasture)
    session.commit()
