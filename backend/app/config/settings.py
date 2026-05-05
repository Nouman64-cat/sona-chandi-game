from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str = "supersecretkeychangeitforproduction"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 1 week
    
    # S3 Integration
    S3_BUCKET_NAME: Optional[str] = None
    IAM_USER_ACCESS_KEY: Optional[str] = None
    IAM_USER_SECRET_ACCESS_KEY: Optional[str] = None

    # AWS SES Email
    AWS_SES_FROM_EMAIL: Optional[str] = None
    AWS_SES_USERNAME: Optional[str] = None
    AWS_SES_PASSWORD: Optional[str] = None
    AWS_SES_SMTP_HOST: str = "email-smtp.us-east-1.amazonaws.com"
    AWS_SES_SMTP_PORT: int = 587

    # Frontend
    FRONTEND_URL: str = "https://sona-chandi-game-xrz3.vercel.app"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
