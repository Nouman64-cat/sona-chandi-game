from app.database.connection import engine
from sqlmodel import Session, select
from app.models.user import GroupMember, User

with Session(engine) as session:
    group_id = 7
    members_stmt = select(GroupMember).where(GroupMember.group_id == group_id)
    all_memberships = session.exec(members_stmt).all()
    print("All memberships:", [{"user_id": m.user_id, "is_ready": m.is_ready} for m in all_memberships])
    
    users_stmt = select(User).join(GroupMember).where(GroupMember.group_id == group_id)
    users = session.exec(users_stmt).all()
    print("Users:", [{"user_id": u.id, "username": u.username} for u in users])
