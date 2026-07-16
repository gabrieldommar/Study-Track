"""Modelos de estudio: plan (definición) y sesión (ocurrencia por día)."""
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    Time,
)

from app.database import Base


class StudyPlan(Base):
    """Definición de un plan de estudio. Genera N ocurrencias (StudySession)."""

    __tablename__ = "study_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    topic = Column(String(200), nullable=False)
    recurring_weekly = Column(Boolean, nullable=False, default=False)
    # Hasta dónde se materializaron las ocurrencias (solo aplica a recurrentes)
    horizon_end = Column(Date, nullable=True)
    # Patrón semanal serializado [{weekday, start_time, planned_hours}] para extender
    schedule_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class StudySession(Base):
    """Ocurrencia de estudio de un día concreto (planeada o completada)."""

    __tablename__ = "study_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    # NULL para sesiones sueltas (creadas one-off, sin plan)
    plan_id = Column(Integer, ForeignKey("study_plans.id"), nullable=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False, index=True)
    topic = Column(String(200), nullable=False)
    date = Column(Date, nullable=False, index=True)
    start_time = Column(Time, nullable=True)  # hora de inicio del bloque
    planned_hours = Column(Float, nullable=False)
    # completed_hours es NULL mientras la sesión esté solo planeada
    completed_hours = Column(Float, nullable=True)
    status = Column(String(20), nullable=False)  # 'planned' | 'completed'
    created_at = Column(DateTime, default=datetime.utcnow)
