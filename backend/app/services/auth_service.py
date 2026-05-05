import secrets
import time
from fastapi import HTTPException, status
from sqlmodel import Session, select
from app.models.user import User, UserCreate, UserLogin, Token
from app.utils.security import hash_password, verify_password, create_access_token
from app.services.email_service import EmailService

class AuthService:
    @staticmethod
    def register_user(session: Session, user_in: UserCreate) -> User:
        # Check if user already exists
        statement = select(User).where((User.username == user_in.username) | (User.email == user_in.email))
        existing_user = session.exec(statement).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username or email already registered"
            )
        
        # Create new user with hashed password
        hashed_pwd = hash_password(user_in.password)
        db_user = User.model_validate(user_in, update={"password": hashed_pwd})
        session.add(db_user)
        session.commit()
        session.refresh(db_user)
        return db_user

    @staticmethod
    def authenticate_user(session: Session, user_login: UserLogin) -> Token:
        statement = select(User).where(User.username == user_login.username)
        user = session.exec(statement).first()
        if not user or not verify_password(user_login.password, user.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        access_token = create_access_token(
            subject=user.id,
            data={
                "username": user.username,
                "full_name": user.full_name,
                "is_admin": user.is_admin
            }
        )
        return Token(access_token=access_token, token_type="bearer", gender=user.gender)

    @staticmethod
    def forgot_password(session: Session, email: str) -> None:
        user = session.exec(select(User).where(User.email == email)).first()
        if not user:
            return  # Don't reveal whether the email is registered

        token = secrets.token_urlsafe(32)
        user.reset_token = token
        user.reset_token_expires = int(time.time()) + 3600  # 1 hour
        session.add(user)
        session.commit()

        EmailService.send_password_reset(user.email, user.full_name, token)

    @staticmethod
    def reset_password(session: Session, token: str, new_password: str) -> None:
        user = session.exec(select(User).where(User.reset_token == token)).first()
        if not user or not user.reset_token_expires or user.reset_token_expires < int(time.time()):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token."
            )

        user.password = hash_password(new_password)
        user.reset_token = None
        user.reset_token_expires = None
        session.add(user)
        session.commit()
