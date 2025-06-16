import ColoredPlayerName from "../ColoredPlayerName/ColoredPlayerName";

import styles from "./Leaderboard.module.scss";

const Leaderboard = ({players}) => {
  const sortedPlayers = [...players].sort((a, b) => b.rating - a.rating);
  const playerIdToPlayer = {};
  for (const player of players) {
    playerIdToPlayer[player.id] = player;
  }

  return (
    <div className={styles.leaderboard}>
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Name</th>
            <th>Rating</th>
          </tr>
        </thead>
        <tbody>
          {sortedPlayers.map((p, i) => {
            return (
              <tr key={p.id}>
                <td>{i + 1}</td>
                <td><ColoredPlayerName playerId={p.id} playerIdToPlayer={playerIdToPlayer} /></td>
                <td>{p.rating}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
};

export default Leaderboard;
