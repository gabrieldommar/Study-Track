"""Lógica de negocio de hábitos: definición, ocurrencias (entries) y estadísticas.

Simétrico a estudio (session_service), reutilizando scheduling_service.
"""
from datetime import date, timedelta

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.habit import Habit, HabitEntry
from app.schemas.habit import HabitCreate, HabitEntryStatus, HabitEntryUpdate, HabitUpdate
from app.schemas.scheduling import DaySpec
from app.services import scheduling_service
from app.services.stats_utils import VALID_PERIODS, period_key


def _get_owned_habit(db: Session, user_id: int, habit_id: int) -> Habit:
    h = db.query(Habit).filter(Habit.id == habit_id, Habit.user_id == user_id).first()
    if not h:
        raise HTTPException(status_code=404, detail="Hábito no encontrado")
    return h


def _get_owned_entry(db: Session, user_id: int, entry_id: int) -> HabitEntry:
    e = db.query(HabitEntry).filter(
        HabitEntry.id == entry_id, HabitEntry.user_id == user_id
    ).first()
    if not e:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    return e


def _habit_to_response(h: Habit) -> dict:
    return {
        "id": h.id,
        "name": h.name,
        "recurring_weekly": h.recurring_weekly,
        "horizon_end": h.horizon_end,
    }


def _entry_to_response(e: HabitEntry) -> dict:
    return {
        "id": e.id,
        "habit_id": e.habit_id,
        "date": e.date,
        "start_time": e.start_time,
        "planned_hours": e.planned_hours,
        "completed_hours": e.completed_hours,
        "status": e.status,
    }


def _derived_legacy(days: list[DaySpec], recurring: bool) -> tuple[str, float]:
    """Valores derivados para las columnas legacy NOT NULL frequency/target_duration."""
    return ("weekly" if recurring else "daily", max(d.planned_hours for d in days))


# --- Definición + materialización ----------------------------------------

def list_habits(db: Session, user_id: int) -> list[dict]:
    habits = db.query(Habit).filter(Habit.user_id == user_id).order_by(Habit.name).all()
    return [_habit_to_response(h) for h in habits]


def create(db: Session, user_id: int, data: HabitCreate) -> dict:
    recurring = data.recurring_weekly
    today = date.today()
    frequency, target = _derived_legacy(data.days, recurring)

    h = Habit(
        user_id=user_id,
        name=data.name,
        recurring_weekly=recurring,
        horizon_end=scheduling_service.default_horizon_end(today) if recurring else None,
        schedule_json=scheduling_service.serialize_schedule(data.days) if recurring else None,
        frequency=frequency,
        target_duration=target,
    )
    db.add(h)
    db.flush()

    for occ_date, start_time, planned_hours in scheduling_service.occurrences_for_create(
        data.days, recurring, today
    ):
        db.add(HabitEntry(
            user_id=user_id,
            habit_id=h.id,
            date=occ_date,
            start_time=start_time,
            planned_hours=planned_hours,
            status=HabitEntryStatus.planned.value,
        ))
    db.commit()
    db.refresh(h)

    entries = (
        db.query(HabitEntry)
        .filter(HabitEntry.habit_id == h.id)
        .order_by(HabitEntry.date)
        .all()
    )
    return {
        "habit": _habit_to_response(h),
        "occurrences": [_entry_to_response(e) for e in entries],
    }


def ensure_materialized(db: Session, user_id: int, up_to: date | None):
    """Extiende perezosamente las entries de los hábitos recurrentes hasta `up_to`."""
    if up_to is None:
        return
    habits = db.query(Habit).filter(
        Habit.user_id == user_id,
        Habit.recurring_weekly.is_(True),
        Habit.horizon_end.isnot(None),
        Habit.horizon_end < up_to,
    ).all()
    if not habits:
        return
    for h in habits:
        schedule = scheduling_service.parse_schedule(h.schedule_json)
        occs = scheduling_service.occurrences_for_extension(
            schedule, h.horizon_end + timedelta(days=1), up_to
        )
        for occ_date, start_time, planned_hours in occs:
            db.add(HabitEntry(
                user_id=user_id,
                habit_id=h.id,
                date=occ_date,
                start_time=start_time,
                planned_hours=planned_hours,
                status=HabitEntryStatus.planned.value,
            ))
        h.horizon_end = up_to
    db.commit()


def update(db: Session, user_id: int, habit_id: int, data: HabitUpdate) -> dict:
    h = _get_owned_habit(db, user_id, habit_id)
    if data.name is not None:
        h.name = data.name
    if data.recurring_weekly is not None:
        h.recurring_weekly = data.recurring_weekly
        h.frequency = "weekly" if data.recurring_weekly else "daily"
    db.commit()
    db.refresh(h)
    return _habit_to_response(h)


def delete(db: Session, user_id: int, habit_id: int) -> dict:
    h = _get_owned_habit(db, user_id, habit_id)
    db.query(HabitEntry).filter(HabitEntry.habit_id == habit_id).delete()
    db.delete(h)
    db.commit()
    return {"message": "Hábito eliminado"}


# --- Ocurrencias individuales --------------------------------------------

def list_entries(
    db: Session,
    user_id: int,
    date_from: date | None = None,
    date_to: date | None = None,
    habit_id: int | None = None,
) -> list[dict]:
    ensure_materialized(db, user_id, date_to)
    q = db.query(HabitEntry).filter(HabitEntry.user_id == user_id)
    if habit_id:
        q = q.filter(HabitEntry.habit_id == habit_id)
    if date_from:
        q = q.filter(HabitEntry.date >= date_from)
    if date_to:
        q = q.filter(HabitEntry.date <= date_to)
    return [_entry_to_response(e) for e in q.order_by(HabitEntry.date.desc()).all()]


def update_entry(db: Session, user_id: int, entry_id: int, data: HabitEntryUpdate) -> dict:
    e = _get_owned_entry(db, user_id, entry_id)
    for field in ("date", "start_time", "planned_hours", "completed_hours"):
        value = getattr(data, field)
        if value is not None:
            setattr(e, field, value)
    if data.status is not None:
        e.status = data.status.value
    if e.status == HabitEntryStatus.completed.value and e.completed_hours is None:
        raise HTTPException(status_code=422, detail="completed_hours es obligatorio si status='completed'")
    db.commit()
    db.refresh(e)
    return _entry_to_response(e)


def delete_entry(db: Session, user_id: int, entry_id: int) -> dict:
    e = _get_owned_entry(db, user_id, entry_id)
    db.delete(e)
    db.commit()
    return {"message": "Registro eliminado"}


def stats(db: Session, user_id: int, period: str) -> list[dict]:
    if period not in VALID_PERIODS:
        raise HTTPException(status_code=422, detail=f"period debe ser uno de {VALID_PERIODS}")

    names = {h.id: h.name for h in db.query(Habit).filter(Habit.user_id == user_id).all()}
    entries = db.query(HabitEntry).filter(HabitEntry.user_id == user_id).all()

    buckets: dict[tuple[int, str], dict] = {}
    for e in entries:
        key = (e.habit_id, period_key(e.date, period))
        bucket = buckets.setdefault(key, {
            "habit_id": e.habit_id,
            "name": names.get(e.habit_id, ""),
            "period": key[1],
            "total_target": 0.0,
            "total_done": 0.0,
        })
        bucket["total_target"] += e.planned_hours or 0.0
        bucket["total_done"] += e.completed_hours or 0.0

    rows = [
        {**b, "total_target": round(b["total_target"], 2), "total_done": round(b["total_done"], 2)}
        for b in buckets.values()
    ]
    return sorted(rows, key=lambda r: (r["name"], r["period"]))
