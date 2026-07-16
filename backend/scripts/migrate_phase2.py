"""Migración Fase 2 — Agendado + Recurrencia.

Idempotente y no destructivo. Ejecutar una vez desde la carpeta `backend`:

    python -m scripts.migrate_phase2

Qué hace:
  1. create_all -> crea tablas nuevas (study_plans, habit_entries).
  2. ALTER TABLE ADD COLUMN sobre tablas existentes (SQLite):
       - study_sessions: plan_id, start_time
       - habits:         recurring_weekly, horizon_end
  3. Backfill habit_logs -> habit_entries (solo si habit_entries está vacía).
  4. Normaliza habits.recurring_weekly NULL -> 0.

Para motores no-SQLite (ej. MySQL) usar una migración equivalente; este script
cubre el entorno de desarrollo SQLite del proyecto.
"""
import os
import sys

# Permite ejecutar el script con `app` importable (carpeta backend en el path)
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import inspect, text  # noqa: E402

from app.config import settings  # noqa: E402
from app.database import Base, SessionLocal, engine  # noqa: E402
from app import models  # noqa: F401,E402  (registra los modelos en Base)
from app.models.habit import Habit, HabitEntry, HabitLog  # noqa: E402


# Columnas nuevas por tabla: (tabla, columna, definición SQL para ADD COLUMN)
NEW_COLUMNS = [
    ("study_sessions", "plan_id", "INTEGER"),
    ("study_sessions", "start_time", "TIME"),
    ("study_plans", "schedule_json", "TEXT"),
    ("habits", "recurring_weekly", "BOOLEAN DEFAULT 0"),
    ("habits", "horizon_end", "DATE"),
    ("habits", "schedule_json", "TEXT"),
]


def _column_exists(inspector, table: str, column: str) -> bool:
    if table not in inspector.get_table_names():
        return False
    return column in {c["name"] for c in inspector.get_columns(table)}


def add_missing_columns():
    inspector = inspect(engine)
    with engine.begin() as conn:
        for table, column, ddl in NEW_COLUMNS:
            if _column_exists(inspector, table, column):
                print(f"  = {table}.{column} ya existe, se omite")
                continue
            conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {ddl}"))
            print(f"  + {table}.{column} agregada")


def normalize_habits():
    with engine.begin() as conn:
        conn.execute(text("UPDATE habits SET recurring_weekly = 0 WHERE recurring_weekly IS NULL"))


def backfill_habit_entries():
    db = SessionLocal()
    try:
        if db.query(HabitEntry).count() > 0:
            print("  = habit_entries no está vacía, se omite el backfill")
            return
        logs = db.query(HabitLog).all()
        habit_owner = {h.id: h.user_id for h in db.query(Habit).all()}
        created = 0
        for log in logs:
            owner = habit_owner.get(log.habit_id)
            if owner is None:
                continue  # log huérfano
            db.add(HabitEntry(
                user_id=owner,
                habit_id=log.habit_id,
                date=log.date,
                start_time=None,
                planned_hours=log.duration,
                completed_hours=log.duration,
                status="completed",
            ))
            created += 1
        db.commit()
        print(f"  + {created} habit_logs migrados a habit_entries")
    finally:
        db.close()


def main():
    if not settings.database_url.startswith("sqlite"):
        print(f"! DB no-SQLite ({settings.database_url}). Este script solo cubre SQLite.")
        sys.exit(1)

    print("Migración Fase 2 — Agendado + Recurrencia")
    print("1) create_all (tablas nuevas)")
    Base.metadata.create_all(bind=engine)
    print("2) ALTER TABLE ADD COLUMN")
    add_missing_columns()
    print("3) Normalizar habits.recurring_weekly")
    normalize_habits()
    print("4) Backfill habit_logs -> habit_entries")
    backfill_habit_entries()
    print("Listo.")


if __name__ == "__main__":
    main()
