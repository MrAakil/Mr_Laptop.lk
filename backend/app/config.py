import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Mr_Laptop.lk API"
    DATABASE_URL: str = "sqlite:///./mr_laptop.db"
    JWT_SECRET: str = "super-secret-key-for-mr-laptop-lk-sri-lanka-2026"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # Cloudinary Config
    CLOUDINARY_CLOUD_NAME: Optional[str] = ""
    CLOUDINARY_API_KEY: Optional[str] = ""
    CLOUDINARY_API_SECRET: Optional[str] = ""
    
    # Admin Credentials
    ADMIN_EMAIL: str = "admin@mrlaptop.lk"
    ADMIN_PASSWORD: str = "admin123"

    # Email Integration Config
    RESEND_API_KEY: Optional[str] = ""
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = ""
    SMTP_PASSWORD: Optional[str] = ""
    SMTP_FROM: str = "mrlaptopsales@gmail.com"
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()

