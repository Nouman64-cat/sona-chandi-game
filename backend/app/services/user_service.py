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
            
        # Get list of friendships for the searcher to determine status
        friend_statement = select(Friendship).where(Friendship.user_id == searcher_id)
        friendships = session.exec(friend_statement).all()
        
        # Build maps for quick lookup
        friend_status_map = {f.friend_id: f.status for f in friendships}
        
        results = []
        for u in users:
            user_data = u.model_dump()
            is_friend = friend_status_map.get(u.id) == "accepted"
            is_pending = friend_status_map.get(u.id) == "pending"
            
            user_data["is_friend"] = is_friend
            user_data["is_pending"] = is_pending
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
        
        # Check if any relationship already exists (pending or accepted)
        statement = select(Friendship).where(
            (Friendship.user_id == user_id) & (Friendship.friend_id == friend_id)
        )
        existing = session.exec(statement).first()
        if existing:
            if existing.status == "accepted":
                raise HTTPException(status_code=400, detail="Already friends")
            else:
                raise HTTPException(status_code=400, detail="Friend request already sent")
            
        # Create single pending record from Requester to Receiver
        f_request = Friendship(user_id=user_id, friend_id=friend_id, status="pending")
        session.add(f_request)
        session.commit()
        return {"message": "Friend request sent successfully"}

    @staticmethod
    def accept_friend(session: Session, user_id: int, requester_id: int):
        # A wants to be friends with B. B (user_id) accepts A (requester_id).
        # 1. Find the pending record (requester_id -> user_id)
        statement = select(Friendship).where(
            (Friendship.user_id == requester_id) & (Friendship.friend_id == user_id) & (Friendship.status == "pending")
        )
        request = session.exec(statement).first()
        if not request:
            raise HTTPException(status_code=404, detail="Friend request not found")
            
        # Update requester's record to accepted
        request.status = "accepted"
        
        # 2. Handle symmetric record for the one who accepted (user_id -> requester_id)
        # Check if it already exists (could happen if both sent requests)
        symmetric_stmt = select(Friendship).where(
            (Friendship.user_id == user_id) & (Friendship.friend_id == requester_id)
        )
        symmetric = session.exec(symmetric_stmt).first()
        
        if symmetric:
            symmetric.status = "accepted"
        else:
            symmetric = Friendship(user_id=user_id, friend_id=requester_id, status="accepted")
            session.add(symmetric)
            
        session.commit()
        return {"message": "Friend request accepted"}

    @staticmethod
    def decline_friend(session: Session, user_id: int, requester_id: int):
        # B (user_id) declines A (requester_id)
        statement = select(Friendship).where(
            (Friendship.user_id == requester_id) & (Friendship.friend_id == user_id) & (Friendship.status == "pending")
        )
        request = session.exec(statement).first()
        if not request:
            raise HTTPException(status_code=404, detail="Friend request not found")
            
        session.delete(request)
        session.commit()
        return {"message": "Friend request declined"}

    @staticmethod
    def get_pending_requests(session: Session, user_id: int):
        # Fetch users who sent pending requests to user_id
        statement = select(User).join(
            Friendship, User.id == Friendship.user_id
        ).where(
            (Friendship.friend_id == user_id) & (Friendship.status == "pending")
        )
        return session.exec(statement).all()

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
