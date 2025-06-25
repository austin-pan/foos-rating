import { Fragment } from "react";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";

import styles from "./RatingGraph.module.scss";
import Paper from "@mui/material/Paper";

const Delta = ({value}) => {
  const color = value > 0 ? "darkgreen" : "darkred";
  const symbol = value > 0 ? "▲" : "▼";
  return (
    <span style={{color: color}} className={styles.delta}>
      {symbol}{Math.abs(value)}
    </span>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <Paper elevation={3} sx={{padding: 2, backgroundColor: "white", borderRadius: 2, opacity: 0.8}}>
        <div className={styles.tooltipLabel}>{new Date(label).toLocaleDateString("en-US", { timeZone: "UTC" })}</div>
        <div className={styles.tooltipEntries}>
          {payload.sort((a, b) => a.value < b.value ? 1 : -1).map(entry => {
            const delta = entry.payload[`${entry.name}_delta`]
            return (
              <Fragment key={entry.name}>
                <Delta value={delta} />
                <span style={{ color: entry.color }}>{entry.name}</span>
                <span>{entry.value}</span>
              </Fragment>
            );
          })}
        </div>
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
          tickFormatter={time => new Date(time).toLocaleDateString("en-US", { timeZone: "UTC" })}
          domain={['dataMin - 500000000', 'dataMax + 700000000']}
          scale="linear" />
        <YAxis type="number" domain={['dataMin - 20', 'dataMax + 20']} scale="linear" />
        <Tooltip content={<CustomTooltip />} />
      </LineChart>
    </ResponsiveContainer>
  );

  return <div className={styles.graph}>{renderLineChart}</div>;
}

export default RatingGraph;
