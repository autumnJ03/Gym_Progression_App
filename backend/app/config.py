from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    jwt_secret: str
    jwt_expire_days: int = 30
    sentry_dsn: str = ""
    allowed_origins: str = "*"

    model_config = {"env_file": ".env"}


settings = Settings()
