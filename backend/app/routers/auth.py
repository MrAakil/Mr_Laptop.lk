from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session
import logging

from app import models, schemas
from app.auth import get_password_hash, verify_password, create_access_token, get_current_user
from app.database import get_db
from app.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])
logger = logging.getLogger(__name__)

@router.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists (case-insensitive check)
    existing_user = db.query(models.User).filter(func.lower(models.User.email) == func.lower(user_data.email)).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address is already registered"
        )
    
    try:
        hashed_pw = get_password_hash(user_data.password)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc)
        ) from exc

    # Dynamically assign role: if registered email matches ADMIN_EMAIL config, make it an admin
    role = "admin" if user_data.email.lower() == settings.ADMIN_EMAIL.lower() else "customer"

    new_user = models.User(
        email=user_data.email,
        hashed_password=hashed_pw,
        full_name=user_data.full_name,
        phone=user_data.phone,
        address=user_data.address,
        role=role
    )

    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address is already registered"
        ) from exc
    except SQLAlchemyError as exc:
        db.rollback()
        logger.exception("Database error while registering user")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not create user account"
        ) from exc

    return new_user

@router.post("/login", response_model=schemas.Token)
def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    print("request:", request)
    user = db.query(models.User).filter(func.lower(models.User.email) == func.lower(form_data.username)).first()
    print("user:", user)
    print("login_attempt:", {"username": form_data.username, "success": user is not None})
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Block suspended / soft-deleted accounts
    if getattr(user, "account_status", "active") in ("suspended", "deleted"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been suspended. Please contact support.",
        )

    # Record last login timestamp
    import datetime as _dt
    user.last_login = _dt.datetime.utcnow()
    db.commit()
    
    # Generate access token
    access_token = create_access_token(
        data={
            "sub": user.email,
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "is_admin": user.role == "admin"
        }
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@router.post("/forgot-password")
def forgot_password(req: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    # Simulated password reset
    user = db.query(models.User).filter(models.User.email == req.email).first()
    # To prevent enumeration, we always return a success message
    return {"message": "If this email exists in our system, a password reset link has been sent to it."}
