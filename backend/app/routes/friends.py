from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database.connection import get_session
from app.models.user import User, Friendship, UserRead

router = APIRouter(prefix="/friends", tags=["Friends"])

@router.post("/{user_id}/add/{friend_id}")
def add_friend(user_id: int, friend_id: int, session: Session = Depends(get_session)):
    if user_id == friend_id:
        raise HTTPException(status_code=400, detail="You cannot add yourself as a friend")
    
    user = session.get(User, user_id)
    friend = session.get(User, friend_id)
    
    if not user or not friend:
        raise HTTPException(status_code=404, detail="User or friend not found")
    
    # Check if already friends
    statement = select(Friendship).where(
        (Friendship.user_id == user_id) & (Friendship.friend_id == friend_id)
    )
    existing_friendship = session.exec(statement).first()
    if existing_friendship:
        raise HTTPException(status_code=400, detail="Already friends")
    
    # Add bidirectional friendship
    friendship1 = Friendship(user_id=user_id, friend_id=friend_id)
    friendship2 = Friendship(user_id=friend_id, friend_id=user_id)
    
    session.add(friendship1)
    session.add(friendship2)
    session.commit()
    
    return {"message": f"Successfully added {friend.username} as friend"}

@router.get("/{user_id}", response_model=List[UserRead])
def list_friends(user_id: int, session: Session = Depends(get_session)):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user.friends
