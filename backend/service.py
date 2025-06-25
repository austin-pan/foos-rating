from collections import defaultdict
import datetime
import os
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import DATE, Session, cast, col, desc, func, join, select

from foos import color, database as db, rating
from foos.database import models


load_dotenv()

app = FastAPI()

origins = os.getenv("ORIGINS")
if not origins:
    raise ValueError("Invalid origins")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins.split("\n"),
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"]
)


@app.on_event("startup")
def on_startup():
    db.create_db_and_tables()


@app.post("/games/", response_model=models.GamePublic)
def create_game(game: models.GameCreate):
    with Session(db.engine) as session:
        db_game = models.Game.model_validate(game)
        session.add(db_game)

        game_player_ids = [
            db_game.yellow_offense,
            db_game.yellow_defense,
            db_game.black_offense,
            db_game.black_defense
        ]
        player_id_to_current_rating = rating.get_player_ratings(session, game_player_ids)
        player_id_to_updated_rating = rating.update_ratings(db_game, player_id_to_current_rating)
        for player_id, updated_rating in player_id_to_updated_rating.items():
            win = player_id_to_current_rating[player_id] < updated_rating

            db_timeseries_point = models.TimeSeries(
                game_id=db_game.id,
                player_id=player_id,
                rating=updated_rating,
                win=win
            )
            session.add(db_timeseries_point)

        session.commit()
        session.refresh(db_game)
        return db_game


@app.get("/games/", response_model=list[models.GamePublic])
def read_games(offset: int = 0, limit: int = Query(default=20, le=100)):
    with Session(db.engine) as session:
        games = session.exec(
            select(models.Game)
            .order_by(desc(col(models.Game.date)), desc(col(models.Game.id)))
            .limit(limit)
            .offset(offset)
        ).all()
        return games


@app.delete("/games/recent/")
def delete_recent_game():
    with Session(db.engine) as session:
        db_game = session.exec(
            select(models.Game)
            .order_by(desc(col(models.Game.date)), desc(col(models.Game.id)))
        ).first()
        if not db_game:
            raise HTTPException(status_code=404, detail="Game not found")
        session.delete(db_game)
        session.commit()
        return {"ok": True}


@app.post("/players/recolor/")
def recolor_players():
    with Session(db.engine) as session:
        players = session.exec(select(models.Player)).all()
        for p in players:
            p.color = color.get_random_dark_color()
            session.add(p)
        session.commit()
        return {"ok": True}


@app.get("/players/", response_model=list[models.RatedPlayerPublic])
def read_players():
    with Session(db.engine) as session:
        db_players = session.exec(
            select(models.Player)
            .order_by(col(models.Player.name))
        ).all()
        player_ids = [p.id for p in db_players]
        player_id_to_rating = rating.get_player_ratings(session, player_ids)
        player_id_to_game_count = rating.get_player_game_counts(session, player_ids)
        # Account for first-time players
        for player_id in player_ids:
            if player_id not in player_id_to_rating:
                player_id_to_rating[player_id] = rating.BASE_RATING
            if player_id not in player_id_to_game_count:
                player_id_to_game_count[player_id] = 0
        players = [
            models.RatedPlayerPublic.model_validate(
                p,
                update={
                    "rating": round(player_id_to_rating[p.id]),
                    "game_count": player_id_to_game_count[p.id]
                }
            )
            for p in db_players
        ]
        return players


@app.post("/players/", response_model=models.PlayerPublic)
def add_player(player: models.PlayerCreate):
    with Session(db.engine) as session:
        player_db = models.Player.model_validate(player, update={
            "id": player.name.lower().replace(" ", "_"),
            "color": color.get_random_dark_color()
        })
        session.add(player_db)
        session.commit()
        session.refresh(player_db)
        return player_db


@app.get("/timeseries/", response_model=list[dict[str, Any]])
def read_ratings():
    with Session(db.engine) as session:
        # Select the ratings each participating player ended at the end of each day
        ranked_timeseries = select(
            cast(models.Game.date, DATE),
            models.TimeSeries.player_id,
            models.Player.name,
            models.TimeSeries.rating,
            func.row_number().over(
                partition_by=(col(models.TimeSeries.player_id), cast(models.Game.date, DATE)),
                order_by=desc(col(models.Game.id))
            ).label("game_num")
        ).select_from( # type: ignore
            join(models.TimeSeries, models.Game)
            .join(models.Player, col(models.TimeSeries.player_id) == col(models.Player.id))
        ).subquery()
        eod_timeseries = (
            select(
                ranked_timeseries.c.date,
                ranked_timeseries.c.player_id,
                ranked_timeseries.c.name,
                ranked_timeseries.c.rating
            )
            .select_from(ranked_timeseries)
            .where(ranked_timeseries.c.game_num == 1)
        )
        timeseries = session.exec(eod_timeseries).all()
        timeseries_points = [models.MinimalTimeSeriesPoint(*ts) for ts in timeseries]

        # Group player rating snapshots by date
        date_to_timeseries_points: defaultdict[
            datetime.date,
            list[models.MinimalTimeSeriesPoint]
        ] = defaultdict(list)
        for t in timeseries_points:
            date_to_timeseries_points[t.date].append(t)

        # Generate graph timeseries output format with rating deltas
        player_id_to_prev_rating = {}
        timeseries_results = []
        chronological_timeseries = sorted(
            list(date_to_timeseries_points.items()),
            key=lambda dated_timeseries: dated_timeseries[0]
        )
        for date, timeseries_points in chronological_timeseries:
            timeseries_result: dict[str, Any] = {
                "date": datetime.datetime.combine(date, datetime.time(0, 0, 0))
            }
            for tp in timeseries_points:
                timeseries_result[tp.name] = round(tp.rating)

                prev_rating = player_id_to_prev_rating.get(tp.player_id, 500)
                timeseries_result[f"{tp.name}_delta"] = round(tp.rating - prev_rating)

                player_id_to_prev_rating[tp.player_id] = timeseries_result[tp.name]
            timeseries_results.append(timeseries_result)

        return timeseries_results


@app.get("/")
def heartbeat():
    return {"ok": True}
