from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Business rules
    LOAN_PERIOD_DAYS: int = 14
    MAX_CONCURRENT_BORROWS_PER_STUDENT: int = 5

    class Config:
        env_file = ".env"


settings = Settings()
