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
        active_games = session.exec(statement).all()
        for old_game in active_games:
            old_game.status = "finished" 
            session.add(old_game)
        session.commit()

        # Verify at least 1 member (allowing 1-4 for testing, but target is 4)
        statement = select(User).join(GroupMember).where(GroupMember.group_id == group_id)
        members = session.exec(statement).all()
        if len(members) < 1:
            raise HTTPException(status_code=400, detail="Squad must have at least 1 member to start.")
        
        # Limit to 4 if more
        active_members = members[:4]

        # Create Game
        game = Game(
            group_id=group_id, 
            status="active", 
            current_turn_user_id=requestor_id, # Starter goes first
            created_at=int(time.time())
        )
        session.add(game)
        session.commit()
        session.refresh(game)

        # Create Cards dynamic deck based on player count (exactly 4 * players)
        import random
        deck = []
        card_types = [
            ("A", 100),
            ("B", 200),
            ("C", 300),
            ("D", 400)
        ]
        
        # Use only as many types as there are players
        active_types = card_types[:len(active_members)]
        
        # 4 of each active type = total (4 * players)
        for c_type, c_val in active_types:
            for _ in range(4):
                deck.append((c_type, c_val))
        
        # SHUFFLE
        random.shuffle(deck)
        
        # DISTRIBUTE
        # Give exactly 4 cards to every participant
        for member in active_members:
            for _ in range(4):
                if not deck: break
                c_type, c_val = deck.pop()
                card = PlayerCard(game_id=game.id, user_id=member.id, card_type=c_type, value=c_val)
                session.add(card)

        session.commit()
        return game

    @staticmethod
    def get_game_state(session: Session, group_id: int):
        statement = select(Game).where(Game.group_id == group_id, Game.status == "active")
        game = session.exec(statement).first()
        if not game:
            # Check for recently finished game to show winner
            statement = select(Game).where(Game.group_id == group_id, Game.status == "finished").order_by(Game.created_at.desc())
            game = session.exec(statement).first()
            if not game: return None
        
        # Get all cards for this game
        statement = select(PlayerCard).where(PlayerCard.game_id == game.id)
        cards = session.exec(statement).all()
        
        return {
            "game_id": game.id,
            "status": game.status,
            "current_turn_user_id": game.current_turn_user_id,
            "winner_id": game.winner_id,
            "cards": [card.model_dump() for card in cards]
        }

    @staticmethod
    def play_turn(session: Session, game_id: int, user_id: int, card_id: int):
        game = session.get(Game, game_id)
        if not game or game.status != "active":
            raise HTTPException(status_code=404, detail="Active match not found")
        
        if game.current_turn_user_id != user_id:
            raise HTTPException(status_code=403, detail="It is not your turn, legend.")
        
        card = session.get(PlayerCard, card_id)
        if not card or card.user_id != user_id:
            raise HTTPException(status_code=400, detail="You do not own this card.")

        # Determine next player in the squad cycle
        # We'll use the IDs of members in the group, ordered ascending
        members_stmt = select(GroupMember).where(GroupMember.group_id == game.group_id).order_by(GroupMember.user_id)
        memberships = session.exec(members_stmt).all()
        member_ids = [m.user_id for m in memberships]
        
        if user_id not in member_ids:
            raise HTTPException(status_code=400, detail="Player not in this squad.")
            
        current_idx = member_ids.index(user_id)
        next_idx = (current_idx + 1) % len(member_ids)
        next_user_id = member_ids[next_idx]

        # Transfer Card
        card.user_id = next_user_id
        session.add(card)
        
        # Check Win Condition for the player who just played or the one who received?
        # Actually, check ALL players in this game for 4 of a kind
        for m_id in member_ids:
            card_counts_stmt = select(PlayerCard).where(PlayerCard.game_id == game_id, PlayerCard.user_id == m_id)
            p_cards = session.exec(card_counts_stmt).all()
            
            # Group by card_type
            type_counts = {}
            for pc in p_cards:
                type_counts[pc.card_type] = type_counts.get(pc.card_type, 0) + 1
            
            for c_type, count in type_counts.items():
                if count >= 4:
                    game.status = "finished"
                    game.winner_id = m_id
                    game.current_turn_user_id = None
                    session.add(game)
                    session.commit()
                    return game

        # If no win, update turn
        game.current_turn_user_id = next_user_id
        session.add(game)
        session.commit()
        session.refresh(game)
        return game
