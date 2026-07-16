"""Migración Fase 2 — Agendado + Recurrencia (uso manual, opcional).

La app ya sincroniza el esquema al arrancar (app.schema_sync.sync_schema), así que
en la mayoría de los casos no hace falta correr esto. Se conserva para:
  - forzar la sincronización de columnas sin arrancar el server, y
  - hacer el backfill de habit_logs (Fase 1) -> habit_entries (Fase 2).

Ejecutar desde la carpeta `backend`:

    python -m scripts.migrate_phase2

Es idempotente y funciona en SQLite y Postgres.
"""
import os
import sys

# Permite ejecutar el script con `app` importable (carpeta backend en el path)
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal  # noqa: E402
from app.models.habit import Habit, HabitEntry, HabitLog  # noqa: E402
from app.schema_sync import sync_schema  # noqa: E402


def backfill_habit_entries():
    """Convierte cada habit_log (Fase 1) en un habit_entry completado. Solo si está vacía."""
    db = SessionLocal()
    try:
        if db.query(HabitEntry).count() > 0:
            print("  = habit_entries no está vacía, se omite el backfill")
            return
        habit_owner = {h.id: h.user_id for h in db.query(Habit).all()}
        created = 0
        for log in db.query(HabitLog).all():
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
    print("Migración Fase 2 — Agendado + Recurrencia")
    print("1) Sincronizar esquema (tablas + columnas nuevas)")
    sync_schema()
    print("2) Backfill habit_logs -> habit_entries")
    backfill_habit_entries()
    print("Listo.")


if __name__ == "__main__":
    main()
