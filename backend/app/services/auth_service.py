from fastapi import HTTPException, status
from sqlmodel import Session, select
from app.models.user import User, UserCreate, UserLogin, Token
from app.utils.security import hash_password, verify_password, create_access_token

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
