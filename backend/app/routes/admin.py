from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database.connection import get_session
from app.models.user import User, CardTemplate
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
