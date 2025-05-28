import pandas as pd
import numpy as np
import delta

class Team:
    def __init__(self, offense: str, defense: str, score: int):
        self.offense = offense
        self.defense = defense
        self.score = score

class Game:
    def __init__(self, team_a: Team, team_b: Team):
        self.team_a = team_a
        self.team_b = team_b


WIN_SCORE = 5

games = pd.read_csv("./games.csv")
players = pd.concat(
    [games["yellow_front"], games["yellow_back"], games["black_front"], games["black_back"]]
).unique()

columns = [
    "rating",
    "wins", "losses",
    "offense_wins", "offense_losses",
    "defense_wins", "defense_losses"
]
stats = pd.DataFrame(
    data=np.zeros((len(players), len(columns))),
    columns=columns,
    index=players
)
stats["rating"] = 100.0

for i, row in games.iterrows():
    game = Game(
        Team(row["yellow_front"], row["yellow_back"], int(row["yellow_score"])),
        Team(row["black_front"], row["black_back"], int(row["black_score"]))
    )
    [win_team, lose_team] = sorted(
        [game.team_a, game.team_b],
        key=lambda team: team.score,
        reverse=True
    )

    win_team_rating = stats.loc[[win_team.offense, win_team.defense]]["rating"].mean()
    lose_team_rating = stats.loc[[lose_team.offense, lose_team.defense]]["rating"].mean()
    rating_diff = win_team_rating - lose_team_rating
    actual_score_diff = win_team.score - lose_team.score

    d = delta.scaled_square_differential(
        actual_score_diff=actual_score_diff,
        rating_diff=rating_diff,
        win_score=WIN_SCORE
    )
    # d = delta.square_differential(actual_score_diff)

    # TODO calculate these directly rather than counting (I'm lazy)
    stats.loc[win_team.offense, "wins"] += 1
    stats.loc[win_team.offense, "offense_wins"] += 1
    stats.loc[win_team.defense, "wins"] += 1
    stats.loc[win_team.defense, "defense_wins"] += 1
    stats.loc[lose_team.offense, "losses"] += 1
    stats.loc[lose_team.offense, "offense_losses"] += 1
    stats.loc[lose_team.defense, "losses"] += 1
    stats.loc[lose_team.defense, "defense_losses"] += 1

    stats.loc[win_team.offense, "rating"] += d
    stats.loc[win_team.defense, "rating"] += d
    stats.loc[lose_team.offense, "rating"] -= d
    stats.loc[lose_team.defense, "rating"] -= d

pretty_stats = stats.copy()
pretty_stats["rating"] = stats["rating"].apply(round)
pretty_stats["win_rate"] = round(100 * stats["wins"] / (stats["wins"] + stats["losses"]), 2)
pretty_stats["offense_win_rate"] = round(100 * stats["offense_wins"] / (stats["offense_wins"] + stats["offense_losses"]), 2)
pretty_stats["defense_win_rate"] = round(100 * stats["defense_wins"] / (stats["defense_wins"] + stats["defense_losses"]), 2)
for c in ["wins", "losses", "offense_wins", "offense_losses", "defense_wins", "defense_losses"]:
    pretty_stats[c] = stats[c].astype(int)

print(pretty_stats.sort_values(by="rating", ascending=False))
