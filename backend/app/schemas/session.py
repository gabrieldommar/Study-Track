"""Schemas Pydantic para sesiones de estudio."""
from datetime import date as date_type
from enum import Enum

from pydantic import BaseModel, Field, model_validator


class SessionStatus(str, Enum):
    planned = "planned"
    completed = "completed"


class SessionCreate(BaseModel):
    topic: str = Field(min_length=1, max_length=200)
    category_id: int
    date: date_type
    planned_hours: float = Field(gt=0)  # debe ser > 0
    completed_hours: float | None = Field(default=None, gt=0)
    status: SessionStatus = SessionStatus.planned

    @model_validator(mode="after")
    def check_completed(self):
        # Si la sesión está completada, completed_hours es obligatorio
        if self.status == SessionStatus.completed and self.completed_hours is None:
            raise ValueError("completed_hours es obligatorio cuando status='completed'")
        return self


class SessionUpdate(BaseModel):
    topic: str | None = Field(default=None, min_length=1, max_length=200)
    category_id: int | None = None
    date: date_type | None = None
    planned_hours: float | None = Field(default=None, gt=0)
    completed_hours: float | None = Field(default=None, gt=0)
    status: SessionStatus | None = None


class SessionResponse(BaseModel):
    id: int
    topic: str
    category_id: int
    category_path: str
    date: date_type
    planned_hours: float
    completed_hours: float | None
    status: str

    class Config:
        from_attributes = True


class StatRow(BaseModel):
    category_id: int
    category_path: str
    period: str
    total_planned: float
    total_completed: float
