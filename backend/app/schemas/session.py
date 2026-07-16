"""Schemas Pydantic para planes de estudio y sus ocurrencias (sesiones)."""
from datetime import date as date_type
from datetime import time as time_type
from enum import Enum

from pydantic import BaseModel, Field, model_validator

from app.schemas.scheduling import DaySpec, validate_day_specs


class SessionStatus(str, Enum):
    planned = "planned"
    completed = "completed"


# --- Plan (definición) ---------------------------------------------------

class PlanCreate(BaseModel):
    topic: str = Field(min_length=1, max_length=200)
    category_id: int
    recurring_weekly: bool = False
    days: list[DaySpec]

    @model_validator(mode="after")
    def check_days(self):
        validate_day_specs(self.days, self.recurring_weekly)
        return self


class PlanResponse(BaseModel):
    id: int
    topic: str
    category_id: int
    category_path: str
    recurring_weekly: bool
    horizon_end: date_type | None

    class Config:
        from_attributes = True


# --- Sesión (ocurrencia por día) -----------------------------------------

class SessionCreate(BaseModel):
    topic: str = Field(min_length=1, max_length=200)
    category_id: int
    date: date_type
    start_time: time_type | None = None
    planned_hours: float = Field(gt=0)
    completed_hours: float | None = Field(default=None, gt=0)
    status: SessionStatus = SessionStatus.planned

    @model_validator(mode="after")
    def check_completed(self):
        if self.status == SessionStatus.completed and self.completed_hours is None:
            raise ValueError("completed_hours es obligatorio cuando status='completed'")
        return self


class SessionUpdate(BaseModel):
    topic: str | None = Field(default=None, min_length=1, max_length=200)
    category_id: int | None = None
    date: date_type | None = None
    start_time: time_type | None = None
    planned_hours: float | None = Field(default=None, gt=0)
    completed_hours: float | None = Field(default=None, gt=0)
    status: SessionStatus | None = None


class SessionResponse(BaseModel):
    id: int
    plan_id: int | None
    topic: str
    category_id: int
    category_path: str
    date: date_type
    start_time: time_type | None
    planned_hours: float
    completed_hours: float | None
    status: str

    class Config:
        from_attributes = True


class PlanWithOccurrences(BaseModel):
    plan: PlanResponse
    occurrences: list[SessionResponse]


class StatRow(BaseModel):
    category_id: int
    category_path: str
    period: str
    total_planned: float
    total_completed: float
