import datetime
from sqlmodel import Field, Relationship, SQLModel, Column, DateTime, Index


## Game models
class GameBase(SQLModel):
    yellow_offense: str = Field(foreign_key="player.id", index=True)
    yellow_defense: str = Field(foreign_key="player.id", index=True)
    yellow_score: int
    black_offense: str = Field(foreign_key="player.id", index=True)
    black_defense: str = Field(foreign_key="player.id", index=True)
    black_score: int
    season_id: int | None = Field(
        default=None,
        foreign_key="season.id",
        ondelete="SET NULL",
        index=True
    )


class GameCreate(GameBase):
    pass


class GamePublic(GameBase):
    id: int
    date: datetime.datetime
    date_trunc_day: datetime.datetime


class Game(GameBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    date: datetime.datetime = Field(
        sa_column=Column(DateTime(timezone=True), nullable=False)
    )
    date_trunc_day: datetime.datetime = Field(
        sa_column=Column(DateTime(timezone=True), nullable=False)
    )

    timeseries: list["TimeSeries"] = Relationship(back_populates="game", cascade_delete=True)
    season: "Season" = Relationship(back_populates="games")

Index("game_date_idx", Game.date)
Index("game_date_trunc_day_idx", Game.date_trunc_day)


## Player models
class PlayerBase(SQLModel):
    name: str = Field(index=True)


class PlayerCreate(SQLModel):
    name: str


class PlayerPublic(PlayerBase):
    id: str
    color: str


class RatedPlayerPublic(PlayerPublic):
    rating: float
    probationary: bool
    win_rate: float


class Player(PlayerBase, table=True):
    id: str = Field(primary_key=True)
    color: str

    timeseries: list["TimeSeries"] = Relationship(back_populates="player")


## Rating models
class TimeSeries(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    game_id: int | None = Field(default=None, foreign_key="game.id", index=True)
    player_id: str = Field(foreign_key="player.id", index=True)
    rating: float
    win: bool

    game: "Game" = Relationship(back_populates="timeseries")
    player: "Player" = Relationship(back_populates="timeseries")


class MinimalTimeSeriesPoint:
    def __init__(self, date: datetime.date, player_id: str, name: str, rating: float):
        self.date = date
        self.player_id = player_id
        self.name = name
        self.rating = rating

    def __str__(self):
        return f"{self.date} | {self.name}: {self.rating}"

## Season models
class Season(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str
    start_date: datetime.date
    end_date: datetime.date
    active: bool

    games: list["Game"] = Relationship(back_populates="season")
