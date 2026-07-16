"""Endpoints de hábitos: definición + ocurrencias (entries). Lógica en habit_service."""
from datetime import date

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.habit import (
    HabitCreate,
    HabitEntryResponse,
    HabitEntryUpdate,
    HabitResponse,
    HabitStatRow,
    HabitUpdate,
    HabitWithOccurrences,
)
from app.security import get_current_user
from app.services import habit_service

router = APIRouter(prefix="/api/habits", tags=["habits"])


@router.get("", response_model=list[HabitResponse])
def list_habits(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return habit_service.list_habits(db, user.id)


@router.post("", response_model=HabitWithOccurrences, status_code=status.HTTP_201_CREATED)
def create_habit(
    data: HabitCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    return habit_service.create(db, user.id, data)


# Rutas estáticas (/stats, /entries) antes de la dinámica /{habit_id}
@router.get("/stats", response_model=list[HabitStatRow])
def habit_stats(
    period: str = Query(default="total"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return habit_service.stats(db, user.id, period)


@router.get("/entries", response_model=list[HabitEntryResponse])
def list_entries(
    date_from: date | None = Query(default=None, alias="from"),
    date_to: date | None = Query(default=None, alias="to"),
    habit_id: int | None = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return habit_service.list_entries(db, user.id, date_from, date_to, habit_id)


@router.put("/entries/{entry_id}", response_model=HabitEntryResponse)
def update_entry(
    entry_id: int,
    data: HabitEntryUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return habit_service.update_entry(db, user.id, entry_id, data)


@router.delete("/entries/{entry_id}")
def delete_entry(entry_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return habit_service.delete_entry(db, user.id, entry_id)


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
