"""Sincronización de esquema idempotente y agnóstica de motor (SQLite / Postgres).

Se ejecuta al arrancar la app: crea las tablas nuevas y agrega las columnas de la
Fase 2 que falten en tablas preexistentes. Hace que cada deploy (p. ej. Render con
Postgres) quede migrado automáticamente, sin Alembic ni acceso a shell.
"""
from sqlalchemy import inspect, text

from app import models  # noqa: F401  (registra los modelos en Base)
from app.database import Base, engine as default_engine

# (tabla, columna, tipo SQL portable entre SQLite y Postgres)
_PHASE2_COLUMNS = [
    ("study_sessions", "plan_id", "INTEGER"),
    ("study_sessions", "start_time", "TIME"),
    ("study_plans", "schedule_json", "TEXT"),
    ("habits", "recurring_weekly", "BOOLEAN DEFAULT FALSE"),
    ("habits", "horizon_end", "DATE"),
    ("habits", "schedule_json", "TEXT"),
]


def _has_column(inspector, table: str, column: str) -> bool:
    return column in {c["name"] for c in inspector.get_columns(table)}


def sync_schema(engine=None):
    """Crea tablas faltantes y agrega columnas de la Fase 2 que no existan."""
    engine = engine or default_engine
    Base.metadata.create_all(bind=engine)

    inspector = inspect(engine)
    with engine.begin() as conn:
        for table, column, ddl in _PHASE2_COLUMNS:
            if inspector.has_table(table) and not _has_column(inspector, table, column):
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {ddl}"))

    # Normaliza posibles NULL tras el ADD COLUMN (según el motor)
    with engine.begin() as conn:
        conn.execute(text("UPDATE habits SET recurring_weekly = FALSE WHERE recurring_weekly IS NULL"))
