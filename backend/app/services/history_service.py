import time
from sqlmodel import Session, select
from app.models.user import Game, GameResult, Group, User


class HistoryService:
    @staticmethod
    def get_match_history(session: Session, user_id: int):
        """
        Retrieves the full match history for a user.
        Each 'match' is a group of rounds sharing the same series_id.
        Solo games (series_id=None) each appear as their own 1-round match.
        Results are sorted newest-first.
        """

        # 1. Find all GameResult rows for this user
        results_stmt = select(GameResult).where(GameResult.user_id == user_id)
        user_results = session.exec(results_stmt).all()

        if not user_results:
            return []

        # 2. Collect unique game IDs
        game_ids = list({r.game_id for r in user_results})

        # 3. Fetch those game records
        games_stmt = select(Game).where(Game.id.in_(game_ids))
        games = session.exec(games_stmt).all()
        games_by_id = {g.id: g for g in games}

        # 4. Group game IDs by series_id.
        # Games with series_id=None are treated as solo matches keyed by game_id.
        series_map: dict[str, list[int]] = {}
        for game in games:
            key = game.series_id if game.series_id else f"solo_{game.id}"
            series_map.setdefault(key, []).append(game.id)

        # 5. Fetch group names for context
        group_ids = list({g.group_id for g in games})
        groups_stmt = select(Group).where(Group.id.in_(group_ids))
        groups = session.exec(groups_stmt).all()
        groups_by_id = {g.id: g for g in groups}

        # 6. For each series/match, build the full structured response
        matches = []
        for series_key, series_game_ids in series_map.items():
            # Sort rounds chronologically
            sorted_game_ids = sorted(
                series_game_ids, key=lambda gid: games_by_id[gid].created_at or 0
            )

            # Fetch ALL results (all players) for all games in this series
            all_results_stmt = select(GameResult).where(GameResult.game_id.in_(sorted_game_ids))
            all_series_results = session.exec(all_results_stmt).all()

            # Fetch user display names for every participant
            all_participant_ids = list({r.user_id for r in all_series_results})
            users_stmt = select(User).where(User.id.in_(all_participant_ids))
            participants = session.exec(users_stmt).all()
            participants_by_id = {u.id: u for u in participants}

            # Group results by game_id for round-by-round breakdown
            results_by_game: dict[int, list] = {}
            for r in all_series_results:
                results_by_game.setdefault(r.game_id, []).append(r)

            # Build per-round records
            rounds = []
            for round_num, gid in enumerate(sorted_game_ids, start=1):
                game_results = results_by_game.get(gid, [])
                my_result = next((r for r in game_results if r.user_id == user_id), None)

                all_results_formatted = sorted(
                    [
                        {
                            "user_id": r.user_id,
                            "username": participants_by_id[r.user_id].username if r.user_id in participants_by_id else "Unknown",
                            "full_name": participants_by_id[r.user_id].full_name if r.user_id in participants_by_id else "Unknown",
                            "position": r.position,
                            "points": r.points,
                        }
                        for r in game_results
                    ],
                    key=lambda x: x["position"],
                )

                rounds.append({
                    "round_number": round_num,
                    "game_id": gid,
                    "my_position": my_result.position if my_result else None,
                    "my_points": my_result.points if my_result else 0,
                    "all_results": all_results_formatted,
                })

            # Summary stats for the match card
            first_game = games_by_id[sorted_game_ids[0]]
            group = groups_by_id.get(first_game.group_id)
            my_results_in_series = [r for r in all_series_results if r.user_id == user_id]
            my_total_points = sum(r.points for r in my_results_in_series)
            my_best_position = min((r.position for r in my_results_in_series), default=None)

            matches.append({
                "series_id": first_game.series_id,
                "group_id": first_game.group_id,
                "group_name": group.name if group else "Unknown Squad",
                "played_at": first_game.created_at or 0,
                "total_rounds": len(sorted_game_ids),
                "my_total_points": my_total_points,
                "my_best_position": my_best_position,
                "rounds": rounds,
            })

        # Sort matches by most recent first
        matches.sort(key=lambda m: m["played_at"], reverse=True)
        return matches
