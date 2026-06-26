"""Modelo de sesión de estudio (planeada o completada)."""
from datetime import datetime

from sqlalchemy import Column, Date, DateTime, Float, ForeignKey, Integer, String

from app.database import Base


class StudySession(Base):
    __tablename__ = "study_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False, index=True)
    topic = Column(String(200), nullable=False)
    date = Column(Date, nullable=False, index=True)
    planned_hours = Column(Float, nullable=False)
    # completed_hours es NULL mientras la sesión esté solo planeada
    completed_hours = Column(Float, nullable=True)
    status = Column(String(20), nullable=False)  # 'planned' | 'completed'
    created_at = Column(DateTime, default=datetime.utcnow)
