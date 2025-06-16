import ColoredPlayerName from "../ColoredPlayerName/ColoredPlayerName";

const GameScore = ({score, otherScore}) => {
  if (score > otherScore) {
    return <span><strong>{score}</strong></span>
  }
  return <span>{score}</span>
}

const RecentGames = ({games, players}) => {
  const playerIdToPlayer = {};
  for (const player of players) {
    playerIdToPlayer[player.id] = player;
  }

  return (
    <div>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Yellow Offense</th>
            <th>Yellow Defense</th>
            <th>Yellow Score</th>
            <th>Black Score</th>
            <th>Black Offense</th>
            <th>Black Defense</th>
          </tr>
        </thead>
        <tbody>
          {games.map(game => {
            return (
              <tr key={game.id}>
                <td>{new Date(game.date).toLocaleDateString("en-US")}</td>
                <td>
                  <ColoredPlayerName playerId={game.yellow_offense} playerIdToPlayer={playerIdToPlayer} />
                </td>
                <td>
                  <ColoredPlayerName playerId={game.yellow_defense} playerIdToPlayer={playerIdToPlayer} />
                </td>
                <td><GameScore score={game.yellow_score} otherScore={game.black_score} /></td>
                <td><GameScore score={game.black_score} otherScore={game.yellow_score} /></td>
                <td>
                  <ColoredPlayerName playerId={game.black_offense} playerIdToPlayer={playerIdToPlayer} />
                </td>
                <td>
                  <ColoredPlayerName playerId={game.black_defense} playerIdToPlayer={playerIdToPlayer} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default RecentGames;
