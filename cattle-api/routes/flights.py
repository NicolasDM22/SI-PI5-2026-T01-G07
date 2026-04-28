from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from database import get_session
from models.flight import Flight

router = APIRouter()


@router.get("/")
def list_flights(farmId: Optional[str] = None, session: Session = Depends(get_session)):
    ...


@router.get("/{flight_id}")
def get_flight(flight_id: str, session: Session = Depends(get_session)):
    ...


@router.delete("/{flight_id}")
def delete_flight(flight_id: str, session: Session = Depends(get_session)):
    ...
