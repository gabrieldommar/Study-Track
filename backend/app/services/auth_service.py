"""Lógica de negocio de autenticación: registro, login y login con Google."""
from fastapi import HTTPException
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from sqlalchemy.orm import Session

from app.config import settings
from app.models.user import User
from app.schemas.auth import GoogleLoginRequest, LoginRequest, RegisterRequest
from app.security import create_access_token, hash_password, verify_password


def register(db: Session, data: RegisterRequest) -> tuple[str, User]:
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=409, detail="El email ya está registrado")

    user = User(name=data.name, email=data.email, password_hash=hash_password(data.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return create_access_token(user.id), user


def login(db: Session, data: LoginRequest) -> tuple[str, User]:
    user = db.query(User).filter(User.email == data.email).first()
    # Mensaje genérico para no revelar si el email existe
    if not user or not user.password_hash or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    return create_access_token(user.id), user


def google_login(db: Session, data: GoogleLoginRequest) -> tuple[str, User]:
    if not settings.google_client_id:
        raise HTTPException(status_code=500, detail="Google OAuth no está configurado en el servidor")

    # Verifica la firma y el audience del id_token contra el client_id propio
    try:
        info = google_id_token.verify_oauth2_token(
            data.id_token, google_requests.Request(), settings.google_client_id
        )
    except ValueError:
        raise HTTPException(status_code=401, detail="Token de Google inválido")

    email = info.get("email")
    google_sub = info.get("sub")
    if not email or not google_sub:
        raise HTTPException(status_code=401, detail="El token de Google no contiene email")

    # Busca por google_id; si no, vincula una cuenta existente por email; si no, la crea
    user = db.query(User).filter(User.google_id == google_sub).first()
    if not user:
        user = db.query(User).filter(User.email == email).first()
        if user:
            user.google_id = google_sub
        else:
            user = User(name=info.get("name", email), email=email, google_id=google_sub)
            db.add(user)
        db.commit()
        db.refresh(user)

    return create_access_token(user.id), user
