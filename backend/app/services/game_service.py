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


        # 2. Check for Strategic Readiness (Full Squad Engagement)
        # Fetch all memberships to verify readiness
        members_stmt = select(GroupMember).where(GroupMember.group_id == group_id)
        all_memberships = session.exec(members_stmt).all()
        
        not_ready_count = sum(1 for m in all_memberships if not m.is_ready)
        if not_ready_count > 0:
            raise HTTPException(
                status_code=400, 
                detail=f"Tactical integrity violation: {not_ready_count} legend(s) are not yet in the arena. All squad members must be ready to engage."
            )

        # 3. Check for active game
        statement = select(Game).where(Game.group_id == group_id, Game.status == "active")
        active_games = session.exec(statement).all()
        for old_game in active_games:
            old_game.status = "finished" 
            session.add(old_game)
        session.commit()

        # 4. Fetch all participants (the entire squad)
        statement = select(User).join(GroupMember).where(GroupMember.group_id == group_id)
        active_members = session.exec(statement).all()
        
        if len(active_members) < 1:
            raise HTTPException(status_code=400, detail="Squad must have at least 1 member to start.")

        # 5. Create Game
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
        from app.models.user import CardTemplate
        import random
        deck = []
        
        # Fetch templates from DB
        templates = session.exec(select(CardTemplate).order_by(CardTemplate.card_type)).all()
        template_map = {t.card_type: (t.name, t.value, t.color) for t in templates}
        
        # All available card types (A=Sona, B=Chandi, C=Moti, D=Heera, etc.)
        all_type_keys = sorted(template_map.keys())  # Use all types defined in DB
        
        if not all_type_keys:
            # Emergency fallback if no templates exist in DB
            raise Exception("No card templates found. Ask admin to set up card types first.")
        
        # We need exactly 4 cards per player = total_cards
        total_cards_needed = len(active_members) * 4
        
        # Build deck by cycling through card types until we have enough cards
        # Each cycle adds 4 cards of a type (one "set")
        cycle_index = 0
        while len(deck) < total_cards_needed:
            key = all_type_keys[cycle_index % len(all_type_keys)]
            name, val, color = template_map[key]
            # Ensure color is always a valid hex color 
            safe_color = color if (color and color.startswith('#') and len(color) >= 4) else "#FFD700"
            for _ in range(4):
                deck.append((name, val, safe_color))
            cycle_index += 1
        
        # SHUFFLE for fair distribution
        random.shuffle(deck)
        
        # DISTRIBUTE — Give exactly 4 cards to every participant
        for member in active_members:
            for _ in range(4):
                if not deck: break
                c_name, c_val, c_color = deck.pop()
                card = PlayerCard(game_id=game.id, user_id=member.id, card_type=c_name, value=c_val, color=c_color)
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

        # Get results for this game
        from app.models.user import GameResult
        res_stmt = select(GameResult).where(GameResult.game_id == game.id).order_by(GameResult.position)
        results = session.exec(res_stmt).all()
        
        # Get player presence status
        now = int(time.time())
        presence_stmt = select(GroupMember.user_id, GroupMember.last_arena_heartbeat).where(GroupMember.group_id == game.group_id)
        presence_results = session.exec(presence_stmt).all()
        player_presence = {
            str(uid): (last_hb is not None and (now - last_hb) < 30)
            for uid, last_hb in presence_results
        }
        
        # Get group creator ID for permission handling
        group = session.get(Group, game.group_id)
        group_creator_id = group.creator_id if group else None
        
        return {
            "game_id": game.id,
            "status": game.status,
            "current_turn_user_id": game.current_turn_user_id,
            "group_creator_id": group_creator_id, # Identity-lock payload
            "winner_id_1": game.winner_id_1, 
            "winner_id_2": game.winner_id_2,
            "results": [r.model_dump() for r in results],
            "cards": [card.model_dump() for card in cards],
            "player_presence": player_presence
        }

    @staticmethod
    def play_turn(session: Session, game_id: int, user_id: int, card_id: int):
        from app.models.user import GameResult
        game = session.get(Game, game_id)
        if not game or game.status != "active":
            raise HTTPException(status_code=404, detail="Active match not found")
        
        if game.current_turn_user_id != user_id:
            raise HTTPException(status_code=403, detail="It is not your turn, legend.")
        
        card = session.get(PlayerCard, card_id)
        if not card or card.user_id != user_id:
            raise HTTPException(status_code=400, detail="You do not own this card.")

        # Determine squad member IDs
        members_stmt = select(GroupMember).where(GroupMember.group_id == game.group_id).order_by(GroupMember.user_id)
        memberships = session.exec(members_stmt).all()
        member_ids = [m.user_id for m in memberships]
        
        if user_id not in member_ids:
            raise HTTPException(status_code=400, detail="Player not in this squad.")
            
        current_idx = member_ids.index(user_id)
        
        # Determine who has already finished (GameResults)
        existing_results_stmt = select(GameResult).where(GameResult.game_id == game_id)
        existing_results = session.exec(existing_results_stmt).all()
        finished_user_ids = [r.user_id for r in existing_results]

        # 1. Skip logic: Find next player who hasn't finished yet
        active_ids = [mid for mid in member_ids if mid not in finished_user_ids]
        
        if not active_ids:
            game.status = "finished"
            session.add(game)
            session.commit()
            return game

        # Calculate next turn (skipping finished players)
        potential_index = (current_idx + 1) % len(member_ids)
        while member_ids[potential_index] in finished_user_ids:
            potential_index = (potential_index + 1) % len(member_ids)
        next_user_id = member_ids[potential_index]

        # 2. Perform Transfer
        card.user_id = next_user_id
        session.add(card)
        
        # 3. Check Victory (4-of-a-kind) for active players
        for m_id in member_ids:
            if m_id in finished_user_ids: continue
            
            p_cards_stmt = select(PlayerCard).where(PlayerCard.game_id == game_id, PlayerCard.user_id == m_id)
            p_cards = session.exec(p_cards_stmt).all()
            
            type_counts = {}
            for pc in p_cards:
                type_counts[pc.card_type] = type_counts.get(pc.card_type, 0) + 1
            
            for c_type, count in type_counts.items():
                if count >= 4 and len(p_cards) == 4:
                    # ACHIEVEMENT: New placement determined!
                    next_pos = len(finished_user_ids) + 1
                    total_points = sum(c.value for c in p_cards)
                    
                    new_res = GameResult(game_id=game_id, user_id=m_id, position=next_pos, points=total_points)
                    session.add(new_res)
                    finished_user_ids.append(m_id)
                    
                    # Backwards compatibility update
                    if next_pos == 1: game.winner_id_1 = m_id
                    elif next_pos == 2: game.winner_id_2 = m_id
                    
                    # Logically remove from active rotation
                    active_ids = [aid for aid in active_ids if aid != m_id]

        # 4. Termination Logic: If only 2 active players remain, end the game!
        if len(active_ids) <= 2:
            # Game concluudes immediately
            game.status = "finished"
            game.current_turn_user_id = None
            
            # Record results for the remaining 2 legends based on their current points
            # We sort them by points descending for their final positions
            remaining_data = []
            for mid in active_ids:
                pc_stmt = select(PlayerCard).where(PlayerCard.game_id == game_id, PlayerCard.user_id == mid)
                cards = session.exec(pc_stmt).all()
                remaining_data.append({"user_id": mid, "points": sum(c.value for c in cards)})
            
            # Sort remaining players by points to assign positions
            remaining_data.sort(key=lambda x: x["points"], reverse=True)
            
            for idx, data in enumerate(remaining_data):
                final_pos = len(finished_user_ids) + 1
                final_res = GameResult(game_id=game_id, user_id=data["user_id"], position=final_pos, points=data["points"])
                session.add(final_res)
                finished_user_ids.append(data["user_id"])
                
                # Update legacy fields if applicable (e.g. 2nd place if game ended at 3)
                if final_pos == 2: game.winner_id_2 = data["user_id"]
        else:
            # Ensure next_user_id is still valid (not newly finished)
            if next_user_id in finished_user_ids:
                 # Re-find next turn among survivors
                 cur_idx = member_ids.index(user_id)
                 pot_idx = (cur_idx + 1) % len(member_ids)
                 while member_ids[pot_idx] in finished_user_ids:
                      pot_idx = (pot_idx + 1) % len(member_ids)
                 next_user_id = member_ids[pot_idx]
            
            game.current_turn_user_id = next_user_id

        session.add(game)
        
        # If game just finished, reset all members' readiness for the next match
        if game.status == "finished":
            GameService.reset_group_readiness(session, game.group_id)
        
        session.commit()
        session.refresh(game)
        return game

    @staticmethod
    def reset_group_readiness(session: Session, group_id: int):
        """Reset all members' is_ready to False after a match ends."""
        members_stmt = select(GroupMember).where(GroupMember.group_id == group_id)
        memberships = session.exec(members_stmt).all()
        for m in memberships:
            m.is_ready = False
            session.add(m)
        # Note: caller is responsible for commit
