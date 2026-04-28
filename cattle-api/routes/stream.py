from fastapi import APIRouter, WebSocket

router = APIRouter()


@router.websocket("/ws/{flight_id}")
async def stream_flight(websocket: WebSocket, flight_id: str):
    ...
