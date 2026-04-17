from fastapi import APIRouter, Depends, status
from sqlmodel import Session
from app.database.connection import get_session
from app.models.user import UserCreate, UserRead, UserLogin, Token
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, session: Session = Depends(get_session)):
    return AuthService.register_user(session, user_in)

@router.post("/login", response_model=Token)
def login(user_login: UserLogin, session: Session = Depends(get_session)):
    return AuthService.authenticate_user(session, user_login)
