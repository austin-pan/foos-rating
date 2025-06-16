import sys
from datetime import datetime
from sqlmodel import Session, select
import pandas as pd

from foos import color
from foos.database import engine, create_db_and_tables
from foos.database.models import Game, Player, TimeSeries
from foos import rating


def populate_db():
    game_data = pd.read_csv(sys.argv[1])
    player_data: list[str] = pd.concat(
        [
            game_data["yellow_front"],
            game_data["yellow_back"],
            game_data["black_front"],
            game_data["black_back"]
        ]
    ).unique().tolist()

    with Session(engine) as session:
        player_id_to_rating: dict[str, float] = {}
        for player in player_data:
            player_id = player.lower().replace(" ", "_")
            db_player = Player(
                id=player_id,
                name=player,
                color=color.get_random_dark_color()
            )
            session.add(db_player)
            session.commit()

            player_id_to_rating[player_id] = rating.BASE_RATING

        game_data["yellow_front"] = game_data["yellow_front"].str.lower().replace(" ", "_")
        game_data["yellow_back"] = game_data["yellow_back"].str.lower().replace(" ", "_")
        game_data["black_front"] = game_data["black_front"].str.lower().replace(" ", "_")
        game_data["black_back"] = game_data["black_back"].str.lower().replace(" ", "_")
        for _, game in game_data.iterrows():
            db_game = Game(
                date=datetime.strptime(game["date"], "%m/%d/%y"),
                yellow_offense=game["yellow_front"],
                yellow_defense=game["yellow_back"],
                yellow_score=int(game["yellow_score"]),
                black_offense=game["black_front"],
                black_defense=game["black_back"],
                black_score=int(game["black_score"])
            )
            session.add(db_game)
            session.commit()

            game_player_id_to_rating = {
                player_id: rating
                for player_id, rating in player_id_to_rating.items()
                if player_id in [
                    db_game.yellow_offense,
                    db_game.yellow_defense,
                    db_game.black_offense,
                    db_game.black_defense
                ]
            }
            game_player_id_to_updated_rating = rating.update_ratings(
                db_game=db_game,
                player_id_to_rating=game_player_id_to_rating
            )
            for player_id, updated_rating in game_player_id_to_updated_rating.items():
                win = player_id_to_rating[player_id] < updated_rating
                player_id_to_rating[player_id] = updated_rating

                # player_id_to_player[player_id].rating = updated_rating
                # session.add(player_id_to_player[player_id])

                db_timeseries_point = TimeSeries(
                    game_id=db_game.id,
                    player_id=player_id,
                    rating=updated_rating,
                    win=win
                )
                session.add(db_timeseries_point)
            session.commit()


def truncate_tables():
    with Session(engine) as session:
        timeseries_points = session.exec(select(TimeSeries)).all()
        for ts in timeseries_points:
            session.delete(ts)
        games = session.exec(select(Game)).all()
        for g in games:
            session.delete(g)
        players = session.exec(select(Player)).all()
        for p in players:
            session.delete(p)
        session.commit()


if __name__ == "__main__":
    create_db_and_tables()
    truncate_tables()
    populate_db()
