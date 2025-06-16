const API_URL = import.meta.env.VITE_API_URL;

const readGames = async () => {
  const response = await fetch(`${API_URL}/games`, {
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
  const response = await fetch(`${API_URL}/games`, {
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

const deleteRecentGame = async () => {
  const response = await fetch(`${API_URL}/games/recent`, {
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
  deleteRecentGame
}
