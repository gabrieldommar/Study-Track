# StudyTrack

Aplicación web para planificar y registrar tiempo de estudio y hábitos, con agenda, estadísticas y autenticación (JWT propio + Google).


## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | React 18 (Vite) · Tailwind CSS · Recharts · React Router |
| Backend | FastAPI · SQLAlchemy · python-jose (JWT) · passlib/bcrypt · google-auth |
| Base de datos | SQLite por defecto (migrable a MySQL cambiando `DATABASE_URL`) |
| Auth | JWT propio + Google OAuth (verificación de `id_token`) |

## Funcionalidades

- **Login / Registro** con email+contraseña o cuenta de Google.
- **Estudio**: sesiones planeadas/completadas por categoría (con jerarquía de categorías).
- **Agenda**: vista semana/mes que combina sesiones y registros de hábitos por día.
- **Hábitos**: hábitos diarios/semanales con horas objetivo y registro de cumplimiento.
- **Estadísticas**: gráficas de planeado-vs-completado (estudio) y objetivo-vs-cumplido (hábitos).

## Estructura

```
backend/
  app/
    main.py            # FastAPI app + CORS + routers
    config.py          # settings desde .env
    database.py        # engine + Base SQLAlchemy
    security.py        # hashing y JWT
    models/            # users, categories, study_sessions, habits, habit_logs
    schemas/           # Pydantic
    routes/            # auth, categories, sessions, habits, calendar
    services/          # lógica de negocio + stats_utils (agregación temporal)
frontend/
  src/
    pages/             # LoginPage, AgendaPage, SessionsPage, HabitsPage, StatsPage
    components/        # ui/ (Button, Input, Select, Modal, Spinner, Feedback), auth/, layout/, sessions/, habits/
    hooks/             # useSessions, useCategories, useCalendar, useHabits, useHabitLogs, useStats
    services/          # apiClient + *Service por entidad
    context/           # AuthContext
    utils/             # dates.js
```

## Puesta en marcha

### Requisitos
- Python 3.10+
- Node 18+

### 1. Backend

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env        # editar JWT_SECRET (obligatorio) y, si se usa, las credenciales de Google
uvicorn app.main:app --reload --port 8000
```

API en `http://localhost:8000` · docs interactivas en `http://localhost:8000/docs` · healthcheck en `/api/health`.
Las tablas SQLite se crean automáticamente al primer arranque (`studytrack.db`).

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env        # VITE_API_URL ya apunta al backend local
npm run dev
```

App en `http://localhost:5173`.

## Variables de entorno

**Backend** (`backend/.env`):

| Variable | Requerida | Default |
|----------|-----------|---------|
| `DATABASE_URL` | No | `sqlite:///./studytrack.db` |
| `JWT_SECRET` | **Sí** | — |
| `JWT_EXPIRE_HOURS` | No | `24` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Solo para login con Google | vacío |
| `ALLOWED_ORIGINS` | No | `http://localhost:5173` |
| `DEBUG` | No | `false` |

**Frontend** (`frontend/.env`):

| Variable | Requerida | Default |
|----------|-----------|---------|
| `VITE_API_URL` | **Sí** | `http://localhost:8000/api` |
| `VITE_GOOGLE_CLIENT_ID` | Solo para login con Google | — |

> El login con email/contraseña funciona sin configurar Google. Para habilitar Google, creá credenciales en [Google Cloud Console](https://console.cloud.google.com) y cargá el mismo Client ID en backend y frontend.

## Migrar a MySQL

1. Instalar el driver: `pip install pymysql`
2. Cambiar en `.env`: `DATABASE_URL=mysql+pymysql://user:pass@localhost:3306/studytrack`

No hay migraciones (Alembic) en el MVP: las tablas se crean con `create_all` al arrancar.


## Posibles mejoras

- Edición de sesiones/hábitos desde la UI (el backend ya expone `PUT`).
- Filtros por categoría/estado en la página de Estudio.
- Tests automatizados (pytest backend, Vitest frontend).
- Migraciones con Alembic para producción.
