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
- **Estudio**: planes por categoría; se agendan días concretos con **hora de inicio** y **horas planeadas por día**, con opción de **repetir cada semana**. Cada día genera una ocurrencia.
- **Hábitos**: misma lógica de agendado que estudio (días + horario + horas por día + recurrencia semanal).
- **Agenda**: **calendario mensual** con el día actual resaltado; al seleccionar un día se ve el detalle de sus actividades (horario, planeado vs. cumplido, nombre) y se **registran las horas cumplidas**.
- **Estadísticas**: gráficas de planeado-vs-completado (estudio) y objetivo-vs-cumplido (hábitos).

> **Fase 2 (agendado + recurrencia):** las actividades se modelan como *definición + ocurrencias por día*. La recurrencia semanal se materializa hasta un horizonte (fin del mes siguiente) y se **extiende de forma perezosa** al navegar a fechas futuras. Detalle en [memory/decisions.md](memory/decisions.md).

## Estructura

```
backend/
  app/
    main.py            # FastAPI app + CORS + routers
    config.py          # settings desde .env
    database.py        # engine + Base SQLAlchemy
    security.py        # hashing y JWT
    models/            # users, categories, study_plans, study_sessions, habits, habit_entries
    schemas/           # Pydantic (+ scheduling.py: DaySpec compartido)
    routes/            # auth, categories, sessions, habits, calendar
    services/          # lógica de negocio + scheduling_service (recurrencia) + stats_utils
  scripts/
    migrate_phase2.py  # migración idempotente de la Fase 2
frontend/
  src/
    pages/             # LoginPage, AgendaPage, SessionsPage, HabitsPage, StatsPage
    components/        # ui/, auth/, layout/, sessions/, habits/, scheduling/ (SchedulePicker)
    hooks/             # useSessions, useCategories, useCalendar, useHabits, useStats
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

> **Si ya tenías una base de datos de la Fase 1**, aplicá la migración de la Fase 2 (agrega tablas/columnas de agendado y migra registros de hábitos, idempotente):
> ```bash
> cd backend && python -m scripts.migrate_phase2
> ```

> **Nota de entorno (bcrypt):** con `bcrypt` 4.x, `passlib` 1.7.4 puede fallar el hashing en `register`/`login` (`password cannot be longer than 72 bytes`). Si te pasa, fijá `pip install "bcrypt<4.1"` o actualizá a `passlib>=1.7.5`. No afecta al resto de la app (agenda/estudio/hábitos/stats).

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
