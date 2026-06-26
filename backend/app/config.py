"""Configuración central de la aplicación leída desde variables de entorno."""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Base de datos
    database_url: str = "sqlite:///./studytrack.db"

    # Autenticación JWT
    jwt_secret: str
    jwt_expire_hours: int = 24

    # Google OAuth
    google_client_id: str = ""
    google_client_secret: str = ""

    # CORS / entorno
    allowed_origins: str = "http://localhost:5173"
    debug: bool = False

    class Config:
        env_file = ".env"

    @property
    def origins_list(self) -> list[str]:
        # Convierte la lista separada por comas en una lista de orígenes
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]


settings = Settings()
