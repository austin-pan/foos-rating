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
    <Paper elevation={3}>
      <TableContainer
        sx={{
          maxHeight: '400px',
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
                  <ColoredPlayerName player={playerIdToPlayer[game.yellow_offense]} />
                </TableCell>
                <TableCell>
                  <ColoredPlayerName player={playerIdToPlayer[game.yellow_defense]} />
                </TableCell>
                <TableCell><GameScore score={game.yellow_score} otherScore={game.black_score} /></TableCell>
                <TableCell><GameScore score={game.black_score} otherScore={game.yellow_score} /></TableCell>
                <TableCell>
                  <ColoredPlayerName player={playerIdToPlayer[game.black_offense]} />
                </TableCell>
                <TableCell>
                  <ColoredPlayerName player={playerIdToPlayer[game.black_defense]} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

export default RecentGames;
