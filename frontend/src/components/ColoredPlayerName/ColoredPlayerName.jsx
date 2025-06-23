const ColoredPlayerName = ({player, override = null}) => {
  let color = player.color;
  if (override) {
    console.log(override);
    color = override;
  }
  return (
    <span style={{"color": color}}>
      {player.name}
    </span>
  )
}

export default ColoredPlayerName;
