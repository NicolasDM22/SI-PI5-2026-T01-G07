from fastapi import APIRouter, WebSocket

router = APIRouter()


@router.websocket("/ws/{job_id}")
async def stream_job(websocket: WebSocket, job_id: int):
    ...
