import datetime

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
    def __init__(self, game_date: datetime.date, team_a: Team, team_b: Team):
        self.date = game_date
        self.team_a = team_a
        self.team_b = team_b

class PlayerStats:
    def __init__(self, num_games: int | None, num_wins: int | None, rating: float | None):
        self.num_games = num_games if num_games is not None else 0
        self.num_wins = num_wins if num_wins is not None else 0
        self.rating = rating if rating is not None else BASE_RATING

        self.win_rate = 0 if self.num_games == 0 else self.num_wins / self.num_games


def get_ratings_query(
    season_id: int,
    date: datetime.date | None = None,
    game_number: int | None = None
) -> Select[tuple[str, float]]:
    """
    Get the ratings query for the given season, date, and game number.
    """
    query = (
        select(models.TimeSeries.player_id, models.TimeSeries.rating)
        .join(models.Game)
        .where(models.Game.season_id == season_id)
        .order_by(
            models.TimeSeries.player_id,
            desc(models.Game.date),
            desc(models.Game.game_number)
        )
        .prefix_with(f"DISTINCT ON ({models.TimeSeries.player_id})")
    )
    if date:
        query = query.where(models.Game.date <= date)
    if game_number:
        query = query.where(models.Game.game_number <= game_number)
    return query


def get_player_ratings(
    session: Session,
    season_id: int,
    *,
    player_ids: list[str] | None = None,
    date: datetime.date | None = None,
    game_number: int | None = None
) -> dict[str, float]:
    """
    Get the ratings for the given player IDs and season.
    If player_ids is None, get the ratings for all players.
    If date is None, get the ratings for the latest game.
    If game_number is None, get the ratings for the latest game.
    """
    ratings_query = get_ratings_query(season_id, date, game_number)
    if player_ids:
        ratings_query = ratings_query.where(col(models.TimeSeries.player_id).in_(player_ids))
    player_id_to_rating: dict[str, float] = dict(session.exec(ratings_query).all())
    if player_ids:
        for player_id in player_ids:
            if player_id not in player_id_to_rating:
                player_id_to_rating[player_id] = BASE_RATING
    return player_id_to_rating


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
    ratings_query = get_ratings_query(season_id).subquery("ratings")

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
    """
    Update the ratings for the given game and player ratings.
    """
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

    if method == "min_scaled_flat_score":
        d = delta.min_scaled_flat_score(
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


def calculate_timeseries_points(
    games: list[models.Game],
    player_id_to_rating: dict[str, float],
    method: str
) -> list[models.TimeSeries]:
    """
    Calculate the timeseries points for the given games and player ratings.
    """
    timeseries_points = []
    for game in games:
        # Extract player IDs from the current game
        game_player_ids = [
            game.yellow_offense,
            game.yellow_defense,
            game.black_offense,
            game.black_defense
        ]
        # Backfill new players
        for player_id in game_player_ids:
            if player_id not in player_id_to_rating:
                player_id_to_rating[player_id] = BASE_RATING
        # Take subset of ratings for players in this game
        game_player_id_to_rating = {
            player_id: player_id_to_rating[player_id]
            for player_id in game_player_ids
        }
        player_id_to_updated_rating = update_ratings(game, game_player_id_to_rating, method)
        for player_id, updated_rating in player_id_to_updated_rating.items():
            db_timeseries_point = models.TimeSeries(
                game_id=game.id,
                player_id=player_id,
                rating=updated_rating,
                delta=updated_rating - player_id_to_rating[player_id],
                win=updated_rating > player_id_to_rating[player_id]
            )
            timeseries_points.append(db_timeseries_point)
        player_id_to_rating.update(player_id_to_updated_rating)
    return timeseries_points
