"""Lógica de negocio de estudio: planes, ocurrencias (sesiones) y estadísticas."""
from datetime import date

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.study_session import StudyPlan, StudySession
from app.schemas.session import PlanCreate, SessionCreate, SessionStatus, SessionUpdate
from app.services import category_service, scheduling_service
from app.services.stats_utils import VALID_PERIODS, period_key


def _get_owned(db: Session, user_id: int, session_id: int) -> StudySession:
    s = db.query(StudySession).filter(
        StudySession.id == session_id, StudySession.user_id == user_id
    ).first()
    if not s:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")
    return s


def _validate_category(db: Session, user_id: int, category_id: int):
    owned = db.query(Category).filter(
        Category.id == category_id, Category.user_id == user_id
    ).first()
    if not owned:
        raise HTTPException(status_code=422, detail="La categoría no existe o no es del usuario")


def _to_response(s: StudySession, path_cache: dict[int, str], db: Session, user_id: int) -> dict:
    if s.category_id not in path_cache:
        path_cache[s.category_id] = category_service.path_for(db, user_id, s.category_id)
    return {
        "id": s.id,
        "plan_id": s.plan_id,
        "topic": s.topic,
        "category_id": s.category_id,
        "category_path": path_cache[s.category_id],
        "date": s.date,
        "start_time": s.start_time,
        "planned_hours": s.planned_hours,
        "completed_hours": s.completed_hours,
        "status": s.status,
    }


def _plan_to_response(plan: StudyPlan, db: Session, user_id: int) -> dict:
    return {
        "id": plan.id,
        "topic": plan.topic,
        "category_id": plan.category_id,
        "category_path": category_service.path_for(db, user_id, plan.category_id),
        "recurring_weekly": plan.recurring_weekly,
        "horizon_end": plan.horizon_end,
    }


# --- Recurrencia / materialización ---------------------------------------

def create_plan(db: Session, user_id: int, data: PlanCreate) -> dict:
    _validate_category(db, user_id, data.category_id)
    today = date.today()
    recurring = data.recurring_weekly

    plan = StudyPlan(
        user_id=user_id,
        category_id=data.category_id,
        topic=data.topic,
        recurring_weekly=recurring,
        horizon_end=scheduling_service.default_horizon_end(today) if recurring else None,
        schedule_json=scheduling_service.serialize_schedule(data.days) if recurring else None,
    )
    db.add(plan)
    db.flush()  # asigna plan.id sin cerrar la transacción

    for occ_date, start_time, planned_hours in scheduling_service.occurrences_for_create(
        data.days, recurring, today
    ):
        db.add(StudySession(
            user_id=user_id,
            plan_id=plan.id,
            category_id=data.category_id,
            topic=data.topic,
            date=occ_date,
            start_time=start_time,
            planned_hours=planned_hours,
            status=SessionStatus.planned.value,
        ))
    db.commit()
    db.refresh(plan)

    occurrences = (
        db.query(StudySession)
        .filter(StudySession.plan_id == plan.id)
        .order_by(StudySession.date)
        .all()
    )
    cache: dict[int, str] = {}
    return {
        "plan": _plan_to_response(plan, db, user_id),
        "occurrences": [_to_response(s, cache, db, user_id) for s in occurrences],
    }


def ensure_materialized(db: Session, user_id: int, up_to: date | None):
    """Extiende perezosamente las ocurrencias de los planes recurrentes hasta `up_to`."""
    if up_to is None:
        return
    plans = db.query(StudyPlan).filter(
        StudyPlan.user_id == user_id,
        StudyPlan.recurring_weekly.is_(True),
        StudyPlan.horizon_end.isnot(None),
        StudyPlan.horizon_end < up_to,
    ).all()
    if not plans:
        return
    for plan in plans:
        schedule = scheduling_service.parse_schedule(plan.schedule_json)
        occs = scheduling_service.occurrences_for_extension(
            schedule, _next_day(plan.horizon_end), up_to
        )
        for occ_date, start_time, planned_hours in occs:
            db.add(StudySession(
                user_id=user_id,
                plan_id=plan.id,
                category_id=plan.category_id,
                topic=plan.topic,
                date=occ_date,
                start_time=start_time,
                planned_hours=planned_hours,
                status=SessionStatus.planned.value,
            ))
        plan.horizon_end = up_to
    db.commit()


def _next_day(d: date) -> date:
    from datetime import timedelta
    return d + timedelta(days=1)


def delete_plan(db: Session, user_id: int, plan_id: int) -> dict:
    plan = db.query(StudyPlan).filter(
        StudyPlan.id == plan_id, StudyPlan.user_id == user_id
    ).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan no encontrado")
    deleted = db.query(StudySession).filter(StudySession.plan_id == plan_id).delete()
    db.delete(plan)
    db.commit()
    return {"message": "Plan eliminado", "deleted": deleted}


# --- Ocurrencias individuales --------------------------------------------

def list_sessions(
    db: Session,
    user_id: int,
    date_from: date | None = None,
    date_to: date | None = None,
    category_id: int | None = None,
    status: str | None = None,
) -> list[dict]:
    ensure_materialized(db, user_id, date_to)
    q = db.query(StudySession).filter(StudySession.user_id == user_id)
    if date_from:
        q = q.filter(StudySession.date >= date_from)
    if date_to:
        q = q.filter(StudySession.date <= date_to)
    if category_id:
        q = q.filter(StudySession.category_id == category_id)
    if status:
        q = q.filter(StudySession.status == status)
    sessions = q.order_by(StudySession.date.desc()).all()
    cache: dict[int, str] = {}
    return [_to_response(s, cache, db, user_id) for s in sessions]


def create(db: Session, user_id: int, data: SessionCreate) -> dict:
    _validate_category(db, user_id, data.category_id)
    s = StudySession(
        user_id=user_id,
        category_id=data.category_id,
        topic=data.topic,
        date=data.date,
        start_time=data.start_time,
        planned_hours=data.planned_hours,
        completed_hours=data.completed_hours,
        status=data.status.value,
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return _to_response(s, {}, db, user_id)


def get(db: Session, user_id: int, session_id: int) -> dict:
    return _to_response(_get_owned(db, user_id, session_id), {}, db, user_id)


def update(db: Session, user_id: int, session_id: int, data: SessionUpdate) -> dict:
    s = _get_owned(db, user_id, session_id)
    if data.category_id is not None:
        _validate_category(db, user_id, data.category_id)
        s.category_id = data.category_id
    for field in ("topic", "date", "start_time", "planned_hours", "completed_hours"):
        value = getattr(data, field)
        if value is not None:
            setattr(s, field, value)
    if data.status is not None:
        s.status = data.status.value
    if s.status == SessionStatus.completed.value and s.completed_hours is None:
        raise HTTPException(status_code=422, detail="completed_hours es obligatorio si status='completed'")
    db.commit()
    db.refresh(s)
    return _to_response(s, {}, db, user_id)


def delete(db: Session, user_id: int, session_id: int) -> dict:
    s = _get_owned(db, user_id, session_id)
    db.delete(s)
    db.commit()
    return {"message": "Sesión eliminada"}


def stats(db: Session, user_id: int, period: str, category_id: int | None = None) -> list[dict]:
    if period not in VALID_PERIODS:
        raise HTTPException(status_code=422, detail=f"period debe ser uno de {VALID_PERIODS}")

    q = db.query(StudySession).filter(StudySession.user_id == user_id)
    if category_id:
        q = q.filter(StudySession.category_id == category_id)
    sessions = q.all()

    buckets: dict[tuple[int, str], dict] = {}
    path_cache: dict[int, str] = {}
    for s in sessions:
        key = (s.category_id, period_key(s.date, period))
        bucket = buckets.setdefault(
            key, {"category_id": s.category_id, "period": key[1], "total_planned": 0.0, "total_completed": 0.0}
        )
        bucket["total_planned"] += s.planned_hours or 0.0
        bucket["total_completed"] += s.completed_hours or 0.0

    rows = []
    for bucket in buckets.values():
        cid = bucket["category_id"]
        if cid not in path_cache:
            path_cache[cid] = category_service.path_for(db, user_id, cid)
        bucket["category_path"] = path_cache[cid]
        rows.append(bucket)
    return sorted(rows, key=lambda r: (r["category_path"], r["period"]))
