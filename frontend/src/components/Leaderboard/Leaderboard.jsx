import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

import ColoredPlayerName from "../ColoredPlayerName/ColoredPlayerName";

const Leaderboard = ({playersStats}) => {
  const experiencedPlayers = [...playersStats].filter(playerStats => !playerStats.probationary).sort((a, b) => b.rating - a.rating);
  const newPlayers = [...playersStats].filter(playerStats => playerStats.probationary).sort((a, b) => b.rating - a.rating);
  const sortedPlayers = [...experiencedPlayers, ...newPlayers];
  const playerIdToPlayerStats = {};
  for (const playerStats of playersStats) {
    playerIdToPlayerStats[playerStats.id] = playerStats;
  }

  return (
    <Paper elevation={3} sx={{ maxWidth: '550px', margin: 'auto' }}>
      <TableContainer
        sx={{
          maxHeight: '300px',
          overflowY: 'auto',
          marginTop: 2,
          marginBottom: 2
        }}>
        <Table
          sx={{
            minWidth: 200,
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
              <TableCell>Rank</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Rating</TableCell>
              <TableCell>Win Rate</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedPlayers.map((playerStats, i) => {
              return (
                <TableRow key={playerStats.id} sx={{opacity: !playerStats.probationary ? 1 : 0.4}}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>
                    <ColoredPlayerName player={playerStats} />
                  </TableCell>
                  <TableCell>{playerStats.rating}</TableCell>
                  <TableCell>{playerStats.win_rate}%</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  )
};

export default Leaderboard;
