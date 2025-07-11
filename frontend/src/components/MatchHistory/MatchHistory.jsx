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

const PlayerDelta = ({player, delta}) => {
  const color = delta > 0 ? "darkgreen" : "darkred";
  const symbol = delta > 0 ? "▲" : "▼";
  return (
    <Stack direction="row" spacing={1}>
      <Typography sx={{ color: color, fontSize: "small", opacity: 0.5 }}>
        {symbol}{Math.abs(delta)}
      </Typography>
      <ColoredPlayerName player={player} />
    </Stack>
  )
}

const GameScore = ({yellowScore, blackScore}) => {
  if (yellowScore > blackScore) {
    return <Stack direction="row" spacing={1}>
      <Typography sx={{ fontWeight: "bold" }}>{yellowScore}</Typography>
      <Typography>-</Typography>
      <Typography>{blackScore}</Typography>
    </Stack>
  }
  return <Stack direction="row" spacing={1}>
    <Typography>{yellowScore}</Typography>
    <Typography>-</Typography>
    <Typography sx={{ fontWeight: "bold" }}>{blackScore}</Typography>
  </Stack>
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
                    <PlayerDelta player={playerIdToStats[game.yellow_offense]} delta={game.yellow_offense_delta} />
                    <PlayerDelta player={playerIdToStats[game.yellow_defense]} delta={game.yellow_defense_delta} />
                  </Stack>
                </TableCell>
                <TableCell sx={{ "fontSize": "medium" }}>
                  <GameScore yellowScore={game.yellow_score} blackScore={game.black_score} />
                </TableCell>
                <TableCell>
                  <Stack direction="column" spacing={1}>
                    <PlayerDelta player={playerIdToStats[game.black_offense]} delta={game.black_offense_delta} />
                    <PlayerDelta player={playerIdToStats[game.black_defense]} delta={game.black_defense_delta} />
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
