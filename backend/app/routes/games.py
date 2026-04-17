from fastapi import APIRouter, Depends
from sqlmodel import Session
from app.database.connection import get_session
from app.services.game_service import GameService

router = APIRouter(prefix="/games", tags=["Games"])

@router.post("/start/{group_id}")
def start_game(group_id: int, requestor_id: int, session: Session = Depends(get_session)):
    return GameService.initialize_game(session, group_id, requestor_id)

@router.get("/state/{group_id}")
def get_game_state(group_id: int, session: Session = Depends(get_session)):
    state = GameService.get_game_state(session, group_id)
    if not state:
        return {"status": "inactive"}
    return state
