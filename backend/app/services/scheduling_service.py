"""Motor de agendado compartido por estudio y hábitos.

Convierte una lista de DaySpec (weekday|date + start_time + planned_hours) en
fechas de ocurrencia concretas, y resuelve el horizonte de recurrencia semanal
+ su extensión perezosa. No toca la DB: solo calcula.
"""
import calendar as _cal
import json
from datetime import date, time, timedelta

from app.schemas.scheduling import DaySpec


def default_horizon_end(ref: date) -> date:
    """Último día del mes siguiente a `ref` (horizonte inicial de recurrencia)."""
    year = ref.year + (1 if ref.month == 12 else 0)
    month = 1 if ref.month == 12 else ref.month + 1
    last_day = _cal.monthrange(year, month)[1]
    return date(year, month, last_day)


def _parse_hhmm(value: str | None) -> time | None:
    if not value:
        return None
    h, m = value.split(":")[:2]
    return time(int(h), int(m))


def serialize_schedule(days: list[DaySpec]) -> str:
    """Serializa el patrón semanal (solo recurrentes) para persistirlo en el plan."""
    return json.dumps([
        {
            "weekday": d.weekday,
            "start_time": d.start_time.strftime("%H:%M") if d.start_time else None,
            "planned_hours": d.planned_hours,
        }
        for d in days
    ])


def parse_schedule(schedule_json: str | None) -> list[dict]:
    """Reconstruye el patrón semanal persistido: [{weekday, start_time, planned_hours}]."""
    if not schedule_json:
        return []
    out = []
    for item in json.loads(schedule_json):
        out.append({
            "weekday": item["weekday"],
            "start_time": _parse_hhmm(item.get("start_time")),
            "planned_hours": item["planned_hours"],
        })
    return out


def weekly_dates(start: date, end: date, weekday: int):
    """Itera las fechas en [start, end] cuyo día de semana es `weekday` (0=lunes)."""
    first = start + timedelta(days=(weekday - start.weekday()) % 7)
    d = first
    while d <= end:
        yield d
        d += timedelta(days=7)


def occurrences_for_create(days: list[DaySpec], recurring_weekly: bool, ref: date):
    """Fechas de ocurrencia al crear una definición.

    Devuelve tuplas (date, start_time, planned_hours).
    - recurrente: desde `ref` hasta el horizonte, por cada weekday agendado.
    - puntual: una ocurrencia por cada `date` dado.
    """
    if not recurring_weekly:
        return [(d.date, d.start_time, d.planned_hours) for d in days]
    horizon = default_horizon_end(ref)
    out = []
    for spec in days:
        for occ_date in weekly_dates(ref, horizon, spec.weekday):
            out.append((occ_date, spec.start_time, spec.planned_hours))
    return out


def occurrences_for_extension(schedule: list[dict], from_date: date, up_to: date):
    """Fechas de ocurrencia al extender el horizonte de un plan recurrente."""
    out = []
    for slot in schedule:
        for occ_date in weekly_dates(from_date, up_to, slot["weekday"]):
            out.append((occ_date, slot["start_time"], slot["planned_hours"]))
    return out
