from typing import List
from fastapi import HTTPException, status
from sqlmodel import Session, select
from app.models.user import User, Group, GroupMember, GroupCreate

class GroupService:
    @staticmethod
    def create_group(session: Session, group_in: GroupCreate, creator_id: int) -> Group:
        # Create group with creator_id
        db_group = Group.model_validate(group_in, update={"creator_id": creator_id})
        session.add(db_group)
        session.commit()
        session.refresh(db_group)
        
        # Add creator as first member
        member = GroupMember(group_id=db_group.id, user_id=creator_id)
        session.add(member)
        session.commit()
        return db_group

    @staticmethod
    def update_group(session: Session, group_id: int, group_in: GroupCreate, admin_id: int) -> Group:
        group = session.get(Group, group_id)
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")
        if group.creator_id != admin_id:
            raise HTTPException(status_code=403, detail="Only the admin can update this group")
        
        group_data = group_in.model_dump(exclude_unset=True)
        for key, value in group_data.items():
            setattr(group, key, value)
        
        session.add(group)
        session.commit()
        session.refresh(group)
        return group

    @staticmethod
    def delete_group(session: Session, group_id: int, admin_id: int):
        group = session.get(Group, group_id)
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")
        if group.creator_id != admin_id:
            raise HTTPException(status_code=403, detail="Only the admin can delete this group")
        
        # Delete member associations first (clean cleanup)
        statement = select(GroupMember).where(GroupMember.group_id == group_id)
        memberships = session.exec(statement).all()
        for m in memberships:
            session.delete(m)
            
        session.delete(group)
        session.commit()
        return {"message": "Group deleted successfully"}

    @staticmethod
    def add_member(session: Session, group_id: int, user_id: int, admin_id: int):
        group = session.get(Group, group_id)
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")
        if group.creator_id != admin_id:
            raise HTTPException(status_code=403, detail="Only the admin can add members")
            
        user = session.get(User, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        statement = select(GroupMember).where(
            (GroupMember.group_id == group_id) & (GroupMember.user_id == user_id)
        )
        if session.exec(statement).first():
            raise HTTPException(status_code=400, detail="User already in squad")
            
        new_member = GroupMember(group_id=group_id, user_id=user_id)
        session.add(new_member)
        session.commit()
        return {"message": "Member added successfully"}

    @staticmethod
    def remove_member(session: Session, group_id: int, user_id: int, requestor_id: int):
        group = session.get(Group, group_id)
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")
            
        # Admin can kick anyone, User can only leave themselves
        is_admin = group.creator_id == requestor_id
        is_self_leaving = user_id == requestor_id
        
        if not (is_admin or is_self_leaving):
            raise HTTPException(status_code=403, detail="Unauthorized to remove this member")
            
        # Creator cannot leave their own group (must delete it or transfer - not implemented yet)
        if is_self_leaving and is_admin:
             raise HTTPException(status_code=400, detail="Admins cannot leave their own squad. Delete the squad instead.")

        statement = select(GroupMember).where(
            (GroupMember.group_id == group_id) & (GroupMember.user_id == user_id)
        )
        membership = session.exec(statement).first()
        if not membership:
            raise HTTPException(status_code=404, detail="Membership not found")
            
        session.delete(membership)
        session.commit()
        return {"message": "Removed from squad successfully"}

