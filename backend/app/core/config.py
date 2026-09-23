from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/waste2value"
    cors_origins: str = "http://localhost:5173"
    data_mode: str = "simulation"
    simulation_interval_seconds: int = 2
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
