from fastapi import APIRouter, Depends
from sqlmodel import Session
from app.database.connection import get_session
from app.services.game_service import GameService
from app.services.history_service import HistoryService
from app.routes.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/games", tags=["Games"])

@router.get("/history/user")
def get_match_history(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Retrieve the full match history for the currently authenticated user."""
    return HistoryService.get_match_history(session, current_user.id)


@router.post("/start/{group_id}")
def start_game(group_id: int, requestor_id: int, action: str = "new_match", session: Session = Depends(get_session)):
    return GameService.initialize_game(session, group_id, requestor_id, action)

@router.get("/state/{group_id}")
def get_game_state(group_id: int, session: Session = Depends(get_session)):
    state = GameService.get_game_state(session, group_id)
    if not state:
        return {"status": "inactive"}
    return state

@router.post("/{game_id}/play")
def play_turn(game_id: int, card_id: int, requestor_id: int, session: Session = Depends(get_session)):
    return GameService.play_turn(session, game_id, requestor_id, card_id)

@router.post("/{game_id}/end")
def end_game(game_id: int, requestor_id: int, session: Session = Depends(get_session)):
    from app.models.user import Game, Group
    from fastapi import HTTPException
    
    game = session.get(Game, game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Active match terminal not found.")
        
    group = session.get(Group, game.group_id)
    if not group or group.creator_id != requestor_id:
        raise HTTPException(
            status_code=403, 
            detail="Tactical Authority Violation: Only the squad leader can decommission this battle."
        )
        
    game.status = "finished"
    session.add(game)
    # Reset all members' readiness so lobby is clean for the next round
    GameService.reset_group_readiness(session, game.group_id)
    session.commit()
    return {"status": "success"}


