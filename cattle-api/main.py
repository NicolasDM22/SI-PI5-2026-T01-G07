from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from database import init_db
from routes import alerts, auth, farms, flights, stream, upload


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="Cattle Monitor API",
    description="API de monitoramento de rebanho bovino via drone com IA.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(alerts.router, prefix="/alerts", tags=["alerts"])
app.include_router(farms.router, prefix="/farms", tags=["farms"])
# upload antes de flights para evitar que "upload" seja capturado como {flight_id}
app.include_router(upload.router, tags=["upload"])
app.include_router(flights.router, prefix="/flights", tags=["flights"])
app.include_router(stream.router, prefix="/stream", tags=["stream"])


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok"}
