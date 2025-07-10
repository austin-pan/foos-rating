import { useState } from "react";
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Container from "@mui/material/Container";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";

import Games from "../../db/Games.js";

const positionIds = ["yellow_offense", "yellow_defense", "black_offense", "black_defense"];

const PlayersSelect = ({fieldName, label, formData, onFormChange, players}) => {
  const otherPositionIds = positionIds.filter(p => p != fieldName);
  const selectedPlayers = new Set(otherPositionIds.map(p => formData[p]));

  return (
    <TextField
      select
      label={label}
      name={fieldName}
      value={formData[fieldName]}
      onChange={onFormChange}
      required
      slotProps={{
        select: {
          native: true
        }
      }}
      size="small"
      margin="dense"
      fullWidth
    >
      <option value="" disabled></option>
      {players.map(p => {
        return (
          <option key={p.id} value={p.id}>{selectedPlayers.has(p.id) ? "* " : ""}{p.name}</option>
        )
      })}
    </TextField>
  )
}

const ScoreField = ({fieldName, label, formData, onFormChange}) => {
  return (
    <TextField
      fullWidth
      label={label}
      name={fieldName}
      value={formData[fieldName]}
      onChange={onFormChange}
      type="number"
      slotProps={{
        inputLabel: {
          shrink: true
        }
      }}
      size="small"
      margin="dense"
      autoComplete="off"
      required
    />
  )
}

const GameRecorder = ({players, refreshData}) => {
  const [formData, setFormData] = useState({
    "yellow_offense": "",
    "yellow_defense": "",
    "yellow_score": 0,
    "black_offense": "",
    "black_defense": "",
    "black_score": 0
  });

  const [errorMessage, setErrorMessage] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState(null);

  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  }

  const addGame = async (e) => {
    e.preventDefault();

    const participants = [
      formData.yellow_offense,
      formData.yellow_defense,
      formData.black_offense,
      formData.black_defense
    ]

    try {
      if (participants.length != new Set(participants).size) {
        throw new Error("All positions must be filled by different players");
      }
      if (isNaN(Number(formData.yellow_score)) || isNaN(Number(formData.black_score))) {
        throw new Error("Scores must be numbers");
      }
      if (Number(formData.yellow_score) == 0 && Number(formData.black_score) == 0) {
        throw new Error("Both teams' scores cannot be 0")
      }
      if (Number(formData.yellow_score) == Number(formData.black_score)) {
        throw new Error("Scores cannot be the same");
      }

      await Games.addGame(formData);
      refreshData();
      setErrorMessage(null);
      setFormData({
        ...formData,
        "yellow_score": 0,
        "black_score": 0
      });
      showSnackbar("Game added");
    } catch (e) {
      setErrorMessage(e.message);
    }
  }

  const deleteLatestGame = async () => {
    try {
      await Games.deleteLatestGame();
      showSnackbar("Game deleted");
      refreshData();
      setErrorMessage(null);
    } catch {
      setErrorMessage("Failed to delete game")
    }
  }

  const onFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  const onPlayerChange = (e) => {
    const { name: selectedPositionId, value: selectedPlayer } = e.target;
    const occupiedPositionId = positionIds.find(posId => formData[posId] === selectedPlayer);
    if (occupiedPositionId) {
      setFormData({ ...formData, [occupiedPositionId]: formData[selectedPositionId], [selectedPositionId]: formData[occupiedPositionId] });
    } else {
      setFormData({ ...formData, [selectedPositionId]: selectedPlayer });
    }
  }

  return (
    <>
      {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
      <Container component="form" onSubmit={addGame}>
        <Grid container spacing={2}>
          <Grid size={{xs: 12, sm: 6}}>
            <PlayersSelect fieldName="yellow_offense" label="Yellow Offense" formData={formData} onFormChange={onPlayerChange} players={players} />
            <PlayersSelect fieldName="yellow_defense" label="Yellow Defense" formData={formData} onFormChange={onPlayerChange} players={players} />
            <ScoreField fieldName="yellow_score" label="Yellow Score" formData={formData} onFormChange={onFormChange} />
          </Grid>
          <Grid size={{xs: 12, sm: 6}}>
            <PlayersSelect fieldName="black_offense" label="Black Offense" formData={formData} onFormChange={onPlayerChange} players={players} />
            <PlayersSelect fieldName="black_defense" label="Black Defense" formData={formData} onFormChange={onPlayerChange} players={players} />
            <ScoreField fieldName="black_score" label="Black Score" formData={formData} onFormChange={onFormChange} />
          </Grid>
        </Grid>

        <Grid container spacing={2} sx={{ marginTop: 2 }}>
          <Grid size={{xs: 12, sm: 6}} sx={{ display: 'flex' }}>
            <Button
              type="submit"
              variant="contained"
              sx={{ flexGrow: 1 }}
            >
              Add Game
            </Button>
          </Grid>
          <Grid size={{xs: 12, sm: 6}} sx={{ display: 'flex' }}>
            <Button
              onClick={deleteLatestGame}
              variant="outlined"
              sx={{ flexGrow: 1 }}
            >
              Delete Last Game
            </Button>
          </Grid>
        </Grid>
      </Container>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <MuiAlert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
          {snackbarMessage}
        </MuiAlert>
      </Snackbar>
    </>
  )
};

export default GameRecorder;
