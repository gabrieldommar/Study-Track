"""Modelo de usuario. Soporta login por password propio y/o por Google."""
from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    # password_hash es NULL cuando el usuario se registró únicamente con Google
    password_hash = Column(String(255), nullable=True)
    # google_id es NULL cuando el usuario nunca usó Google
    google_id = Column(String(255), unique=True, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
