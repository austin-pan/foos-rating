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

const PlayersSelect = ({fieldName, label, formData, onFormChange, players}) => {
  const selectedPlayers = new Set([
    formData.yellow_offense,
    formData.yellow_defense,
    formData.black_offense,
    formData.black_defense
  ]);
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
          <option key={p.id} value={p.id} disabled={selectedPlayers.has(p.id)}>{p.name}</option>
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
      type="phone"
      size="small"
      margin="dense"
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
      if (formData.yellow_score == 0 && formData.black_score == 0) {
        throw new Error("Both teams' scores cannot be 0")
      }

      await Games.addGame(formData);
      refreshData();
      setErrorMessage(null);
      setFormData({
        ...formData,
        "yellow_score": 0,
        "black_score": 0
      });
      setSnackbarOpen(true);
    } catch (e) {
      setErrorMessage(e.message);
    }
  }

  const deleteGame = async () => {
    try {
      await Games.deleteRecentGame();
      refreshData();
      setErrorMessage(null);
    } catch {
      setErrorMessage("Failed to delete game")
    }
  }

  const onFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  return (
    <>
      {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
      <Container component="form" onSubmit={addGame}>
        <Grid container spacing={2}>
          <Grid size={{xs: 12, sm: 6}}>
            <PlayersSelect fieldName="yellow_offense" label="Yellow Offense" formData={formData} onFormChange={onFormChange} players={players} />
            <PlayersSelect fieldName="yellow_defense" label="Yellow Defense" formData={formData} onFormChange={onFormChange} players={players} />
            <ScoreField fieldName="yellow_score" label="Yellow Score" formData={formData} onFormChange={onFormChange} />
          </Grid>
          <Grid size={{xs: 12, sm: 6}}>
            <PlayersSelect fieldName="black_offense" label="Black Offense" formData={formData} onFormChange={onFormChange} players={players} />
            <PlayersSelect fieldName="black_defense" label="Black Defense" formData={formData} onFormChange={onFormChange} players={players} />
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
              onClick={deleteGame}
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
          Game submitted!
        </MuiAlert>
      </Snackbar>
    </>
  )
};

export default GameRecorder;
