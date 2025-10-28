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
  return playersStats.map((player, index) => ({
    ...player,
    color: `oklch(0.5818 0.1232 ${(360/playersStats.length) * index})`,
  }));
}

const addPlayer = async (player, token) => {
  const response = await fetch(`${API_URL}/api/players/`, {
    method: "POST",
    body: JSON.stringify(player),
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
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
