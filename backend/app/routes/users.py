from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session
from app.database.connection import get_session
from app.models.user import UserRead, UserSearchResponse
from app.services.user_service import UserService


router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/search", response_model=List[UserSearchResponse])
def search_users(
    query: str = Query("", min_length=0), 
    searcher_id: Optional[int] = None,
    session: Session = Depends(get_session)
):
    return UserService.search_users(session, query, searcher_id)

