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

const PlayerDelta = ({player, delta, direction = "row"}) => {
  const color = delta > 0 ? "darkgreen" : "darkred";
  const symbol = delta > 0 ? "▲" : "▼";
  return (
    <Stack direction={direction} spacing={1}>
      <ColoredPlayerName player={player} />
      <Typography sx={{ color: color, opacity: 0.5 }}>
        {symbol}{Math.abs(delta)}
      </Typography>
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
          <colgroup>
            <col style={{width:'40%'}}/>
            <col style={{width:'20%'}}/>
            <col style={{width:'40%'}}/>
          </colgroup>
          <TableHead>
            <TableRow>
              <TableCell sx={{ textAlign: "right" }}>
                <Typography>Yellow</Typography>
              </TableCell>
              <TableCell></TableCell>
              <TableCell sx={{ textAlign: "left" }}>
                <Typography>Black</Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {games.map((game) => (
              <TableRow key={game.id}>
                <TableCell>
                  <Stack direction="column" alignItems="end" spacing={1} sx={{ fontSize: "medium"}}>
                    <PlayerDelta player={playerIdToStats[game.yellow_offense]} delta={game.yellow_offense_delta} />
                    <PlayerDelta player={playerIdToStats[game.yellow_defense]} delta={game.yellow_defense_delta} />
                  </Stack>
                </TableCell>
                <TableCell>
                  <Stack direction="column" alignItems="center" spacing={1} sx={{ fontSize: "medium" }}>
                    <GameScore yellowScore={game.yellow_score} blackScore={game.black_score} />
                    <Typography variant="body2" sx={{ fontSize: "small" }}>{dateFormatter.format(new Date(game.date))}</Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Stack direction="column" alignItems="start" spacing={1} sx={{ fontSize: "medium" }}>
                    <PlayerDelta player={playerIdToStats[game.black_offense]} delta={game.black_offense_delta} direction="row-reverse" />
                    <PlayerDelta player={playerIdToStats[game.black_defense]} delta={game.black_defense_delta} direction="row-reverse" />
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
