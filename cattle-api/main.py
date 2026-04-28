from contextlib import asynccontextmanager

from fastapi import FastAPI

from database import init_db
from routes import flights, stream, upload
from services.ai_inference import load_model


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    load_model()
    yield


app = FastAPI(
    title="Cattle Monitor API",
    description="API de monitoramento de rebanho bovino via drone com IA.",
    version="0.1.0",
    lifespan=lifespan,
)

# upload antes de flights para evitar que "upload" seja capturado como {flight_id}
app.include_router(upload.router, tags=["upload"])
app.include_router(flights.router, prefix="/flights", tags=["flights"])
app.include_router(stream.router, prefix="/stream", tags=["stream"])


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok"}
