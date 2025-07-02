from datetime import date

from sqlmodel import Session, col, desc, func, select, case

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

class PlayerStats:
    def __init__(self, num_games: int, num_wins: int):
        self.num_games = num_games
        self.num_wins = num_wins

        self.win_rate = 0 if self.num_games == 0 else self.num_wins / self.num_games


def get_player_ratings(session: Session, player_ids: list[str], season_id: int) -> dict[str, float]:
    ranked_timeseries = (
        select(
            models.TimeSeries.player_id,
            models.TimeSeries.rating,
            func.row_number().over(
                partition_by=col(models.TimeSeries.player_id),
                order_by=desc(col(models.TimeSeries.game_id))
            ).label("game_num")
        )
        .join(models.Game)
        .where(
            models.Game.id == models.TimeSeries.game_id,
            col(models.TimeSeries.player_id).in_(player_ids),
            models.Game.season_id == season_id
        )
        .subquery()
    )
    latest_ratings_query = (
        select(
            ranked_timeseries.c.player_id,
            ranked_timeseries.c.rating
        )
        .select_from(ranked_timeseries)
        .where(ranked_timeseries.c.game_num == 1)
    )
    latest_ratings: dict[str, float] = dict(session.exec(latest_ratings_query).all())
    for player_id in player_ids:
        if player_id not in latest_ratings:
            latest_ratings[player_id] = BASE_RATING
    return latest_ratings


def get_player_game_stats(session: Session, player_ids: list[str], season_id: int) -> dict[str, PlayerStats]:
    stats_query = (
        select(
            models.TimeSeries.player_id,
            func.count(models.TimeSeries.game_id).label("game_count"),
            func.sum(
                case(
                    (models.TimeSeries.win, 1),
                    else_=0
                )
            ).label("win_count")
        )
        .join(models.Game)
        .where(
            col(models.TimeSeries.player_id).in_(player_ids),
            models.Game.season_id == season_id
        )
        .group_by(models.TimeSeries.player_id)
    )
    stats = {
        player_id: PlayerStats(num_games, num_wins)
        for player_id, num_games, num_wins in session.exec(stats_query).all()
    }
    return stats


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
