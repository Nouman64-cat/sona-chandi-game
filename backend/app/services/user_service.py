from typing import List
from fastapi import HTTPException, status
from sqlmodel import Session, select
from app.models.user import User, Friendship

class UserService:
    @staticmethod
    def search_users(session: Session, query: str) -> List[User]:
        statement = select(User).where(
            (User.username.contains(query)) | (User.full_name.contains(query))
        )
        return session.exec(statement).all()

    @staticmethod
    def add_friend(session: Session, user_id: int, friend_id: int):
        if user_id == friend_id:
            raise HTTPException(status_code=400, detail="You cannot add yourself")
        
        user = session.get(User, user_id)
        friend = session.get(User, friend_id)
        
        if not user or not friend:
            raise HTTPException(status_code=404, detail="User or friend not found")
        
        # Check existing
        statement = select(Friendship).where(
            (Friendship.user_id == user_id) & (Friendship.friend_id == friend_id)
        )
        if session.exec(statement).first():
            raise HTTPException(status_code=400, detail="Already friends")
            
        f1 = Friendship(user_id=user_id, friend_id=friend_id)
        f2 = Friendship(user_id=friend_id, friend_id=user_id)
        session.add(f1)
        session.add(f2)
        session.commit()
        return {"message": "Friend added successfully"}

    @staticmethod
    def remove_friend(session: Session, user_id: int, friend_id: int):
        statement = select(Friendship).where(
            ((Friendship.user_id == user_id) & (Friendship.friend_id == friend_id)) |
            ((Friendship.user_id == friend_id) & (Friendship.friend_id == user_id))
        )
        results = session.exec(statement).all()
        if not results:
            raise HTTPException(status_code=404, detail="Friendship not found")
        
        for r in results:
            session.delete(r)
        session.commit()
        return {"message": "Friend removed successfully"}
