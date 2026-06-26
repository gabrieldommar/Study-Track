"""Lógica de negocio de categorías, incluyendo el cálculo de full_path."""
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.study_session import StudySession
from app.schemas.category import CategoryCreate, CategoryUpdate


def _build_path(cat: Category, by_id: dict[int, Category]) -> str:
    """Construye 'Padre > Hijo' subiendo por parent_id usando un mapa en memoria."""
    parts = [cat.name]
    current = cat
    seen = {cat.id}
    while current.parent_id and current.parent_id in by_id:
        current = by_id[current.parent_id]
        if current.id in seen:  # corta ciclos defensivamente
            break
        seen.add(current.id)
        parts.append(current.name)
    return " > ".join(reversed(parts))


def _to_response(cat: Category, by_id: dict[int, Category]) -> dict:
    return {
        "id": cat.id,
        "name": cat.name,
        "parent_id": cat.parent_id,
        "full_path": _build_path(cat, by_id),
    }


def _user_categories_map(db: Session, user_id: int) -> dict[int, Category]:
    cats = db.query(Category).filter(Category.user_id == user_id).all()
    return {c.id: c for c in cats}


def _get_owned(db: Session, user_id: int, category_id: int) -> Category:
    cat = db.query(Category).filter(
        Category.id == category_id, Category.user_id == user_id
    ).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    return cat


def list_categories(db: Session, user_id: int) -> list[dict]:
    by_id = _user_categories_map(db, user_id)
    return [_to_response(c, by_id) for c in by_id.values()]


def create(db: Session, user_id: int, data: CategoryCreate) -> dict:
    if data.parent_id is not None:
        _get_owned(db, user_id, data.parent_id)  # valida que el padre sea del usuario
    cat = Category(user_id=user_id, name=data.name, parent_id=data.parent_id)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return _to_response(cat, _user_categories_map(db, user_id))


def update(db: Session, user_id: int, category_id: int, data: CategoryUpdate) -> dict:
    cat = _get_owned(db, user_id, category_id)
    if data.name is not None:
        cat.name = data.name
    if data.parent_id is not None:
        if data.parent_id == category_id:
            raise HTTPException(status_code=422, detail="Una categoría no puede ser su propio padre")
        _get_owned(db, user_id, data.parent_id)
        cat.parent_id = data.parent_id
    db.commit()
    db.refresh(cat)
    return _to_response(cat, _user_categories_map(db, user_id))


def delete(db: Session, user_id: int, category_id: int) -> dict:
    cat = _get_owned(db, user_id, category_id)
    # Bloquea el borrado si la categoría tiene sesiones asociadas (sugerencia del review)
    has_sessions = db.query(StudySession).filter(StudySession.category_id == category_id).first()
    if has_sessions:
        raise HTTPException(
            status_code=409, detail="No se puede eliminar: la categoría tiene sesiones asociadas"
        )
    has_children = db.query(Category).filter(Category.parent_id == category_id).first()
    if has_children:
        raise HTTPException(
            status_code=409, detail="No se puede eliminar: la categoría tiene subcategorías"
        )
    db.delete(cat)
    db.commit()
    return {"message": "Categoría eliminada"}


def path_for(db: Session, user_id: int, category_id: int) -> str:
    """Helper público para que otros servicios obtengan el full_path de una categoría."""
    by_id = _user_categories_map(db, user_id)
    cat = by_id.get(category_id)
    return _build_path(cat, by_id) if cat else ""
