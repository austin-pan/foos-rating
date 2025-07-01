const changeTimezone = (date, ianatz) => {
  return new Date(date.toLocaleString('en-US', {
    timeZone: ianatz
  }));
}

export default {
  changeTimezone
};