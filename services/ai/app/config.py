from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class AppSettings(BaseSettings):
    app_name: str = "manual-checklist-ai"
    app_env: str = "development"
    app_port: int = 8001
    dmr_base_url: str = "http://localhost:12434/engines/v1"
    dmr_model: str = "ai/gemma4:4B-Q4_K_XL"
    request_timeout_seconds: int = 90
    strict_citations_default: bool = True
    storage_root: Path = Path(__file__).resolve().parents[1] / "storage"
    pageindex_base_url: str = "https://api.pageindex.ai"
    pageindex_api_key: str | None = None
    pageindex_poll_interval_seconds: int = 5
    pageindex_poll_timeout_seconds: int = 240

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )


settings = AppSettings()
settings.storage_root.mkdir(parents=True, exist_ok=True)
