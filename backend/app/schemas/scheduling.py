"""Schemas compartidos por estudio y hábitos para agendar días.

Un DaySpec describe un día agendado:
- recurrente (recurring_weekly=true)  -> se usa `weekday` (0=lunes … 6=domingo)
- puntual    (recurring_weekly=false) -> se usa `date`
En ambos casos con su `start_time` (opcional) y `planned_hours` (> 0).
"""
from datetime import date as date_type
from datetime import time as time_type

from pydantic import BaseModel, Field


class DaySpec(BaseModel):
    weekday: int | None = Field(default=None, ge=0, le=6)
    date: date_type | None = None
    start_time: time_type | None = None
    planned_hours: float = Field(gt=0)


def validate_day_specs(days: list[DaySpec], recurring_weekly: bool) -> list[DaySpec]:
    """Valida coherencia entre el modo de recurrencia y los DaySpec provistos."""
    if not days:
        raise ValueError("Debe agendar al menos un día")
    for d in days:
        if recurring_weekly and d.weekday is None:
            raise ValueError("Cada día requiere 'weekday' cuando recurring_weekly=true")
        if not recurring_weekly and d.date is None:
            raise ValueError("Cada día requiere 'date' cuando recurring_weekly=false")
    return days
