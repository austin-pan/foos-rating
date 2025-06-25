import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";

import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TableContainer from "@mui/material/TableContainer";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";

const Delta = ({value}) => {
  const color = value > 0 ? "darkgreen" : "darkred";
  const symbol = value > 0 ? "▲" : "▼";
  return (
    <span style={{color: color}}>
      {symbol}{Math.abs(value)}
    </span>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <Paper elevation={3} sx={{ padding: 2, backgroundColor: "white", borderRadius: 2, opacity: 0.8 }}>
        <TableContainer component={Box} sx={{ width: 150 }}>
          <Table
            size="small"
            aria-label="tooltip table"
            sx={{
              '& .MuiTableRow-root': { borderBottom: 'none' }, // Remove horizontal lines
              '& .MuiTableCell-root': { borderBottom: 'none' } // Remove cell bottom borders
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ paddingBottom: 1 }}>
                  <Typography variant="h6" component="div">
                    {new Date(label).toLocaleDateString("en-US")}
                  </Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payload
                .sort((a, b) => a.value < b.value ? 1 : -1)
                .map(entry => {
                  const delta = entry.payload[`${entry.name}_delta`];
                  return (
                    <TableRow key={entry.name}>
                      <TableCell align="right" sx={{ paddingRight: 1, paddingLeft: 0 }}>
                        <Delta value={delta} />
                      </TableCell>
                      <TableCell sx={{ color: entry.color, paddingRight: 1, paddingLeft: 1 }}>
                        {entry.name}
                      </TableCell>
                      <TableCell align="right" sx={{ paddingRight: 0, paddingLeft: 1 }}>
                        {entry.value}
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    );
  }

  return null;
};

const RatingGraph = ({data, players}) => {
  const renderLineChart = (
    <ResponsiveContainer>
      <LineChart data={data}>
        {
          players.map(p => {
            return (
              <Line type="linear" dataKey={p.name} stroke={p.color} connectNulls />
            )
          })
        }

        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          type="number"
          tickFormatter={time => new Date(time).toLocaleDateString("en-US")}
          domain={['dataMin - 500000000', 'dataMax + 700000000']}
          scale="linear" />
        <YAxis type="number" domain={['dataMin - 20', 'dataMax + 20']} scale="linear" />
        <Tooltip content={<CustomTooltip />} />
      </LineChart>
    </ResponsiveContainer>
  );

  return (
    <Box sx={{ width: "95%", aspectRatio: "16 / 9", position: "relative", zIndex: 1500 }}>
      {renderLineChart}
    </Box>
  );
}

export default RatingGraph;
