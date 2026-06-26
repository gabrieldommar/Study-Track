"""Lógica de negocio de hábitos, registros y estadísticas."""
from datetime import date

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.habit import Habit, HabitLog
from app.schemas.habit import HabitCreate, HabitLogCreate, HabitUpdate
from app.services.stats_utils import VALID_PERIODS, expected_occurrences, period_key


def _get_owned_habit(db: Session, user_id: int, habit_id: int) -> Habit:
    h = db.query(Habit).filter(Habit.id == habit_id, Habit.user_id == user_id).first()
    if not h:
        raise HTTPException(status_code=404, detail="Hábito no encontrado")
    return h


def list_habits(db: Session, user_id: int) -> list[Habit]:
    return db.query(Habit).filter(Habit.user_id == user_id).order_by(Habit.name).all()


def create(db: Session, user_id: int, data: HabitCreate) -> Habit:
    h = Habit(
        user_id=user_id,
        name=data.name,
        frequency=data.frequency.value,
        target_duration=data.target_duration,
    )
    db.add(h)
    db.commit()
    db.refresh(h)
    return h


def update(db: Session, user_id: int, habit_id: int, data: HabitUpdate) -> Habit:
    h = _get_owned_habit(db, user_id, habit_id)
    if data.name is not None:
        h.name = data.name
    if data.frequency is not None:
        h.frequency = data.frequency.value
    if data.target_duration is not None:
        h.target_duration = data.target_duration
    db.commit()
    db.refresh(h)
    return h


def delete(db: Session, user_id: int, habit_id: int) -> dict:
    h = _get_owned_habit(db, user_id, habit_id)
    # Borra también los registros asociados (relación 1:N)
    db.query(HabitLog).filter(HabitLog.habit_id == habit_id).delete()
    db.delete(h)
    db.commit()
    return {"message": "Hábito eliminado"}


def list_logs(
    db: Session, user_id: int, habit_id: int, date_from: date | None = None, date_to: date | None = None
) -> list[HabitLog]:
    _get_owned_habit(db, user_id, habit_id)  # valida pertenencia
    q = db.query(HabitLog).filter(HabitLog.habit_id == habit_id)
    if date_from:
        q = q.filter(HabitLog.date >= date_from)
    if date_to:
        q = q.filter(HabitLog.date <= date_to)
    return q.order_by(HabitLog.date.desc()).all()


def create_log(db: Session, user_id: int, habit_id: int, data: HabitLogCreate) -> HabitLog:
    _get_owned_habit(db, user_id, habit_id)
    log = HabitLog(habit_id=habit_id, date=data.date, duration=data.duration)
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


def delete_log(db: Session, user_id: int, log_id: int) -> dict:
    log = db.query(HabitLog).join(Habit, Habit.id == HabitLog.habit_id).filter(
        HabitLog.id == log_id, Habit.user_id == user_id
    ).first()
    if not log:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    db.delete(log)
    db.commit()
    return {"message": "Registro eliminado"}


def stats(db: Session, user_id: int, period: str) -> list[dict]:
    if period not in VALID_PERIODS:
        raise HTTPException(status_code=422, detail=f"period debe ser uno de {VALID_PERIODS}")

    habits = db.query(Habit).filter(Habit.user_id == user_id).all()
    rows = []
    for h in habits:
        logs = db.query(HabitLog).filter(HabitLog.habit_id == h.id).all()
        if not logs:
            continue
        # Agrupa los registros por bucket de período
        buckets: dict[str, list] = {}
        for log in logs:
            buckets.setdefault(period_key(log.date, period), []).append(log)
        for key, bucket_logs in buckets.items():
            dates = [log.date for log in bucket_logs]
            total_done = sum(log.duration for log in bucket_logs)
            total_target = h.target_duration * expected_occurrences(h.frequency, period, dates)
            rows.append({
                "habit_id": h.id,
                "name": h.name,
                "period": key,
                "total_target": round(total_target, 2),
                "total_done": round(total_done, 2),
            })
    return sorted(rows, key=lambda r: (r["name"], r["period"]))
