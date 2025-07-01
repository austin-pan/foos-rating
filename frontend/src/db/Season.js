const API_URL = import.meta.env.VITE_API_URL;

const getCurrentSeason = async () => {
  const response = await fetch(`${API_URL}/seasons/current`, {
    mode: "cors"
  });

  if (response.status >= 400) {
    console.log(response);
    throw new Error("server error");
  }

  const season = await response.json();
  return season;
};

export default {
  getCurrentSeason
};
