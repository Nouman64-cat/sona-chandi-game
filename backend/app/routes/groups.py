from typing import List
from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from app.database.connection import get_session
from app.models.user import Group, GroupCreate, UserRead, GroupRead, GroupMember
from app.services.group_service import GroupService

router = APIRouter(prefix="/groups", tags=["Groups"])

from app.routes.auth import get_current_user
from app.models.user import User

@router.get("/", response_model=List[GroupRead])
def list_groups(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Retrieve only the squads this legend is authorized to view."""
    return current_user.groups

@router.post("/", response_model=GroupRead)

def create_group(group_in: GroupCreate, creator_id: int, session: Session = Depends(get_session)):
    return GroupService.create_group(session, group_in, creator_id)

@router.put("/{id}", response_model=GroupRead)
def update_group(id: int, group_in: GroupCreate, admin_id: int, session: Session = Depends(get_session)):
    return GroupService.update_group(session, id, group_in, admin_id)

@router.delete("/{id}")
def delete_group(id: int, admin_id: int, session: Session = Depends(get_session)):
    return GroupService.delete_group(session, id, admin_id)

@router.post("/{id}/add-member/{user_id}")
def add_member(id: int, user_id: int, admin_id: int, session: Session = Depends(get_session)):
    return GroupService.add_member(session, id, user_id, admin_id)

@router.post("/{id}/leave/{user_id}")
def leave_group(id: int, user_id: int, requestor_id: int, session: Session = Depends(get_session)):
    return GroupService.remove_member(session, id, user_id, requestor_id)


@router.post("/join/{code}")
def join_by_beacon(code: str, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    return GroupService.join_by_beacon(session, current_user.id, code)

@router.post("/{id}/beacon/refresh")
def refresh_beacon(id: int, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    return GroupService.refresh_beacon(session, id, current_user.id)

@router.post("/{id}/heartbeat")
def heartbeat(id: int, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    return GroupService.update_arena_presence(session, id, current_user.id)

@router.get("/{group_id}/members")
def list_group_members(group_id: int, session: Session = Depends(get_session)):
    # Return members with their readiness and online status
    import time
    statement = select(User, GroupMember.is_ready, GroupMember.last_arena_heartbeat).join(GroupMember).where(GroupMember.group_id == group_id)
    results = session.exec(statement).all()
    
    now = int(time.time())
    return [
        {
            "id": u.id, 
            "full_name": u.full_name, 
            "username": u.username, 
            "is_ready": is_ready,
            "is_online": last_hb is not None and (now - last_hb) < 15
        } for u, is_ready, last_hb in results
    ]
