"""Punto de entrada de la API StudyTrack."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models  # noqa: F401  (registra los modelos en Base)
from app.config import settings
from app.routes import auth, calendar, categories, habits, sessions
from app.schema_sync import sync_schema

# Crea tablas y agrega columnas nuevas de la Fase 2 (idempotente, SQLite/Postgres)
sync_schema()

app = FastAPI(title="StudyTrack API", debug=settings.debug)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(categories.router)
app.include_router(sessions.router)
app.include_router(habits.router)
app.include_router(calendar.router)


@app.get("/api/health", tags=["health"])
def health():
    return {"status": "ok"}
