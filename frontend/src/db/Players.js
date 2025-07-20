const API_URL = import.meta.env.VITE_API_URL;

const readPlayers = async () => {
  const response = await fetch(`${API_URL}/api/players/`);

  if (response.status >= 400) {
    console.log(response);
    throw new Error("server error");
  }

  const players = await response.json()
  return players;
}

const readPlayersStats = async (seasonId) => {
  const response = await fetch(`${API_URL}/api/players/stats/?season_id=${seasonId}`);

  if (response.status >= 400) {
    console.log(response);
    throw new Error("server error");
  }

  const playersStats = await response.json()
  return playersStats;
}

const addPlayer = async (player) => {
  const response = await fetch(`${API_URL}/api/players/`, {
    method: "POST",
    body: JSON.stringify(player),
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    }
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
