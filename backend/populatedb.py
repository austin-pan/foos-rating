import sys
import datetime
from zoneinfo import ZoneInfo
from sqlmodel import Session, SQLModel
import pandas as pd
from tqdm import tqdm

from foos import color
from foos.database import engine, create_db_and_tables
from foos.database import models
from foos import rating


def populate_db():
    game_data = pd.read_csv(sys.argv[1])
    game_data["date"] = pd.to_datetime(game_data["date"], format="ISO8601", utc=False)
    # game_data["date"].iloc[:270] = game_data["date"].iloc[:270].dt.tz_localize(None).dt.tz_localize(ZoneInfo("America/Los_Angeles"))
    game_data["date"] = game_data["date"].dt.tz_convert(ZoneInfo("America/Los_Angeles"))
    game_data["date_trunc_day"] = game_data["date"].dt.floor("D")
    print(game_data)

    player_data: list[str] = pd.concat(
        [
            game_data["yellow_offense"],
            game_data["yellow_defense"],
            game_data["black_offense"],
            game_data["black_defense"]
        ]
    ).unique().tolist()

    seasons = [
        {
            "name": "1",
            "start_date": datetime.date(2024, 1, 1),
            "end_date": datetime.date(2024, 6, 30),
            "active": False
        },
        {
            "name": "2",
            "start_date": datetime.date(2024, 7, 1),
            "end_date": datetime.date(2024, 12, 31),
            "active": True
        }
    ]

    with Session(engine) as session:
        seasons_to_upload = []
        for season in seasons:
            db_season = models.Season(
                name=season["name"],
                start_date=season["start_date"],
                end_date=season["end_date"],
                active=season["active"]
            )
            seasons_to_upload.append(db_season)
        session.bulk_save_objects(seasons_to_upload)
        session.commit()

        players_to_upload = []
        player_id_to_rating: dict[str, float] = {}
        for player in player_data:
            player_id = player.lower().replace(" ", "_")
            db_player = models.Player(
                id=player_id,
                name=player.capitalize(),
                color=color.get_random_dark_color()
            )
            players_to_upload.append(db_player)
            player_id_to_rating[player_id] = rating.BASE_RATING
        session.bulk_save_objects(players_to_upload)
        session.commit()

        timeseries_to_upload = []
        curr_season = None
        for _, game in tqdm(game_data.iterrows()):
            db_game = models.Game(
                date=game[["date"]].item(),
                date_trunc_day=game[["date_trunc_day"]].item(),
                yellow_offense=game[["yellow_offense"]].item(),
                yellow_defense=game[["yellow_defense"]].item(),
                yellow_score=int(game[["yellow_score"]].item()),
                black_offense=game[["black_offense"]].item(),
                black_defense=game[["black_defense"]].item(),
                black_score=int(game[["black_score"]].item()),
                season_id=int(game[["season_id"]].item())
            )
            session.add(db_game)
            session.commit()
            if curr_season != db_game.season_id:
                curr_season = db_game.season_id
                player_id_to_rating = { p: rating.BASE_RATING for p in player_id_to_rating }

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

                db_timeseries_point = models.TimeSeries(
                    game_id=db_game.id,
                    player_id=player_id,
                    rating=updated_rating,
                    win=win
                )
                timeseries_to_upload.append(db_timeseries_point)
        session.bulk_save_objects(timeseries_to_upload, preserve_order=True)
        session.commit()


if __name__ == "__main__":
    SQLModel.metadata.drop_all(engine)
    create_db_and_tables()
    populate_db()
