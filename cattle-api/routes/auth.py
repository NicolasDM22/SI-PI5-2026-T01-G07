from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session, select

from auth_utils import create_access_token, hash_password, verify_password
from database import get_session
from models.farm import Farm, Pasture
from models.user import User

router = APIRouter()


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    farm_name: str


def _user_response(user: User) -> dict:
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "farmId": user.farm_id,
    }


@router.post("/login")
def login(body: LoginRequest, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == body.email)).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciais inválidas")
    token = create_access_token(user.id)
    return {"token": token, "user": _user_response(user)}


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest, session: Session = Depends(get_session)):
    existing = session.exec(select(User).where(User.email == body.email)).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="E-mail já cadastrado")

    farm = Farm(name=body.farm_name, owner_id="placeholder")
    session.add(farm)

    user = User(
        name=body.name,
        email=body.email,
        password_hash=hash_password(body.password),
        role="manager",
        farm_id=farm.id,
    )
    session.add(user)

    farm.owner_id = user.id

    session.commit()
    session.refresh(user)

    token = create_access_token(user.id)
    return {"token": token, "user": _user_response(user)}
