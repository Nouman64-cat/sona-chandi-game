from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, text
from app.database.connection import get_session
from app.models.user import User, CardTemplate, Group
from app.routes.auth import get_current_user
from typing import List

router = APIRouter(prefix="/admin", tags=["Admin"])

async def admin_required(current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Legendary authority (Admin) required.")
    return current_user

@router.get("/cards", response_model=List[CardTemplate])
async def get_card_templates(
    session: Session = Depends(get_session),
    admin: User = Depends(admin_required)
):
    statement = select(CardTemplate).order_by(CardTemplate.card_type)
    return session.exec(statement).all()

@router.put("/cards/{card_id}", response_model=CardTemplate)
async def update_card_template(
    card_id: int,
    card_data: CardTemplate,
    session: Session = Depends(get_session),
    admin: User = Depends(admin_required)
):
    db_card = session.get(CardTemplate, card_id)
    if not db_card:
        raise HTTPException(status_code=404, detail="Card template not found")
    
    db_card.name = card_data.name
    db_card.value = card_data.value
    db_card.color = card_data.color
    
    session.add(db_card)
    session.commit()
    session.refresh(db_card)
    return db_card

@router.get("/users")
async def get_all_users(
    session: Session = Depends(get_session),
    admin: User = Depends(admin_required)
):
    """Fetch all legends for oversight."""
    statement = select(User).order_by(User.full_name)
    users = session.exec(statement).all()
    # Mask passwords and return
    return users

@router.delete("/users/{user_id}")
async def purge_user(
    user_id: int,
    session: Session = Depends(get_session),
    admin: User = Depends(admin_required)
):
    """Permanently remove a legend from the Arena."""
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="A Commander cannot purge their own identity.")
    
    target_user = session.get(User, user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="Legend not found in the archives.")

    # 1. Dissolve all Friendships involving this legend
    session.exec(text("DELETE FROM friendship WHERE user_id = :u OR friend_id = :u").bindparams(u=user_id))
    
    # 1. Purge Friendship Transmissions (Alliance History)
    session.exec(text("DELETE FROM friendship WHERE user_id = :u OR friend_id = :u").bindparams(u=user_id))
    
    # 2. Clear Match History and Results
    session.exec(text("DELETE FROM gameresult WHERE user_id = :u").bindparams(u=user_id))
    
    # 3. Neutralize active match influence in other squads
    # Ensure no games are blocked by this user being the current turn holder or winner
    session.exec(text("UPDATE game SET current_turn_user_id = NULL WHERE current_turn_user_id = :u").bindparams(u=user_id))
    session.exec(text("UPDATE game SET winner_id_1 = NULL WHERE winner_id_1 = :u").bindparams(u=user_id))
    session.exec(text("UPDATE game SET winner_id_2 = NULL WHERE winner_id_2 = :u").bindparams(u=user_id))

    # 4. Identify squads owned by this legend and purge their entire ecosystem
    # Fetch group IDs first to handle cascading sub-purges
    owned_groups = session.exec(select(Group.id).where(Group.creator_id == user_id)).all()
    if owned_groups:
        group_ids = tuple(owned_groups)
        
        # Explicitly fetch all game IDs associated with these squads to ensure precise targeting
        game_ids = session.exec(select(Game.id).where(Game.group_id.in_(owned_groups))).all()
        if game_ids:
            g_ids = tuple(game_ids)
            # Purge match artifacts (cards) for all participants in these matches
            session.exec(text("DELETE FROM playercard WHERE game_id IN :gids").bindparams(gids=g_ids))
            # Purge ALL match results (for all legends involved) for these matches
            session.exec(text("DELETE FROM gameresult WHERE game_id IN :gids").bindparams(gids=g_ids))
            # Dissolve the match records themselves
            session.exec(text("DELETE FROM game WHERE id IN :gids").bindparams(gids=g_ids))
            
        # Purge ALL memberships for these squads
        session.exec(text("DELETE FROM groupmember WHERE group_id IN :gids").bindparams(gids=group_ids))
        # Finally, delete the squads themselves
        session.exec(text("DELETE FROM \"group\" WHERE id IN :gids").bindparams(gids=group_ids))
    
    # 5. Resign from any other squads they were a member of
    session.exec(text("DELETE FROM groupmember WHERE user_id = :u").bindparams(u=user_id))
    
    # 6. Terminate any remaining active match influence (personal cards)
    session.exec(text("DELETE FROM playercard WHERE user_id = :u").bindparams(u=user_id))
    
    # 7. Final Purge of the User identity
    session.delete(target_user)
    session.commit()
    
    return {"status": "success", "message": f"Legend {target_user.username} has been removed from the archives."}
