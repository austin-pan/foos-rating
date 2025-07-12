from collections import defaultdict
import datetime
from zoneinfo import ZoneInfo
import os
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, col, desc, func, select, join
from sqlalchemy.orm import aliased

from foos import color, database as db, rating
from foos.database import models


load_dotenv()

app = FastAPI()

origins = os.getenv("ORIGINS")
if not origins:
    raise ValueError("Invalid origins")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins.split(","),
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"]
)

PST = ZoneInfo("America/Los_Angeles")


@app.on_event("startup")
def on_startup():
    db.create_db_and_tables()


@app.post("/games/", response_model=models.GamePublic)
def create_game(game: models.GameCreate):
    if game.black_score == game.yellow_score:
        raise HTTPException(status_code=400, detail="Tie game")
    if game.black_score < 0 or game.yellow_score < 0:
        raise HTTPException(status_code=400, detail="Invalid score")
    if len(set([
        game.yellow_offense,
        game.yellow_defense,
        game.black_offense,
        game.black_defense
    ])) != 4:
        raise HTTPException(status_code=400, detail="Invalid players")

    with Session(db.engine) as session:
        current_season = session.exec(
            select(models.Season)
            .where(models.Season.active)
        ).first()
        if not current_season or not current_season.id:
            raise HTTPException(status_code=400, detail="No active season")

        now = datetime.datetime.now(PST)
        db_game = models.Game.model_validate(game, update={
            "season_id": current_season.id,
            "date": now,
            "date_trunc_day": now.replace(hour=0, minute=0, second=0, microsecond=0)
        })

        session.add(db_game)
        session.commit()

        game_player_ids = [
            db_game.yellow_offense,
            db_game.yellow_defense,
            db_game.black_offense,
            db_game.black_defense
        ]
        player_id_to_current_rating = rating.get_player_ratings(
            session, game_player_ids, current_season.id
        )
        player_id_to_updated_rating = rating.update_ratings(
            db_game, player_id_to_current_rating, current_season.rating_method
        )
        for player_id, updated_rating in player_id_to_updated_rating.items():
            db_timeseries_point = models.TimeSeries(
                game_id=db_game.id,
                player_id=player_id,
                rating=updated_rating,
                delta=updated_rating - player_id_to_current_rating[player_id],
                win=updated_rating > player_id_to_current_rating[player_id]
            )
            session.add(db_timeseries_point)

        session.commit()
        session.refresh(db_game)
        return db_game


@app.get("/games/", response_model=list[models.GameDeltaPublic])
def read_games(season_id: int, offset: int = 0, limit: int = Query(default=20, le=100)):
    with Session(db.engine) as session:
        # Create aliases for the TimeSeries table for each player position
        tyo = aliased(models.TimeSeries)
        tyd = aliased(models.TimeSeries)
        tbo = aliased(models.TimeSeries)
        tbd = aliased(models.TimeSeries)

        query = (
            select(
                models.Game,
                tyo.rating.label("yellow_offense_rating"),
                tyo.delta.label("yellow_offense_delta"),
                tyd.rating.label("yellow_defense_rating"),
                tyd.delta.label("yellow_defense_delta"),
                tbo.rating.label("black_offense_rating"),
                tbo.delta.label("black_offense_delta"),
                tbd.rating.label("black_defense_rating"),
                tbd.delta.label("black_defense_delta")
            )
            .join(
                tyo,
                (models.Game.id == tyo.game_id) &
                (models.Game.yellow_offense == tyo.player_id)
            )
            .join(
                tyd,
                (models.Game.id == tyd.game_id) &
                (models.Game.yellow_defense == tyd.player_id)
            )
            .join(
                tbo,
                (models.Game.id == tbo.game_id) &
                (models.Game.black_offense == tbo.player_id)
            )
            .join(
                tbd,
                (models.Game.id == tbd.game_id) &
                (models.Game.black_defense == tbd.player_id)
            )
            .where(models.Game.season_id == season_id)
            .order_by(desc(col(models.Game.date)), desc(col(models.Game.id)))
            .limit(limit)
            .offset(offset)
        )
        games = [
            models.GameDeltaPublic.model_validate(
                game,
                update={
                    "yellow_offense_rating": round(deltas[0]),
                    "yellow_offense_delta": round(deltas[1]),
                    "yellow_defense_rating": round(deltas[2]),
                    "yellow_defense_delta": round(deltas[3]),
                    "black_offense_rating": round(deltas[4]),
                    "black_offense_delta": round(deltas[5]),
                    "black_defense_rating": round(deltas[6]),
                    "black_defense_delta": round(deltas[7])
                }
            )
            for game, *deltas in session.exec(query).all()
        ]
        return games


@app.delete("/games/latest/")
def delete_latest_game():
    with Session(db.engine) as session:
        db_game = session.exec(
            select(models.Game)
            .order_by(desc(col(models.Game.date)), desc(col(models.Game.id)))
        ).first()
        if not db_game:
            raise HTTPException(status_code=404, detail="Game not found")
        # Delete the game and all associated timeseries points through cascade
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


@app.get("/players/", response_model=list[models.PlayerPublic])
def read_players():
    with Session(db.engine) as session:
        players = session.exec(
            select(models.Player)
            .order_by(models.Player.name)
        ).all()
        return players


@app.get("/players/stats", response_model=list[models.RatedPlayerPublic])
def read_player_stats(season_id: int):
    with Session(db.engine) as session:
        player_to_stats = rating.get_player_stats(session, season_id)
        rated_players = [
            models.RatedPlayerPublic.model_validate(
                p,
                update={
                    "rating": round(stats.rating),
                    "probationary": stats.num_games < 10,
                    "win_rate": round(100 * stats.win_rate, 2)
                }
            )
            for p, stats in player_to_stats.items()
        ]
        return rated_players


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
def read_ratings(season_id: int):
    with Session(db.engine) as session:
        eod_timeseries_query = (
            select(
                models.Game.date_trunc_day,
                models.TimeSeries.player_id,
                models.Player.name,
                models.TimeSeries.rating
            )
            .join(models.TimeSeries, models.TimeSeries.game_id == models.Game.id)
            .join(models.Player, models.TimeSeries.player_id == models.Player.id)
            .where(models.Game.season_id == season_id)
            .order_by(
                models.TimeSeries.player_id,
                desc(models.Game.date_trunc_day),
                desc(models.Game.date),
                desc(models.Game.id)
            )
            .prefix_with(
                f"DISTINCT ON ({models.TimeSeries.player_id}, {models.Game.date_trunc_day})"
            )
        )
        timeseries = session.exec(eod_timeseries_query).all()
        timeseries_points = [models.MinimalTimeSeriesPoint(*ts) for ts in timeseries]

        # Group player rating snapshots by date
        date_to_timeseries_points: defaultdict[
            datetime.datetime,
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
            timeseries_result: dict[str, Any] = {"date": date}
            for tp in timeseries_points:
                timeseries_result[tp.name] = round(tp.rating)

                prev_rating = player_id_to_prev_rating.get(tp.player_id, 500)
                timeseries_result[f"{tp.name}_delta"] = round(tp.rating - prev_rating)

                player_id_to_prev_rating[tp.player_id] = timeseries_result[tp.name]
            timeseries_results.append(timeseries_result)

        return timeseries_results


@app.get("/seasons/current", response_model=models.Season)
def get_current_season():
    with Session(db.engine) as session:
        return session.exec(select(models.Season).where(models.Season.active)).one()


@app.get("/")
def heartbeat():
    return {"ok": True}
