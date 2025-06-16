import { useState } from "react";

import Games from "../../db/Games.js";

import styles from "./GameForm.module.scss";

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
      if (formData.yellow_score == 0 && formData.black_score == 0) {
        throw new Error("Both teams' scores cannot be 0")
      }

      await Games.addGame(formData);
      refreshData();
      setErrorMessage(null);
      setFormData({
        "yellow_offense": "",
        "yellow_defense": "",
        "yellow_score": 0,
        "black_offense": "",
        "black_defense": "",
        "black_score": 0
      });
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

  const onDropdownChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  const PlayersDropdown = ({name, id}) => {
    const selectedPlayers = new Set([
      formData.yellow_offense,
      formData.yellow_defense,
      formData.black_offense,
      formData.black_defense
    ])
    return (
      <select name={name} id={id} onChange={onDropdownChange} value={formData[name]} required>
        <option value="" disabled>Please choose a player</option>
        {players.map(p => {
          return (
            <option key={p.id} value={p.id} disabled={selectedPlayers.has(p.id)}>{p.name}</option>
          )
        })}
      </select>
    )
  }

  return (
    <div className={styles.gameCrud}>
      {errorMessage ? <p className={styles.error}>{errorMessage}</p> : null}
      <form onSubmit={addGame} className={styles.gameForm}>
        <div className={styles.gameInfo}>
          <div className={styles.teamForm}>
            <label htmlFor="yellow_offense">Yellow Offense: </label>
            <PlayersDropdown name="yellow_offense" id="yellow_offense" />

            <label htmlFor="yellow_defense">Yellow Defense: </label>
            <PlayersDropdown name="yellow_defense" id="yellow_defense" />

            <label htmlFor="yellow_score">Yellow Score: </label>
            <input type="number" id="yellow_score" name="yellow_score" onChange={onDropdownChange} value={formData.yellow_score} required />
          </div>

          <div className={styles.teamForm}>
            <label htmlFor="black_offense">Black Offense: </label>
            <PlayersDropdown name="black_offense" id="black_offense" />

            <label htmlFor="black_defense">Black Defense: </label>
            <PlayersDropdown name="black_defense" id="black_defense" />

            <label htmlFor="black_score">Black Score: </label>
            <input type="number" id="black_score" name="black_score" onChange={onDropdownChange} value={formData.black_score} required />
          </div>
        </div>

        <button type="submit" className={styles.addButton}>Add Game</button>
      </form>

      <button onClick={deleteGame} className={styles.deleteButton}>Delete Last Game</button>
    </div>
  )
};

export default GameRecorder;
