from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/login")
def login(body: LoginRequest):
    return {
        "token": "local-dev-token",
        "user": {
            "id": "user-001",
            "name": "Operador Demo",
            "email": body.email,
            "role": "operator",
            "farmId": "farm-local",
        },
    }
