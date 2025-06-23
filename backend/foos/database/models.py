import datetime
from sqlmodel import Field, Relationship, SQLModel


## Game models
class GameBase(SQLModel):
    date: datetime.datetime = datetime.datetime.now()
    yellow_offense: str = Field(foreign_key="player.id")
    yellow_defense: str = Field(foreign_key="player.id")
    yellow_score: int
    black_offense: str = Field(foreign_key="player.id")
    black_defense: str = Field(foreign_key="player.id")
    black_score: int


class GameCreate(GameBase):
    pass


class GamePublic(GameBase):
    id: int


class Game(GameBase, table=True):
    id: int | None = Field(default=None, primary_key=True)

    timeseries: list["TimeSeries"] = Relationship(back_populates="game", cascade_delete=True)


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
    game_count: int


class Player(PlayerBase, table=True):
    id: str = Field(primary_key=True)
    color: str

    timeseries: list["TimeSeries"] = Relationship(back_populates="player")


## Rating models
class TimeSeries(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    game_id: int | None = Field(default=None, foreign_key="game.id")
    player_id: str = Field(foreign_key="player.id")
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
class Season(SQLModel):
    id: int | None = Field(default=None, primary_key=True)
    start_date: datetime.datetime
    end_date: datetime.datetime
