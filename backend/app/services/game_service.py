import time
from typing import List
from fastapi import HTTPException
from sqlmodel import Session, select
from app.models.user import User, Group, GroupMember, Game, PlayerCard

class GameService:
    @staticmethod
    def initialize_game(session: Session, group_id: int, requestor_id: int):
        # Verify group exists
        group = session.get(Group, group_id)
        if not group:
            raise HTTPException(status_code=404, detail="Squad not found")
        
        # Verify requestor is in the group
        statement = select(GroupMember).where(GroupMember.group_id == group_id, GroupMember.user_id == requestor_id)
        membership = session.exec(statement).first()
        if not membership:
             raise HTTPException(status_code=403, detail="You must be a member of the squad to start a match")


        # Check for active game
        statement = select(Game).where(Game.group_id == group_id, Game.status == "active")
        active_game = session.exec(statement).first()
        if active_game:
            # For now, just return existing game, or we could raise error
            return active_game

        # Verify at least 1 member (allowing 1-4 for testing, but target is 4)
        statement = select(User).join(GroupMember).where(GroupMember.group_id == group_id)
        members = session.exec(statement).all()
        if len(members) < 1:
            raise HTTPException(status_code=400, detail="Squad must have at least 1 member to start.")
        
        # Limit to 4 if more
        active_members = members[:4]

        # Create Game
        game = Game(group_id=group_id, status="active", created_at=int(time.time()))
        session.add(game)
        session.commit()
        session.refresh(game)

        # Create Cards for each member
        card_types = [
            ("A", 100),
            ("B", 200),
            ("C", 300),
            ("D", 400)
        ]

        for idx, member in enumerate(active_members):
            for c_type, c_val in card_types:
                card = PlayerCard(
                    game_id=game.id,
                    user_id=member.id,
                    card_type=c_type,
                    value=c_val,
                    theme_index=idx # 0-3 determines theme
                )
                session.add(card)
        
        session.commit()
        return game

    @staticmethod
    def get_game_state(session: Session, group_id: int):
        statement = select(Game).where(Game.group_id == group_id, Game.status == "active")
        game = session.exec(statement).first()
        if not game:
            return None
        
        # Get all cards for this game
        statement = select(PlayerCard).where(PlayerCard.game_id == game.id)
        cards = session.exec(statement).all()
        
        return {
            "game_id": game.id,
            "status": game.status,
            "cards": cards
        }
