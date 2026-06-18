import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Mr_Laptop.lk API"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./mr_laptop.db")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "super-secret-key-for-mr-laptop-lk-sri-lanka-2026")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # Cloudinary Config
    CLOUDINARY_CLOUD_NAME: Optional[str] = os.getenv("CLOUDINARY_CLOUD_NAME", "")
    CLOUDINARY_API_KEY: Optional[str] = os.getenv("CLOUDINARY_API_KEY", "")
    CLOUDINARY_API_SECRET: Optional[str] = os.getenv("CLOUDINARY_API_SECRET", "")
    
    # Admin Credentials
    ADMIN_EMAIL: str = os.getenv("ADMIN_EMAIL", "admin@mrlaptop.lk")
    ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "admin123")
    
    class Config:
        case_sensitive = True

settings = Settings()
