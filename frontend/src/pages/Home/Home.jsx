import { useState, useEffect } from "react";
import Icon from "@mdi/react";
import { mdiSleep } from "@mdi/js";

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
      fetch(`${API_URL}/`, {
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

  if (error) return <ErrorPage />;
  return (
    <div className={styles.content}>
      <h1>Leaderboard</h1>
      {
        isLoading ?
        <LoadingIcon /> :
        <>
          <Leaderboard players={players} />
          <RatingGraph data={timeseries} players={players} />
        </>
      }

      <h1>Match History</h1>
      {
        isLoading ?
        <LoadingIcon /> :
        <MatchHistory games={games} players={players} />
      }

      <h1>Forms</h1>
      <h2>Add Game</h2>
      {
        isLoading ?
        <LoadingIcon /> :
        <GameForm players={players} refreshData={refreshData} />
      }

      <h2>Add Player</h2>
      {
        isLoading ?
        <LoadingIcon /> :
        <PlayerForm players={players} refreshData={refreshData} />
      }
    </div>
  )
}

const LoadingIcon = () => {
  // from https://tensor-svg-loaders.vercel.app/
  return (
    <svg viewBox="0 0 50 50" className={styles.loadingIcon}>
      <circle cx="10" cy="25" r="2">
        <animate attributeName="cy" values="25;20;25;30;25" dur="1s" begin="0s" repeatCount="indefinite"></animate>
        <animate attributeName="opacity" values="1;0.3;1" dur="1s" begin="0s" repeatCount="indefinite"></animate>
      </circle>
      <circle cx="18" cy="25" r="2">
        <animate attributeName="cy" values="25;20;25;30;25" dur="1s" begin="0.1s" repeatCount="indefinite"></animate>
        <animate attributeName="opacity" values="1;0.3;1" dur="1s" begin="0.1s" repeatCount="indefinite"></animate>
      </circle>
      <circle cx="26" cy="25" r="2">
        <animate attributeName="cy" values="25;20;25;30;25" dur="1s" begin="0.2s" repeatCount="indefinite"></animate>
        <animate attributeName="opacity" values="1;0.3;1" dur="1s" begin="0.2s" repeatCount="indefinite"></animate>
      </circle>
      <circle cx="34" cy="25" r="2">
        <animate attributeName="cy" values="25;20;25;30;25" dur="1s" begin="0.30000000000000004s" repeatCount="indefinite"></animate>
        <animate attributeName="opacity" values="1;0.3;1" dur="1s" begin="0.30000000000000004s" repeatCount="indefinite"></animate>
      </circle>
      <circle cx="42" cy="25" r="2">
        <animate attributeName="cy" values="25;20;25;30;25" dur="1s" begin="0.4s" repeatCount="indefinite"></animate>
        <animate attributeName="opacity" values="1;0.3;1" dur="1s" begin="0.4s" repeatCount="indefinite"></animate>
      </circle>
    </svg>
  )
}


const ErrorPage = () => {
  return (
    <div className={styles.error}>
      <h1>An error has occurred</h1>
      <p>The backend probably went to sleep and is now waking up. Hopefully <strong>refreshing</strong> shortly will fix everything!</p>
        <Icon path={mdiSleep} className={styles.icon} />
    </div>
  );
};

export default Home;