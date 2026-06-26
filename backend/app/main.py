"""Punto de entrada de la API StudyTrack."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models  # noqa: F401  (registra los modelos en Base)
from app.config import settings
from app.database import Base, engine
from app.routes import auth, calendar, categories, habits, sessions

# Crea las tablas si no existen (suficiente para el MVP; sin Alembic)
Base.metadata.create_all(bind=engine)

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
