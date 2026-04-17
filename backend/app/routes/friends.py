from typing import List
from fastapi import APIRouter, Depends
from sqlmodel import Session
from app.database.connection import get_session
from app.models.user import UserRead
from app.services.user_service import UserService

router = APIRouter(prefix="/friends", tags=["Friends"])

@router.post("/{user_id}/add/{friend_id}")
def add_friend(user_id: int, friend_id: int, session: Session = Depends(get_session)):
    return UserService.add_friend(session, user_id, friend_id)

@router.delete("/{user_id}/remove/{friend_id}")
def unfriend(user_id: int, friend_id: int, session: Session = Depends(get_session)):
    return UserService.remove_friend(session, user_id, friend_id)

@router.get("/{user_id}", response_model=List[UserRead])
def list_friends(user_id: int, session: Session = Depends(get_session)):
    from sqlmodel import select
    from app.models.user import User
    user = session.get(User, user_id)
    return user.friends if user else []
