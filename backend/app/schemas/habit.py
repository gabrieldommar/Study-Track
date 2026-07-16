"""Schemas Pydantic para hábitos (definición) y sus ocurrencias (entries).

Simétrico a estudio. Los `HabitLog*` quedan deprecados (solo migración).
"""
from datetime import date as date_type
from datetime import time as time_type
from enum import Enum

from pydantic import BaseModel, Field, model_validator

from app.schemas.scheduling import DaySpec, validate_day_specs


# --- Hábito (definición) -------------------------------------------------

class HabitCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    recurring_weekly: bool = False
    days: list[DaySpec]

    @model_validator(mode="after")
    def check_days(self):
        validate_day_specs(self.days, self.recurring_weekly)
        return self


class HabitUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    recurring_weekly: bool | None = None


class HabitResponse(BaseModel):
    id: int
    name: str
    recurring_weekly: bool
    horizon_end: date_type | None

    class Config:
        from_attributes = True


# --- Ocurrencia por día --------------------------------------------------

class HabitEntryStatus(str, Enum):
    planned = "planned"
    completed = "completed"


class HabitEntryCreate(BaseModel):
    date: date_type
    start_time: time_type | None = None
    planned_hours: float = Field(gt=0)
    completed_hours: float | None = Field(default=None, gt=0)
    status: HabitEntryStatus = HabitEntryStatus.planned

    @model_validator(mode="after")
    def check_completed(self):
        if self.status == HabitEntryStatus.completed and self.completed_hours is None:
            raise ValueError("completed_hours es obligatorio cuando status='completed'")
        return self


class HabitEntryUpdate(BaseModel):
    date: date_type | None = None
    start_time: time_type | None = None
    planned_hours: float | None = Field(default=None, gt=0)
    completed_hours: float | None = Field(default=None, gt=0)
    status: HabitEntryStatus | None = None


class HabitEntryResponse(BaseModel):
    id: int
    habit_id: int
    date: date_type
    start_time: time_type | None
    planned_hours: float
    completed_hours: float | None
    status: str

    class Config:
        from_attributes = True


class HabitWithOccurrences(BaseModel):
    habit: HabitResponse
    occurrences: list[HabitEntryResponse]


class HabitStatRow(BaseModel):
    habit_id: int
    name: str
    period: str
    total_target: float
    total_done: float


# --- DEPRECADOS (solo compatibilidad / migración) ------------------------

class HabitLogCreate(BaseModel):
    date: date_type
    duration: float = Field(gt=0)


class HabitLogResponse(BaseModel):
    id: int
    habit_id: int
    date: date_type
    duration: float

    class Config:
        from_attributes = True
