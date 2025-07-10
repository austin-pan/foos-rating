import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

import ColoredPlayerName from "../ColoredPlayerName/ColoredPlayerName";
import { dateFormatter } from "../../utils.js";

const GameScore = ({score, otherScore}) => {
  if (score > otherScore) {
    return <span><strong>{score}</strong></span>
  }
  return <span>{score}</span>
}

const MatchHistory = ({games, playersStats}) => {
  if (games.length == 0) {
    return (
      <Box display="flex" justifyContent="center">
        <Typography variant="body">No matches yet!</Typography>
      </Box>
    )
  }

  const playerIdToStats = {};
  for (const playerStats of playersStats) {
    playerIdToStats[playerStats.id] = playerStats;
  }

  return (
    <Paper elevation={3} sx={{ maxWidth: '550px', margin: 'auto' }}>
      <TableContainer
        sx={{
          maxHeight: '400px',
          overflowY: 'auto',
          marginTop: 2,
          marginBottom: 2
        }}>
        <Table
          stickyHeader
          size="small"
          aria-label="match history table"
        >
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Yellow</TableCell>
              <TableCell>Score</TableCell>
              <TableCell>Black</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {games.map((game) => (
              <TableRow key={game.id}>
                <TableCell>
                  {dateFormatter.format(new Date(game.date))}
                </TableCell>
                <TableCell>
                  <Stack direction="column" spacing={1}>
                    <ColoredPlayerName player={playerIdToStats[game.yellow_offense]} />
                    <ColoredPlayerName player={playerIdToStats[game.yellow_defense]} />
                  </Stack>
                </TableCell>
                <TableCell>
                  <GameScore score={game.yellow_score} otherScore={game.black_score} />
                  <span> - </span>
                  <GameScore score={game.black_score} otherScore={game.yellow_score} />
                </TableCell>
                <TableCell>
                  <Stack direction="column" spacing={1}>
                    <ColoredPlayerName player={playerIdToStats[game.black_offense]} />
                    <ColoredPlayerName player={playerIdToStats[game.black_defense]} />
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

export default MatchHistory;
