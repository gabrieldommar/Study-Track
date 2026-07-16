"""Endpoint de calendario: vista combinada de sesiones y ocurrencias de hábitos.

Alimenta la grilla mensual del frontend. Ambos servicios materializan
perezosamente las ocurrencias recurrentes hasta `to`.
"""
from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.habit import HabitEntryResponse
from app.schemas.session import SessionResponse
from app.security import get_current_user
from app.services import habit_service, session_service

router = APIRouter(prefix="/api/calendar", tags=["calendar"])


@router.get("")
def calendar(
    date_from: date | None = Query(default=None, alias="from"),
    date_to: date | None = Query(default=None, alias="to"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sessions = session_service.list_sessions(db, user.id, date_from, date_to)
    habit_entries = habit_service.list_entries(db, user.id, date_from, date_to)
    return {
        "sessions": [SessionResponse.model_validate(s) for s in sessions],
        "habit_entries": [HabitEntryResponse.model_validate(e) for e in habit_entries],
    }
