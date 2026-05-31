import uuid
from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class Alert(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    flight_id: str = Field(index=True)
    farm_id: Optional[str] = Field(default=None, index=True)
    pasture_id: str = Field(index=True)
    pasture_name: Optional[str] = Field(default=None)
    detected_count: int
    expected_count: int
    diff: int                           # detected - expected
    severity: str                       # "warning" | "critical"
    description: str
    frame_path: Optional[str] = Field(default=None)
    seen: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
