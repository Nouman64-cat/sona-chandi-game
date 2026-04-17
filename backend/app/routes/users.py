from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from app.database.connection import get_session
from app.models.user import User, UserCreate, UserRead

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("/", response_model=UserRead)
def create_user(user: UserCreate, session: Session = Depends(get_session)):
    # Check if username or email already exists
    statement = select(User).where((User.username == user.username) | (User.email == user.email))
    existing_user = session.exec(statement).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or email already exists")
    
    db_user = User.model_validate(user)
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user

@router.get("/search", response_model=List[UserRead])
def search_users(
    query: str = Query(..., min_length=1), 
    session: Session = Depends(get_session)
):
    # Search by username or full name
    statement = select(User).where(
        (User.username.contains(query)) | (User.full_name.contains(query))
    )
    users = session.exec(statement).all()
    return users
