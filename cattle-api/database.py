import os

from sqlalchemy import text
from sqlmodel import SQLModel, Session, create_engine

import models.flight  # noqa: F401
import models.user    # noqa: F401
import models.farm    # noqa: F401

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./cattle.db")

engine = create_engine(DATABASE_URL, echo=False, connect_args={"check_same_thread": False})


def init_db() -> None:
    SQLModel.metadata.create_all(engine)
    _run_migrations()


def _run_migrations() -> None:
    migrations = [
        "ALTER TABLE flight ADD COLUMN name TEXT",
    ]
    with engine.connect() as conn:
        for sql in migrations:
            try:
                conn.execute(text(sql))
                conn.commit()
            except Exception:
                pass  # coluna já existe


def get_session():
    with Session(engine) as session:
        yield session
