import uuid
from datetime import datetime

from sqlmodel import Field, SQLModel


class Farm(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    name: str
    owner_id: str = Field(index=True)
    total_area: float = Field(default=0.0)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Pasture(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    farm_id: str = Field(index=True)
    name: str
    expected_count: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
