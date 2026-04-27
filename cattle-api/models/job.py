import uuid
from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class Job(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    status: str = Field(default="pending")  # pending | processing | streaming | done | error
    cattle_count: Optional[int] = Field(default=None)
    expected_count: Optional[int] = Field(default=None)
    location: Optional[str] = Field(default=None)
    report_path: Optional[str] = Field(default=None)
    error_message: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
