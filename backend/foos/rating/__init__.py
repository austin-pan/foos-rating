from datetime import date

from sqlmodel import Integer, Session, cast, col, desc, func, join, select
from sqlalchemy import Select

from foos.database import models
from foos.rating import delta


BASE_RATING = 500.0


class Team:
    def __init__(self, offense: str, defense: str, score: int):
        self.offense = offense
        self.defense = defense
        self.score = score

class FoosGame:
    def __init__(self, game_date: date, team_a: Team, team_b: Team):
        self.date = game_date
        self.team_a = team_a
        self.team_b = team_b

class PlayerStats:
    def __init__(self, num_games: int | None, num_wins: int | None, rating: float | None):
        self.num_games = num_games if num_games is not None else 0
        self.num_wins = num_wins if num_wins is not None else 0
        self.rating = rating if rating is not None else BASE_RATING

        self.win_rate = 0 if self.num_games == 0 else self.num_wins / self.num_games


def get_latest_ratings_query(season_id: int) -> Select[tuple[str, float]]:
    return (
        select(models.TimeSeries.player_id, models.TimeSeries.rating)
        .join(models.Game)
        .where(models.Game.season_id == season_id)
        .order_by(models.TimeSeries.player_id, desc(models.Game.date), desc(models.Game.id))
        .prefix_with(f"DISTINCT ON ({models.TimeSeries.player_id})")
    )


def get_player_ratings(session: Session, player_ids: list[str], season_id: int) -> dict[str, float]:
    latest_ratings: dict[str, float] = dict(
        session.exec(
            get_latest_ratings_query(season_id)
            .where(col(models.TimeSeries.player_id).in_(player_ids))
        ).all()
    )
    for player_id in player_ids:
        if player_id not in latest_ratings:
            latest_ratings[player_id] = BASE_RATING
    return latest_ratings


def get_player_stats(session: Session, season_id: int) -> dict[models.Player, PlayerStats]:
    stats_query = (
        select(
            models.TimeSeries.player_id,
            func.count(models.TimeSeries.game_id).label("game_count"),
            func.sum(cast(models.TimeSeries.win, Integer)).label("win_count")
        )
        .join(models.Game)
        .where(
            models.Game.season_id == season_id
        )
        .group_by(models.TimeSeries.player_id)
    ).subquery("stats")
    ratings_query = get_latest_ratings_query(season_id).subquery("ratings")

    full_query = (
        select(
            models.Player,
            stats_query.c.game_count,
            stats_query.c.win_count,
            ratings_query.c.rating
        )
        .select_from(
            join(
                models.Player,
                stats_query,
                models.Player.id == stats_query.c.player_id
            )
            .join(
                ratings_query,
                models.Player.id == ratings_query.c.player_id
            )
        )
        .order_by(models.Player.name)
    )
    stats = {
        player: PlayerStats(num_games, num_wins, rating)
        for player, num_games, num_wins, rating in session.exec(full_query).all()
    }
    return stats


def update_ratings(
    db_game: models.Game,
    player_id_to_rating: dict[str, float],
    method: str
) -> dict[str, float]:
    player_id_to_rating = player_id_to_rating.copy()
    game = FoosGame(
        game_date=db_game.date,
        team_a=Team(db_game.yellow_offense, db_game.yellow_defense, db_game.yellow_score),
        team_b=Team(db_game.black_offense, db_game.black_defense, db_game.black_score)
    )
    [win_team, lose_team] = sorted(
        [game.team_a, game.team_b],
        key=lambda team: team.score,
        reverse=True
    )

    win_team_rating = (
        player_id_to_rating[win_team.offense] +
        player_id_to_rating[win_team.defense]
    ) / 2
    lose_team_rating = (
        player_id_to_rating[lose_team.offense] +
        player_id_to_rating[lose_team.defense]
    ) / 2
    rating_diff = win_team_rating - lose_team_rating
    actual_score_diff = win_team.score - lose_team.score

    if method == "scaled_translated_differential":
        d = delta.scaled_translated_differential(
            actual_score_diff=actual_score_diff,
            rating_diff=rating_diff,
            win_score=win_team.score
        )
    elif method == "sigmoid_differential":
        d = delta.sigmoid_differential(
            actual_score_diff=actual_score_diff,
            rating_diff=rating_diff,
            win_score=win_team.score
        )
    elif method == "square_differential":
        d = delta.square_differential(actual_score_diff=actual_score_diff)
    else:
        raise ValueError(f"Unknown rating method: {method}")

    player_id_to_rating[win_team.offense] += d
    player_id_to_rating[win_team.defense] += d
    player_id_to_rating[lose_team.offense] -= d
    player_id_to_rating[lose_team.defense] -= d

    return player_id_to_rating
