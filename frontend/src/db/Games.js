const API_URL = import.meta.env.VITE_API_URL;

const readGames = async (season_id) => {
  const response = await fetch(`${API_URL}/games/?season_id=${season_id}`, {
    mode: "cors"
  });

  if (response.status >= 400) {
    console.log(response);
    throw new Error("server error");
  }

  const games = await response.json()
  return games;
}

const addGame = async (game) => {
  const response = await fetch(`${API_URL}/games/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(game),
    mode: "cors"
  });

  if (!response.ok) {
    throw new Error("HTTP Error")
  }
}

const deleteLatestGame = async () => {
  const response = await fetch(`${API_URL}/games/latest/`, {
    method: "DELETE",
    mode: "cors"
  });

  if (!response.ok) {
    throw new Error("HTTP Error");
  }
}

export default {
  readGames,
  addGame,
  deleteLatestGame
}
