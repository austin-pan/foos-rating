const API_URL = import.meta.env.VITE_API_URL;

const readTimeSeries = async (seasonId) => {
  const response = await fetch(`${API_URL}/api/timeseries/day/?season_id=${seasonId}`);

  if (response.status >= 400) {
    console.log(response);
    throw new Error("server error");
  }

  const timeseries = (await response.json())
    .map(d => {
      return {...d, date: new Date(d.date).getTime()}
    })
  return timeseries;
};

export default {
  readTimeSeries
};
