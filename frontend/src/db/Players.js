const API_URL = import.meta.env.VITE_API_URL;

const readPlayers = async (seasonId) => {
  const response = await fetch(`${API_URL}/players/?season_id=${seasonId}`, {
    mode: "cors"
  });

  if (response.status >= 400) {
    console.log(response);
    throw new Error("server error");
  }

  const players = await response.json()
  return players;
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
  addPlayer
}
