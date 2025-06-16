import { useState, useEffect } from "react";

import RatingGraph from "../../components/RatingGraph/RatingGraph.jsx";
import MatchHistory from "../../components/MatchHistory/MatchHistory.jsx";
import PlayerForm from "../../components/PlayerForm/PlayerForm.jsx";
import GameForm from "../../components/GameForm/GameForm.jsx";
import Leaderboard from "../../components/Leaderboard/Leaderboard.jsx";

import Games from "../../db/Games.js";
import TimeSeries from "../../db/TimeSeries.js";
import Players from "../../db/Players.js";

import styles from "./Home.module.scss";

const API_URL = import.meta.env.VITE_API_URL;

const Home = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [games, setGames] = useState([]);
  const [timeseries, setTimeSeries] = useState([]);
  const [players, setPlayers] = useState([]);

  const refreshData = async () => {
    setGames(await Games.readGames());
    setTimeSeries(await TimeSeries.readTimeSeries());
    setPlayers(await Players.readPlayers());
  }

  useEffect(() => {
    const heartbeatKey = setInterval(() => {
      fetch(`${API_URL}/heartbeat/`, {
        mode: "cors"
      });
    }, 10 * 60 * 1000); // Every 10 minutes

    return () => {
      clearInterval(heartbeatKey);
    }
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        await refreshData();
      } catch (e) {
        console.log(e);
        setError(e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [])

  if (error) return <p>A network error was encountered</p>;
  if (isLoading) return <p>Loading... </p>;
  return (
    <div className={styles.content}>
      <h1>Leaderboard</h1>
      <div className={styles.stats}>
        <Leaderboard players={players} />
        <RatingGraph data={timeseries} players={players} />
      </div>

      <h1>Match History</h1>
      <MatchHistory games={games} players={players} />

      <h1>Forms</h1>
      <h2>Add Game</h2>
      <GameForm players={players} refreshData={refreshData} />

      <h2>Add Player</h2>
      <PlayerForm players={players} refreshData={refreshData} />
    </div>
  )
}

export default Home;