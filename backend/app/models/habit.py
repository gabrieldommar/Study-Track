"""Modelos de hábitos. Entidad separada del estudio pero comparte la lógica de horas."""
from datetime import datetime

from sqlalchemy import Column, Date, DateTime, Float, ForeignKey, Integer, String

from app.database import Base


class Habit(Base):
    __tablename__ = "habits"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    frequency = Column(String(20), nullable=False)  # 'daily' | 'weekly'
    target_duration = Column(Float, nullable=False)  # horas objetivo por ocurrencia
    created_at = Column(DateTime, default=datetime.utcnow)


class HabitLog(Base):
    __tablename__ = "habit_logs"

    id = Column(Integer, primary_key=True, index=True)
    habit_id = Column(Integer, ForeignKey("habits.id"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    duration = Column(Float, nullable=False)  # horas efectivamente dedicadas
    created_at = Column(DateTime, default=datetime.utcnow)
