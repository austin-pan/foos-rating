import { useState } from "react";

import Container from "@mui/material/Container";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Grid from "@mui/material/Grid";

import Players from "../../db/Players.js";

const PlayerRecorder = ({players, refreshData}) => {
  const [formData, setFormData] = useState({name: ""});
  const [errorMessage, setErrorMessage] = useState(null)

  const addPlayer = async (e) => {
    e.preventDefault();

    try {
      if (players.some(p => p.name.trim().toLowerCase() == formData.name.trim().toLowerCase())) {
        throw new Error("Player already exists")
      }
      await Players.addPlayer(formData);
      refreshData();
      setErrorMessage(null);
      setFormData({name: ""});
    } catch (e) {
      setErrorMessage(e.message);
    }
  }

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  return (
    <Container component="form" onSubmit={addPlayer}>
      {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

      <Grid container spacing={2} alignItems="center">
        <Grid size={{xs: 12, sm: 8}}>
          <TextField
            label="Name"
            name="name"
            onChange={onChange}
            value={formData.name}
            autoComplete="off"
            required
            size="small"
            margin="dense"
            fullWidth
          />
        </Grid>
        <Grid size={{xs: 12, sm: 4}} sx={{display: "flex"}}>
          <Button type="submit" variant="contained" sx={{ flexGrow: 1 }}>Add Player</Button>
        </Grid>
      </Grid>

    </Container>
  )
};

export default PlayerRecorder;