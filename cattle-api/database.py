from sqlmodel import SQLModel, Session, create_engine

import models.flight  # noqa: F401 — registra o model no metadata

DATABASE_URL = "sqlite:///./database.db"

engine = create_engine(DATABASE_URL, echo=False, connect_args={"check_same_thread": False})


def init_db() -> None:
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
