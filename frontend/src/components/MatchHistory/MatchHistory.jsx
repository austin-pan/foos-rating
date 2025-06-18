import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

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
    <TableContainer
      component={Paper}
      sx={{
        maxHeight: '400px',
        maxWidth: '650px',
        overflowY: 'auto',
        marginTop: '16px',
        marginBottom: '16px'
      }}>
      <Table
        sx={{
          minWidth: '550px',
          '& .MuiTableCell-root': {
            padding: '8px 16px',
            fontSize: '0.875rem'
          }
        }}
        stickyHeader
        size="small"
        aria-label="match history table"
      >
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Yellow Offense</TableCell>
            <TableCell>Yellow Defense</TableCell>
            <TableCell>Yellow Score</TableCell>
            <TableCell>Black Score</TableCell>
            <TableCell>Black Offense</TableCell>
            <TableCell>Black Defense</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {games.map((game) => (
            <TableRow key={game.id}>
              <TableCell>{new Date(game.date).toLocaleDateString("en-US", { timeZone: 'UTC' })}</TableCell>
              <TableCell>
                <ColoredPlayerName playerId={game.yellow_offense} playerIdToPlayer={playerIdToPlayer} />
              </TableCell>
              <TableCell>
                <ColoredPlayerName playerId={game.yellow_defense} playerIdToPlayer={playerIdToPlayer} />
              </TableCell>
              <TableCell><GameScore score={game.yellow_score} otherScore={game.black_score} /></TableCell>
              <TableCell><GameScore score={game.black_score} otherScore={game.yellow_score} /></TableCell>
              <TableCell>
                <ColoredPlayerName playerId={game.black_offense} playerIdToPlayer={playerIdToPlayer} />
              </TableCell>
              <TableCell>
                <ColoredPlayerName playerId={game.black_defense} playerIdToPlayer={playerIdToPlayer} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default RecentGames;
