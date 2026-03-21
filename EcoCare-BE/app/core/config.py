from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "EcoCare Backend API"
    app_env: str = "development"
    api_prefix: str = "/api"
    processed_data_dir: str = "../Dataset/ProcessedData"
    processed_models_dir: str = "../Dataset/ProcessedData/models"

    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_db: str = "ecocare"
    postgres_user: str = "ecocare"
    postgres_password: str = "ecocare"

    database_url: str = ""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def sqlalchemy_database_uri(self) -> str:
        if self.database_url:
            return self.database_url
        return (
            f"postgresql+psycopg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def backend_root(self) -> Path:
        return Path(__file__).resolve().parents[2]

    @property
    def processed_data_path(self) -> Path:
        return (self.backend_root / self.processed_data_dir).resolve()

    @property
    def processed_models_path(self) -> Path:
        return (self.backend_root / self.processed_models_dir).resolve()


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
