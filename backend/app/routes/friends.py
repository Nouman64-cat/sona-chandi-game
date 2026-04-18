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

@router.get("/{user_id}/requests", response_model=List[UserRead])
def list_requests(user_id: int, session: Session = Depends(get_session)):
    return UserService.get_pending_requests(session, user_id)

@router.post("/{user_id}/accept/{requester_id}")
def accept_friend(user_id: int, requester_id: int, session: Session = Depends(get_session)):
    return UserService.accept_friend(session, user_id, requester_id)

@router.post("/{user_id}/decline/{requester_id}")
def decline_friend(user_id: int, requester_id: int, session: Session = Depends(get_session)):
    return UserService.decline_friend(session, user_id, requester_id)

@router.delete("/{user_id}/remove/{friend_id}")
def unfriend(user_id: int, friend_id: int, session: Session = Depends(get_session)):
    return UserService.remove_friend(session, user_id, friend_id)

@router.get("/{user_id}", response_model=List[UserRead])
def list_friends(user_id: int, session: Session = Depends(get_session)):
    from sqlmodel import select
    from app.models.user import User, Friendship
    
    # Manually query accepted friends
    statement = select(User).join(
        Friendship, User.id == Friendship.friend_id
    ).where(
        (Friendship.user_id == user_id) & (Friendship.status == "accepted")
    )
    return session.exec(statement).all()
