"""
TraceDoc – Application Settings
Loaded from environment variables / .env file via Pydantic BaseSettings.
All directory paths are anchored to the project root for rock-solid cross-platform execution.
"""
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Canonical project root directory (Data-ops)
_CURRENT_FILE = Path(__file__).resolve()
# app is parent, backend is parent.parent, project root is parent.parent.parent
PROJECT_ROOT = _CURRENT_FILE.parent.parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(PROJECT_ROOT / "backend" / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # App
    app_env: str = "development"
    app_version: str = "1.1.0"
    secret_key: str = "change-me-in-production"

    # Canonical paths anchored to project root
    project_root: Path = PROJECT_ROOT
    data_dir: Path = PROJECT_ROOT / "data"
    originals_dir: Path = PROJECT_ROOT / "data" / "originals"
    derivatives_dir: Path = PROJECT_ROOT / "data" / "derivatives"

    # Database path
    db_path: Path = PROJECT_ROOT / "tracedoc.db"
    database_url: str = f"sqlite+aiosqlite:///{PROJECT_ROOT / 'tracedoc.db'}"

    # Upload limits
    max_file_size_mb: int = 50
    max_pages: int = 200

    # Z3 solver timeout (milliseconds)
    z3_timeout_ms: int = 5000

    # OCR settings
    ocr_confidence_threshold: float = 0.6
    ocr_min_chars_for_native: int = 50

    # LLM (optional - template fallback used when empty)
    ollama_base_url: str = ""
    ollama_model: str = ""

    # CORS
    frontend_url: str = "http://localhost:3000"

    # Phoenix (P1)
    phoenix_enabled: bool = False
    phoenix_endpoint: str = "http://localhost:6006"

    @property
    def is_dev(self) -> bool:
        return self.app_env == "development"


settings = Settings()
