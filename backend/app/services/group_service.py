from typing import List
from fastapi import HTTPException, status
from sqlmodel import Session, select
from app.models.user import User, Group, GroupMember, GroupCreate

class GroupService:
    @staticmethod
    def create_group(session: Session, group_in: GroupCreate, creator_id: int) -> Group:
        db_group = Group.model_validate(group_in)
        session.add(db_group)
        session.commit()
        session.refresh(db_group)
        
        # Add creator as member
        member = GroupMember(group_id=db_group.id, user_id=creator_id)
        session.add(member)
        session.commit()
        return db_group

    @staticmethod
    def add_member(session: Session, group_id: int, user_id: int):
        group = session.get(Group, group_id)
        user = session.get(User, user_id)
        if not group or not user:
            raise HTTPException(status_code=404, detail="Group or User not found")
            
        statement = select(GroupMember).where(
            (GroupMember.group_id == group_id) & (GroupMember.user_id == user_id)
        )
        if session.exec(statement).first():
            raise HTTPException(status_code=400, detail="User already in group")
            
        new_member = GroupMember(group_id=group_id, user_id=user_id)
        session.add(new_member)
        session.commit()
        return {"message": "Member added successfully"}

    @staticmethod
    def leave_group(session: Session, group_id: int, user_id: int):
        statement = select(GroupMember).where(
            (GroupMember.group_id == group_id) & (GroupMember.user_id == user_id)
        )
        membership = session.exec(statement).first()
        if not membership:
            raise HTTPException(status_code=404, detail="Membership not found")
            
        session.delete(membership)
        session.commit()
        return {"message": "Left group successfully"}
