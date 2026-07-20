"""
Configuration centralisée de l'application.

Toutes les variables d'environnement sont lues ICI et nulle part ailleurs.
Les valeurs sont chargées depuis le fichier `.env` (à la racine de `backend/`)
puis exposées via l'objet `settings`.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # --- Base de données ---
    DATABASE_URL: str = "sqlite+aiosqlite:///./dwwm_simulator.db"

    # --- Serveur ---
    PORT: int = 8000

    # --- Fournisseur IA (Google Gemini) ---
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.0-flash"

    # --- CORS : origines autorisées (séparées par des virgules dans le .env) ---
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    # --- Limites d'upload ---
    MAX_UPLOAD_SIZE_MB: int = 20

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origins_list(self) -> list[str]:
        """Retourne la liste des origines CORS à partir de la chaîne séparée par virgules."""
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def gemini_configured(self) -> bool:
        """Vrai si une clé Gemini est renseignée."""
        return bool(self.GEMINI_API_KEY)


# Instance unique importée par le reste de l'application.
settings = Settings()
