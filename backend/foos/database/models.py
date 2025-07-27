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


class GameCreate(GameBase):
    iso_date: str


class GamePublic(GameBase):
    id: int
    date: datetime.datetime


class GameDeltaPublic(GameBase):
    id: int
    date: datetime.datetime

    yellow_offense_rating: int
    yellow_offense_delta: int

    yellow_defense_rating: int
    yellow_defense_delta: int

    black_offense_rating: int
    black_offense_delta: int

    black_defense_rating: int
    black_defense_delta: int


class Game(GameBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    game_number: int | None = Field(unique=True)
    date: datetime.datetime = Field(
        sa_column=Column(DateTime(timezone=True), nullable=False)
    )
    season_id: int | None = Field(
        default=None,
        foreign_key="season.id",
        ondelete="SET NULL",
        index=True
    )

    created_at: datetime.datetime = Field(
        default_factory=lambda: datetime.datetime.now(tz=datetime.timezone.utc),
        sa_column=Column(DateTime(timezone=True), nullable=False)
    )
    updated_at: datetime.datetime = Field(
        default_factory=lambda: datetime.datetime.now(tz=datetime.timezone.utc),
        sa_column=Column(DateTime(timezone=True), nullable=False)
    )
    removed_at: datetime.datetime | None = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), nullable=True)
    )

    timeseries: list["TimeSeries"] = Relationship(back_populates="game", cascade_delete=True)
    season: "Season" = Relationship(back_populates="games")

Index("game_date_idx", Game.date)


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

    def __hash__(self):
        return hash(self.id)

    def __eq__(self, other):
        return self.id == other.id


## Rating models
class TimeSeries(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    game_id: int | None = Field(default=None, foreign_key="game.id", index=True)
    player_id: str = Field(foreign_key="player.id", index=True)
    rating: float
    delta: float
    win: bool

    game: "Game" = Relationship(back_populates="timeseries")
    player: "Player" = Relationship(back_populates="timeseries")

Index("timeseries_player_id_rating_idx", TimeSeries.player_id, TimeSeries.rating)


class MinimalTimeSeriesPoint:
    def __init__(self, date: datetime.datetime, player_id: str, name: str, rating: float):
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
    rating_method: str
    active: bool

    games: list["Game"] = Relationship(back_populates="season")
