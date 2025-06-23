from datetime import date

from sqlmodel import Session, col, desc, func, select

from foos.database import models
from foos.rating import delta


WIN_SCORE = 5
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


def get_player_ratings(session: Session, player_ids: list[str]) -> dict[str, float]:
    ranked_timeseries = select(
        models.TimeSeries.player_id,
        models.TimeSeries.rating,
        func.row_number().over(
            partition_by=col(models.TimeSeries.player_id),
            order_by=desc(col(models.TimeSeries.game_id))
        ).label("game_num")
    ).where(
        col(models.TimeSeries.player_id).in_(player_ids)
    ).subquery()
    latest_ratings_query = (
        select(
            ranked_timeseries.c.player_id,
            ranked_timeseries.c.rating
        )
        .select_from(ranked_timeseries)
        .where(ranked_timeseries.c.game_num == 1)
    )
    latest_ratings: dict[str, float] = dict(session.exec(latest_ratings_query).all())
    return latest_ratings


def get_player_game_counts(session: Session, player_ids: list[str]) -> dict[str, int]:
    game_counts_query = (
        select(
            models.TimeSeries.player_id,
            func.count(models.TimeSeries.game_id).label("game_count")
        )
        .where(col(models.TimeSeries.player_id).in_(player_ids))
        .group_by(models.TimeSeries.player_id)
    )
    game_counts: dict[str, int] = dict(session.exec(game_counts_query).all())
    return game_counts


def update_ratings(db_game: models.Game, player_id_to_rating: dict[str, float]):
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

    d = delta.scaled_square_differential(
        actual_score_diff=actual_score_diff,
        rating_diff=rating_diff,
        win_score=WIN_SCORE
    )

    player_id_to_rating[win_team.offense] += d
    player_id_to_rating[win_team.defense] += d
    player_id_to_rating[lose_team.offense] -= d
    player_id_to_rating[lose_team.defense] -= d

    return player_id_to_rating
