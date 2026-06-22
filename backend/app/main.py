from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from app.config import settings
from app.database import engine, Base
from app.routers import auth, products, orders, analytics, admin_users, contact

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for Mr_Laptop.lk - Sri Lankan Tech E-commerce Platform",
    version="1.0.0"

    
)
@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)

# Setup CORS
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://localhost:3000",
    "https://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "https://mr-laptop-lk.vercel.app"
    # Add other domains as needed for production deployment
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix="/api")
app.include_router(products.router, prefix="/api")
app.include_router(orders.router, prefix="/api")
app.include_router(orders.admin_router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(admin_users.router, prefix="/api")
app.include_router(contact.router, prefix="/api")


@app.get("/")
def read_root():
    return {
        "message": "Welcome to Mr_Laptop.lk API",
        "status": "online",
        "documentation": "/docs"
    }

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
