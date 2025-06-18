import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

import ColoredPlayerName from "../ColoredPlayerName/ColoredPlayerName";

const Leaderboard = ({players}) => {
  const sortedPlayers = [...players].sort((a, b) => b.rating - a.rating);
  const playerIdToPlayer = {};
  for (const player of players) {
    playerIdToPlayer[player.id] = player;
  }

  return (
    <TableContainer
      component={Paper}
      sx={{
        maxHeight: '300px',
        maxWidth: '500px',
        overflowY: 'auto',
        marginTop: '16px',
        marginBottom: '16px'
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
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedPlayers.map((p, i) => {
            return (
              <TableRow key={p.id}>
                <TableCell>{i + 1}</TableCell>
                <TableCell><ColoredPlayerName playerId={p.id} playerIdToPlayer={playerIdToPlayer} /></TableCell>
                <TableCell>{p.rating}</TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
  )

  //   <div className={styles.leaderboard}>
  //     <table>
  //       <thead>
  //         <tr>
  //           <th>Rank</th>
  //           <th>Name</th>
  //           <th>Rating</th>
  //         </tr>
  //       </thead>
  //       <tbody>
  //         {sortedPlayers.map((p, i) => {
  //           return (
  //             <tr key={p.id}>
  //               <td>{i + 1}</td>
  //               <td><ColoredPlayerName playerId={p.id} playerIdToPlayer={playerIdToPlayer} /></td>
  //               <td>{p.rating}</td>
  //             </tr>
  //           )
  //         })}
  //       </tbody>
  //     </table>
  //   </div>
  // )
};

export default Leaderboard;
