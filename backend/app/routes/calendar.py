"""Endpoint de calendario: vista combinada de sesiones y registros de hábitos."""
from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.habit import Habit, HabitLog
from app.models.user import User
from app.schemas.habit import HabitLogResponse
from app.schemas.session import SessionResponse
from app.security import get_current_user
from app.services import session_service

router = APIRouter(prefix="/api/calendar", tags=["calendar"])


@router.get("")
def calendar(
    date_from: date | None = Query(default=None, alias="from"),
    date_to: date | None = Query(default=None, alias="to"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sessions = session_service.list_sessions(db, user.id, date_from, date_to)

    # Registros de hábitos del usuario en el rango, vía join para filtrar por dueño
    q = db.query(HabitLog).join(Habit, Habit.id == HabitLog.habit_id).filter(Habit.user_id == user.id)
    if date_from:
        q = q.filter(HabitLog.date >= date_from)
    if date_to:
        q = q.filter(HabitLog.date <= date_to)
    habit_logs = q.order_by(HabitLog.date.desc()).all()

    return {
        "sessions": [SessionResponse.model_validate(s) for s in sessions],
        "habit_logs": [HabitLogResponse.model_validate(log) for log in habit_logs],
    }
