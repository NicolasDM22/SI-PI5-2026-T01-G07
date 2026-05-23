from sqlmodel import SQLModel, Session, create_engine

import models.flight  # noqa: F401 — registra o model no metadata

DATABASE_URL = "sqlite:///./database.db"

engine = create_engine(DATABASE_URL, echo=False, connect_args={"check_same_thread": False})


_MIGRATIONS = [
    "ALTER TABLE flight ADD COLUMN name TEXT",
]


def init_db() -> None:
    SQLModel.metadata.create_all(engine)
    _run_migrations()


def _run_migrations() -> None:
    with engine.connect() as conn:
        for sql in _MIGRATIONS:
            try:
                conn.execute(__import__("sqlalchemy").text(sql))
                conn.commit()
            except Exception:
                pass  # coluna já existe


def get_session():
    with Session(engine) as session:
        yield session
