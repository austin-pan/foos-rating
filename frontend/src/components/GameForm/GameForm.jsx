import { useState, useContext, useEffect } from "react";

import dayjs from "dayjs";

import Grid from '@mui/material/Grid';
import Container from "@mui/material/Container";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import Box from '@mui/material/Box';

import { AuthContext } from "../../context/AuthContext.js";

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

const DatePickerField = ({fieldName, label, formData, onFormChange, sx}) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker
        label={label}
        value={formData[fieldName]}
        onChange={(newValue) => onFormChange(fieldName, newValue)}
        sx={sx}
        slotProps={{
          textField: {
            size: "small",
            margin: "dense"
          },
          popper: {
            sx: {
              zIndex: 1600
            }
          }
        }}
      />
    </LocalizationProvider>
  )
}


const GameForm = ({ players, refreshData, onSubmit, initialData, isEditing = false }) => {
  const { token } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    "yellow_offense": "",
    "yellow_defense": "",
    "yellow_score": 0,
    "black_offense": "",
    "black_defense": "",
    "black_score": 0,
    "date": dayjs()
  });

  // Initialize form with initialData if provided (for editing)
  useEffect(() => {
    if (initialData) {
      setFormData({
        yellow_offense: initialData.yellow_offense || "",
        yellow_defense: initialData.yellow_defense || "",
        yellow_score: initialData.yellow_score || 0,
        black_offense: initialData.black_offense || "",
        black_defense: initialData.black_defense || "",
        black_score: initialData.black_score || 0,
        date: dayjs(initialData.date)
      });
    }
  }, [initialData]);

  const [errorMessage, setErrorMessage] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState(null);

  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  }

  const handleSubmit = async (e) => {
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
      if (formData.date == null) {
        throw new Error("Date is required");
      }

      const submissionData = {
        ...formData,
        iso_date: formData.date.toISOString(),
        yellow_score: Number(formData.yellow_score),
        black_score: Number(formData.black_score)
      };

      if (isNaN(submissionData.yellow_score) || isNaN(submissionData.black_score)) {
        throw new Error("Scores must be numbers");
      }
      if (submissionData.yellow_score < 0 || submissionData.black_score < 0) {
        throw new Error("Scores cannot be negative");
      }
      if (submissionData.yellow_score === 0 && submissionData.black_score === 0) {
        throw new Error("Both teams' scores cannot be 0");
      }
      if (submissionData.yellow_score === submissionData.black_score) {
        throw new Error("Scores cannot be the same");
      }

      await onSubmit(submissionData, token);
      setErrorMessage(null);

      if (!isEditing) {
        // Reset form only for new game creation
        setFormData({
          ...formData,
          "yellow_score": 0,
          "black_score": 0,
          "iso_date": null,
          "date": dayjs()
        });
        showSnackbar("Game added");
      } else {
        showSnackbar("Game updated");
      }

      refreshData?.();
    } catch (e) {
      setErrorMessage(e.message);
    }
  };

  const onFormChange = (e) => {
    onKVFormChange(e.target.name, e.target.value);
  }

  const onKVFormChange = (k, v) => {
    setFormData({ ...formData, [k]: v });
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
      {errorMessage && <Alert severity="error" sx={{ marginBottom: 2 }}>{errorMessage}</Alert>}
      <Container component="form" onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid offset={{xs: 0, sm: 3}} size={{xs: 12, sm: 6}} sx={{ display: 'flex' }}>
            <DatePickerField fieldName="date" label="Date" formData={formData} onFormChange={onKVFormChange} sx={{ flexGrow: 1 }} />
          </Grid>
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
          <Grid offset={{xs: 0, sm: 3}} size={{xs: 12, sm: 6}} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="submit" variant="contained" color="primary" sx={{ flexGrow: 1 }}>
              {isEditing ? 'Update Game' : 'Add Game'}
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
        <MuiAlert onClose={() => setSnackbarOpen(false)} severity="success">
          {snackbarMessage}
        </MuiAlert>
      </Snackbar>
    </>
  )
};

export default GameForm;
