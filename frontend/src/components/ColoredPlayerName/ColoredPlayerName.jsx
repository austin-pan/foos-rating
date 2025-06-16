const ColoredPlayerName = ({playerId, playerIdToPlayer}) => {
  return (
    <span style={{"color": playerIdToPlayer[playerId].color}}>
      {playerIdToPlayer[playerId].name}
    </span>
  )
}

export default ColoredPlayerName;
