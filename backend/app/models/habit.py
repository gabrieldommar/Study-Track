"""Modelos de hábitos: definición (Habit) y ocurrencia por día (HabitEntry).

Simétrico a estudio (StudyPlan / StudySession). `HabitLog` queda deprecado
y solo se conserva para la migración de datos existentes.
"""
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


class Habit(Base):
    """Definición de un hábito. Genera N ocurrencias (HabitEntry)."""

    __tablename__ = "habits"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    recurring_weekly = Column(Boolean, nullable=False, default=False)
    horizon_end = Column(Date, nullable=True)
    # Patrón semanal serializado [{weekday, start_time, planned_hours}] para extender
    schedule_json = Column(Text, nullable=True)
    # Deprecados (Fase 1): se siguen poblando derivados para no romper la tabla legacy.
    frequency = Column(String(20), nullable=True)  # 'daily' | 'weekly' (derivado)
    target_duration = Column(Float, nullable=True)  # derivado del máximo de horas/día
    created_at = Column(DateTime, default=datetime.utcnow)


class HabitEntry(Base):
    """Ocurrencia de un hábito en un día concreto (planeada o completada)."""

    __tablename__ = "habit_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    habit_id = Column(Integer, ForeignKey("habits.id"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    start_time = Column(Time, nullable=True)
    planned_hours = Column(Float, nullable=False)
    completed_hours = Column(Float, nullable=True)
    status = Column(String(20), nullable=False)  # 'planned' | 'completed'
    created_at = Column(DateTime, default=datetime.utcnow)


class HabitLog(Base):
    """DEPRECADO — reemplazado por HabitEntry. Solo se conserva para migrar datos."""

    __tablename__ = "habit_logs"

    id = Column(Integer, primary_key=True, index=True)
    habit_id = Column(Integer, ForeignKey("habits.id"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    duration = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
