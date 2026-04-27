from contextlib import asynccontextmanager

from fastapi import FastAPI

from database import create_db_and_tables
from routes import jobs, stream, upload


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield


app = FastAPI(
    title="Cattle Monitor API",
    description="API de monitoramento de rebanho bovino via drone com IA.",
    version="0.1.0",
    lifespan=lifespan,
)

app.include_router(upload.router, prefix="/upload", tags=["upload"])
app.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
app.include_router(stream.router, prefix="/stream", tags=["stream"])


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok"}
