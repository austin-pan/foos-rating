const API_URL = import.meta.env.VITE_API_URL;

const readPlayers = async () => {
  const response = await fetch(`${API_URL}/players/`, {
    mode: "cors"
  });

  if (response.status >= 400) {
    console.log(response);
    throw new Error("server error");
  }

  const players = await response.json()
  return players;
}

const readPlayersStats = async (seasonId) => {
  const response = await fetch(`${API_URL}/players/stats/?season_id=${seasonId}`, {
    mode: "cors"
  });

  if (response.status >= 400) {
    console.log(response);
    throw new Error("server error");
  }

  const playersStats = await response.json()
  return playersStats;
}

const addPlayer = async (player) => {
  const response = await fetch(`${API_URL}/players/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(player),
    mode: "cors"
  });

  if (!response.ok) {
    throw new Error("HTTP Error")
  }
}

export default {
  readPlayers,
  readPlayersStats,
  addPlayer
}
