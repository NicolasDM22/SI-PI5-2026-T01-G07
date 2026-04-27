from sqlmodel import SQLModel, Session, create_engine

import models.job  # noqa: F401 — garante que o model é registrado no metadata

DATABASE_URL = "sqlite:///./database.db"

engine = create_engine(DATABASE_URL, echo=False)


def init_db() -> None:
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
