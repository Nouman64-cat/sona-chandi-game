from typing import List
from fastapi import APIRouter, Depends
from sqlmodel import Session
from app.database.connection import get_session
from app.models.user import Group, GroupCreate, UserRead, GroupRead
from app.services.group_service import GroupService

router = APIRouter(prefix="/groups", tags=["Groups"])

@router.post("/", response_model=GroupRead)
def create_group(group: GroupCreate, creator_id: int, session: Session = Depends(get_session)):
    return GroupService.create_group(session, group, creator_id)

@router.post("/{group_id}/add-member/{user_id}")
def add_member(group_id: int, user_id: int, session: Session = Depends(get_session)):
    return GroupService.add_member(session, group_id, user_id)

@router.delete("/{group_id}/leave/{user_id}")
def leave_group(group_id: int, user_id: int, session: Session = Depends(get_session)):
    return GroupService.leave_group(session, group_id, user_id)

@router.get("/{group_id}/members", response_model=List[UserRead])
def list_group_members(group_id: int, session: Session = Depends(get_session)):
    from app.models.user import Group
    group = session.get(Group, group_id)
    return group.members if group else []
