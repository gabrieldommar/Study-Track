"""Endpoints de sesiones de estudio. La lógica vive en session_service."""
from datetime import date

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.session import (
    PlanCreate,
    PlanWithOccurrences,
    SessionCreate,
    SessionResponse,
    SessionUpdate,
    StatRow,
)
from app.security import get_current_user
from app.services import session_service

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


@router.get("", response_model=list[SessionResponse])
def list_sessions(
    date_from: date | None = Query(default=None, alias="from"),
    date_to: date | None = Query(default=None, alias="to"),
    category_id: int | None = None,
    status: str | None = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return session_service.list_sessions(db, user.id, date_from, date_to, category_id, status)


# Rutas de plan (agendado con recurrencia). Estáticas → antes de /{session_id}.
@router.post("/plans", response_model=PlanWithOccurrences, status_code=status.HTTP_201_CREATED)
def create_plan(
    data: PlanCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    return session_service.create_plan(db, user.id, data)


@router.delete("/plans/{plan_id}")
def delete_plan(
    plan_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    return session_service.delete_plan(db, user.id, plan_id)


# /stats se define antes de /{session_id} para que no lo capture la ruta dinámica
@router.get("/stats", response_model=list[StatRow])
def session_stats(
    period: str = Query(default="total"),
    category_id: int | None = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return session_service.stats(db, user.id, period, category_id)


@router.post("", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
def create_session(
    data: SessionCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    return session_service.create(db, user.id, data)


@router.get("/{session_id}", response_model=SessionResponse)
def get_session(
    session_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    return session_service.get(db, user.id, session_id)


@router.put("/{session_id}", response_model=SessionResponse)
def update_session(
    session_id: int,
    data: SessionUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return session_service.update(db, user.id, session_id, data)


@router.delete("/{session_id}")
def delete_session(
    session_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    return session_service.delete(db, user.id, session_id)
