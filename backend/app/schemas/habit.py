"""Schemas Pydantic para hábitos y sus registros."""
from datetime import date as date_type
from enum import Enum

from pydantic import BaseModel, Field


class HabitFrequency(str, Enum):
    daily = "daily"
    weekly = "weekly"


class HabitCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    frequency: HabitFrequency
    target_duration: float = Field(gt=0)  # debe ser > 0


class HabitUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    frequency: HabitFrequency | None = None
    target_duration: float | None = Field(default=None, gt=0)


class HabitResponse(BaseModel):
    id: int
    name: str
    frequency: str
    target_duration: float

    class Config:
        from_attributes = True


class HabitLogCreate(BaseModel):
    date: date_type
    duration: float = Field(gt=0)  # debe ser > 0


class HabitLogResponse(BaseModel):
    id: int
    habit_id: int
    date: date_type
    duration: float

    class Config:
        from_attributes = True


class HabitStatRow(BaseModel):
    habit_id: int
    name: str
    period: str
    total_target: float
    total_done: float
