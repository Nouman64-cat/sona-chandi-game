from typing import List
from fastapi import HTTPException, status
from sqlmodel import Session, select
from app.models.user import User, Friendship

class UserService:
    @staticmethod
    def search_users(session: Session, query: str = "", searcher_id: int = None) -> List[dict]:
        query = query.strip()
        if not query:
            # Return most recent 20 users by default
            statement = select(User).order_by(User.id.desc()).limit(20)
        else:
            statement = select(User).where(
                (User.username.ilike(f"%{query}%")) | (User.full_name.ilike(f"%{query}%"))
            )
            
        # Exclude self if searcher_id is provided
        if searcher_id:
            statement = statement.where(User.id != searcher_id)



        users = session.exec(statement).all()
        
        # If no searcher_id, just return standard read models
        if not searcher_id:
            return [u.model_dump() for u in users]
            
        # Get list of friend IDs for the searcher
        friend_statement = select(Friendship.friend_id).where(Friendship.user_id == searcher_id)
        friend_ids = set(session.exec(friend_statement).all())
        
        results = []
        for u in users:
            user_data = u.model_dump()
            user_data["is_friend"] = u.id in friend_ids
            user_data["is_self"] = u.id == searcher_id
            results.append(user_data)
            
        return results


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
