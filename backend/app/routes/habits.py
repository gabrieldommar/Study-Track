"""Endpoints de hábitos y registros. La lógica vive en habit_service."""
from datetime import date

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.habit import (
    HabitCreate,
    HabitLogCreate,
    HabitLogResponse,
    HabitResponse,
    HabitStatRow,
    HabitUpdate,
)
from app.security import get_current_user
from app.services import habit_service

router = APIRouter(prefix="/api/habits", tags=["habits"])


@router.get("", response_model=list[HabitResponse])
def list_habits(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return habit_service.list_habits(db, user.id)


@router.post("", response_model=HabitResponse, status_code=status.HTTP_201_CREATED)
def create_habit(
    data: HabitCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    return habit_service.create(db, user.id, data)


# /stats antes de /{habit_id} para que no lo capture la ruta dinámica
@router.get("/stats", response_model=list[HabitStatRow])
def habit_stats(
    period: str = Query(default="total"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return habit_service.stats(db, user.id, period)


# Borrado de un registro puntual (ruta estática antes de /{habit_id}/...)
@router.delete("/logs/{log_id}")
def delete_log(log_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return habit_service.delete_log(db, user.id, log_id)


@router.put("/{habit_id}", response_model=HabitResponse)
def update_habit(
    habit_id: int,
    data: HabitUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return habit_service.update(db, user.id, habit_id, data)


@router.delete("/{habit_id}")
def delete_habit(habit_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return habit_service.delete(db, user.id, habit_id)


@router.get("/{habit_id}/logs", response_model=list[HabitLogResponse])
def list_logs(
    habit_id: int,
    date_from: date | None = Query(default=None, alias="from"),
    date_to: date | None = Query(default=None, alias="to"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return habit_service.list_logs(db, user.id, habit_id, date_from, date_to)


@router.post("/{habit_id}/logs", response_model=HabitLogResponse, status_code=status.HTTP_201_CREATED)
def create_log(
    habit_id: int,
    data: HabitLogCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return habit_service.create_log(db, user.id, habit_id, data)
