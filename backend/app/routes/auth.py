from fastapi import APIRouter, Depends, status, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlmodel import Session
from app.database.connection import get_session
from app.models.user import User, UserCreate, UserRead, UserLogin, Token
from app.services.auth_service import AuthService
from app.config.settings import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), session: Session = Depends(get_session)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = session.get(User, int(user_id))
    if user is None:
        raise credentials_exception
    return user

@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, session: Session = Depends(get_session)):
    return AuthService.register_user(session, user_in)

@router.post("/login", response_model=Token)
def login(user_login: UserLogin, session: Session = Depends(get_session)):
    return AuthService.authenticate_user(session, user_login)

@router.get("/me", response_model=UserRead)
def get_me(current_user: User = Depends(get_current_user)):
    """Security Handshake: Verify legend's identity still exists in the archives."""
    return current_user
