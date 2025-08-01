const API_URL = import.meta.env.VITE_API_URL;

const readGames = async (season_id) => {
  const response = await fetch(`${API_URL}/api/games/?season_id=${season_id}`);

  if (!response.ok) {
    throw new Error("Unable to read games");
  }

  const games = await response.json()
  return games;
}

const addGame = async (game, token) => {
  if (!token) {
    throw new Error("No token provided");
  }
  const response = await fetch(`${API_URL}/api/games/`, {
    method: "POST",
    body: JSON.stringify(game),
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error("Unable to add game");
  }
};

const moveGame = async (game_id, delta, token) => {
  if (!token) {
    throw new Error("No token provided");
  }
  const response = await fetch(`${API_URL}/api/games/move/?game_id=${game_id}&delta=${delta}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error("Unable to move game");
  }
}

const updateGame = async (game_id, game, token) => {
  if (!token) {
    throw new Error("No token provided");
  }
  const response = await fetch(`${API_URL}/api/games/?game_id=${game_id}`, {
    method: "PUT",
    body: JSON.stringify(game),
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error("Unable to update game");
  }
}

const deleteGame = async (game_id, token) => {
  if (!token) {
    throw new Error("No token provided");
  }
  const response = await fetch(`${API_URL}/api/games/?game_id=${game_id}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error("Unable to delete game");
  }
}

export default {
  readGames,
  addGame,
  moveGame,
  updateGame,
  deleteGame
};
