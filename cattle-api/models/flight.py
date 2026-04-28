import uuid
from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class Flight(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    pasture_id: str = Field(index=True)
    pasture_name: Optional[str] = Field(default=None)
    farm_id: Optional[str] = Field(default=None)
    operator_id: Optional[str] = Field(default=None)
    start_ts: datetime = Field(default_factory=datetime.utcnow)
    end_ts: Optional[datetime] = Field(default=None)
    altitude_estimated: Optional[float] = Field(default=None)
    status: str = Field(default="processing")   # processing | completed | failed
    detected_count: Optional[int] = Field(default=None)
    expected_count: Optional[int] = Field(default=None)
    alerts_count: int = Field(default=0)
    notes: Optional[str] = Field(default=None)
    source: str = Field(default="upload")        # upload | live
    ai_sync_status: str = Field(default="pending")  # pending | sent | failed
    frame_count: Optional[int] = Field(default=None)
    video_path: Optional[str] = Field(default=None)
    report_path: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
