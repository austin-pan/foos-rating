from collections import defaultdict
import datetime
from zoneinfo import ZoneInfo
import os
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlmodel import Session, col, desc, select, func
from sqlalchemy.orm import aliased

from foos import color, database as db, rating
from foos.database import models


load_dotenv()
PST = ZoneInfo("America/Los_Angeles")
SHARED_SECRET = os.getenv("SHARED_SECRET")
if not SHARED_SECRET:
    raise ValueError("Invalid shared secret")
ORIGINS = os.getenv("ORIGINS")
if not ORIGINS:
    raise ValueError("Invalid origins")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGINS.split(","),
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"]
)


@app.middleware("http")
async def verify_internal_token(request: Request, call_next):
    token = request.headers.get("X-Auth-Token")
    if token != SHARED_SECRET:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"detail": "Unauthorized: Invalid internal token"}
        )
    response = await call_next(request)
    return response


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

        num_games = session.exec(
            select(func.count(models.Game.id))
        ).one()
        game_date = (
            datetime.datetime.fromisoformat(game.iso_date)
            .astimezone(PST)
            .replace(hour=0, minute=0, second=0, microsecond=0)
        )

        games_affected = []
        today = datetime.datetime.now(PST).replace(hour=0, minute=0, second=0, microsecond=0)
        # Insert game if it's in the past
        if num_games > 0 and game_date < today:
            # Find the closest game with date earlier than game_date
            closest_earlier_game = session.exec(
                select(models.Game)
                .where(models.Game.date <= game_date)
                .order_by(desc(models.Game.game_number))
                .limit(1)
            ).first()
            insert_game_number = closest_earlier_game.game_number + 1

            # Delete stale timeseries points
            stale_timeseries_points = session.exec(
                select(models.TimeSeries)
                .join(models.Game)
                .where(models.Game.game_number >= insert_game_number)
            ).all()
            for stale_timeseries_point in stale_timeseries_points:
                session.delete(stale_timeseries_point)

            # Bump game numbers
            stale_games = session.exec(
                select(models.Game)
                .where(models.Game.game_number >= insert_game_number)
                .order_by(desc(models.Game.game_number))
            ).all()
            if len(stale_games) > 0:
                for stale_game in stale_games:
                    stale_game.game_number += 1
                    session.add(stale_game)
                    session.commit()
                    session.refresh(stale_game)
                games_affected.extend(stale_games)
        else:
            insert_game_number = num_games + 1

        db_game = models.Game.model_validate(game, update={
            "season_id": current_season.id,
            "date": game_date,
            "game_number": insert_game_number
        })
        games_affected.append(db_game)
        games_affected = games_affected[::-1]

        session.add(db_game)
        session.commit()

        player_id_to_snapshot_rating = rating.get_player_ratings(
            session,
            current_season.id,
            date=game_date,
        )
        timeseries_points = rating.calculate_timeseries_points(
            games_affected,
            player_id_to_snapshot_rating,
            current_season.rating_method
        )
        session.add_all(timeseries_points)
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
            .order_by(desc(col(models.Game.date)), desc(col(models.Game.game_number)))
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
            .order_by(desc(col(models.Game.date)), desc(col(models.Game.game_number)))
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


@app.get("/players/stats/", response_model=list[models.RatedPlayerPublic])
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


@app.get("/timeseries/day/", response_model=list[dict[str, Any]])
def read_ratings(season_id: int):
    with Session(db.engine) as session:
        eod_timeseries_query = (
            select(
                models.Game.date,
                models.TimeSeries.player_id,
                models.Player.name,
                models.TimeSeries.rating
            )
            .join(models.TimeSeries, models.TimeSeries.game_id == models.Game.id)
            .join(models.Player, models.TimeSeries.player_id == models.Player.id)
            .where(models.Game.season_id == season_id)
            .order_by(
                models.TimeSeries.player_id,
                desc(models.Game.date),
                desc(models.Game.game_number)
            )
            .prefix_with(
                f"DISTINCT ON ({models.TimeSeries.player_id}, {models.Game.date})"
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
