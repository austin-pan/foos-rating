import { useState } from "react";

import Players from "../../db/Players.js";

import styles from "./PlayerForm.module.scss";

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
    <form onSubmit={addPlayer} className={styles.playerForm}>
      {errorMessage ? <p className={styles.error}>{errorMessage}</p> : null}

      <div>
        <label htmlFor="name">Name: </label>
        <input type="text" id="name" name="name" onChange={onChange} value={formData.name} autoComplete="off" required />
      </div>

      <button type="submit">Add Player</button>
    </form>
  )
};

export default PlayerRecorder;