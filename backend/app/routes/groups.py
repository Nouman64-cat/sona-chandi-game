from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database.connection import get_session
from app.models.user import User, Group, GroupMember, GroupCreate, UserRead

router = APIRouter(prefix="/groups", tags=["Groups"])

@router.post("/", response_model=Group)
def create_group(group: GroupCreate, creator_id: int, session: Session = Depends(get_session)):
    creator = session.get(User, creator_id)
    if not creator:
        raise HTTPException(status_code=404, detail="Creator not found")
    
    db_group = Group.model_validate(group)
    session.add(db_group)
    session.commit()
    session.refresh(db_group)
    
    # Add creator as the first member
    member = GroupMember(group_id=db_group.id, user_id=creator_id)
    session.add(member)
    session.commit()
    
    return db_group

@router.post("/{group_id}/add-member/{user_id}")
def add_member(group_id: int, user_id: int, session: Session = Depends(get_session)):
    group = session.get(Group, group_id)
    user = session.get(User, user_id)
    
    if not group or not user:
        raise HTTPException(status_code=404, detail="Group or User not found")
    
    # Check if already a member
    statement = select(GroupMember).where(
        (GroupMember.group_id == group_id) & (GroupMember.user_id == user_id)
    )
    existing_member = session.exec(statement).first()
    if existing_member:
        raise HTTPException(status_code=400, detail="User is already a member of this group")
    
    member = GroupMember(group_id=group_id, user_id=user_id)
    session.add(member)
    session.commit()
    
    return {"message": f"Added {user.username} to group {group.name}"}

@router.get("/{group_id}/members", response_model=List[UserRead])
def list_group_members(group_id: int, session: Session = Depends(get_session)):
    group = session.get(Group, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    return group.members
