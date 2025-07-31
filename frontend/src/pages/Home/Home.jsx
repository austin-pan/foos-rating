import { useState, useEffect, useContext } from "react";
import Icon from "@mdi/react";
import { mdiSleep } from "@mdi/js";
import Box from "@mui/material/Box";

import RatingGraph from "../../components/RatingGraph/RatingGraph.jsx";
import MatchHistory from "../../components/MatchHistory/MatchHistory.jsx";
import PlayerForm from "../../components/PlayerForm/PlayerForm.jsx";
import GameForm from "../../components/GameForm/GameForm.jsx";
import Leaderboard from "../../components/Leaderboard/Leaderboard.jsx";
import NavBar from "../../components/NavBar/NavBar.jsx";
import { AuthContext } from "../../context/AuthContext.js";

import Games from "../../db/Games.js";
import TimeSeries from "../../db/TimeSeries.js";
import Players from "../../db/Players.js";
import Season from "../../db/Season.js";
import styles from "./Home.module.scss";

import Container from "@mui/material/Container";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

const API_URL = import.meta.env.VITE_API_URL;

const refreshData = async (setGames, setTimeSeries, setPlayers, setPlayersStats, seasonId, setIsLoading = null) => {
  if (setIsLoading) {
    setIsLoading(true);
  }
  const [games, timeseries, players, playersStats] = await Promise.all([
    Games.readGames(seasonId),
    TimeSeries.readTimeSeries(seasonId),
    Players.readPlayers(),
    Players.readPlayersStats(seasonId)
  ]);
  setGames(games);
  setTimeSeries(timeseries);
  setPlayers(players);
  setPlayersStats(playersStats);
  if (setIsLoading) {
    setIsLoading(false);
  }
}

const Home = () => {
  const { user } = useContext(AuthContext);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [games, setGames] = useState([]);
  const [timeseries, setTimeSeries] = useState([]);
  const [players, setPlayers] = useState([]);
  const [playersStats, setPlayersStats] = useState([]);
  const [seasonId, setSeasonId] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const season = await Season.getCurrentSeason();
        setSeasonId(season.id);
        await refreshData(setGames, setTimeSeries, setPlayers, setPlayersStats, season.id);
      } catch (e) {
        console.log(e);
        setError(e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  if (error) return <ErrorPage />;
  return (
    <>
    <NavBar />
    <Container maxWidth="md" sx={{ marginBottom: 20, position: "relative" }}>
      <Typography variant="h3" component="h1" marginY={4}>Leaderboard</Typography>
      {
        isLoading ?
        <LoadingIcon /> :
        <>
          <SeasonSelector
            seasonId={seasonId}
            onChange={async (e) => {
              setSeasonId(e.target.value);
              await refreshData(setGames, setTimeSeries, setPlayers, setPlayersStats, e.target.value, setIsLoading);
            }}
          />
          <Leaderboard playersStats={playersStats} seasonId={seasonId} />
          <RatingGraph data={timeseries} playersStats={playersStats} seasonId={seasonId} />
        </>
      }

      <Typography variant="h3" component="h1" marginY={4}>Match History</Typography>
      {
        isLoading ?
        <LoadingIcon /> :
        <MatchHistory games={games} playersStats={playersStats} refreshData={() => refreshData(setGames, setTimeSeries, setPlayers, setPlayersStats, seasonId)} />
      }

      {
        user ?
        <>
          <Typography variant="h3" component="h1" marginY={4}>Forms</Typography>
          <Typography variant="h4" component="h2" marginY={4}>Add Game</Typography>
          {
            isLoading ?
            <LoadingIcon /> :
            <GameForm players={players} refreshData={() => refreshData(setGames, setTimeSeries, setPlayers, setPlayersStats, seasonId)} />
          }
          <Typography variant="h4" component="h2" marginY={4}>Add Player</Typography>
          {
            isLoading ?
            <LoadingIcon /> :
            <PlayerForm players={players} refreshData={() => refreshData(setGames, setTimeSeries, setPlayers, setPlayersStats, seasonId)} />
          }
        </> :
        null
      }
    </Container>
    </>
  )
}

const LoadingIcon = () => {
  // from https://tensor-svg-loaders.vercel.app/
  return (
    <Box display="flex" justifyContent="center" alignItems="center">
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
    </Box>
  )
}

const SeasonSelector = ({ seasonId, onChange }) => {
  return (
    <TextField
      select
      name="seasonId"
      value={seasonId}
      onChange={onChange}
      slotProps={{
        select: {
          native: true
        }
      }}
      size="small"
      margin="dense"
    >
      <option value={2}>Season 2</option>
      <option value={1}>Season 1</option>
    </TextField>
  );
};


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