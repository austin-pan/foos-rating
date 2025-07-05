const dateFormatter = new Intl.DateTimeFormat("en-US", {timeZone: "America/Los_Angeles"});

const changeTimezone = (date, ianatz) => {
  return new Date(date.toLocaleString('en-US', {
    timeZone: ianatz
  }));
}

export {
  dateFormatter,
  changeTimezone
};