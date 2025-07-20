const API_URL = import.meta.env.VITE_API_URL;

const readGames = async (season_id) => {
  const response = await fetch(`${API_URL}/api/games/?season_id=${season_id}`);

  if (!response.ok) {
    throw new Error("Unable to read games");
  }

  const games = await response.json()
  return games;
}

const addGame = async (game) => {
  const response = await fetch(`${API_URL}/api/games/`, {
    method: "POST",
    body: JSON.stringify(game),
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    throw new Error("Unable to add game");
  }
};

const deleteLatestGame = async () => {
  const response = await fetch(`${API_URL}/api/games/latest/`, {
    method: "DELETE",
    credentials: "include"
  });

  if (!response.ok) {
    throw new Error("Unable to delete latest game");
  }
};

export default {
  readGames,
  addGame,
  deleteLatestGame,
};
