from typing import List
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session
from app.database.connection import get_session
from app.models.user import UserRead
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/search", response_model=List[UserRead])
def search_users(
    query: str = Query(..., min_length=1), 
    session: Session = Depends(get_session)
):
    return UserService.search_users(session, query)
