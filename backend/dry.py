import sys
from datetime import datetime

import pandas as pd

from foos.database import models
from foos import rating


def main():
    games = pd.read_csv(sys.argv[1], nrows=None)
    players: list[str] = pd.concat(
        [games["yellow_front"], games["yellow_back"], games["black_front"], games["black_back"]]
    ).unique().tolist()

    games["yellow_front"] = games["yellow_front"].str.lower().replace(" ", "_")
    games["yellow_back"] = games["yellow_back"].str.lower().replace(" ", "_")
    games["black_front"] = games["black_front"].str.lower().replace(" ", "_")
    games["black_back"] = games["black_back"].str.lower().replace(" ", "_")

    player_id_to_rating = { p.lower().replace(" ", "_"): rating.BASE_RATING for p in players }
    for _, row in games.iterrows():
        game = models.Game(
            date = datetime.strptime(row["date"], "%m/%d/%y"),
            yellow_offense = row["yellow_front"],
            yellow_defense = row["yellow_back"],
            yellow_score = row["yellow_score"],
            black_offense = row["black_front"],
            black_defense = row["black_back"],
            black_score = row["black_score"]
        )
        game_player_ids = [
            game.yellow_offense,
            game.yellow_defense,
            game.black_offense,
            game.black_defense
        ]
        game_player_id_to_rating: dict[str, float] = {
            player_id: rating
            for player_id, rating in player_id_to_rating.items()
            if player_id in game_player_ids
        }
        player_id_to_rating.update(rating.update_ratings(game, game_player_id_to_rating))

    sorted_player_id_ratings = sorted(
        player_id_to_rating.items(),
        key=lambda x: x[1],
        reverse=True
    )
    for player_id, player_rating in sorted_player_id_ratings:
        print(f"{player_id}: {player_rating}")


if __name__ == "__main__":
    main()
