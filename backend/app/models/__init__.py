"""Importa todos los modelos para que SQLAlchemy registre las tablas."""
from app.models.category import Category  # noqa: F401
from app.models.habit import Habit, HabitEntry, HabitLog  # noqa: F401
from app.models.study_session import StudyPlan, StudySession  # noqa: F401
from app.models.user import User  # noqa: F401
