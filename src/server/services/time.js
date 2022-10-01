/**
 * Time service
 * because yeah... time is that difficult to manage
 */

const m = require('moment-timezone');
const isDST = m().isDST();
const { uniq, times } = require('lodash');

function getCandleSessions(candle) {
  const time = m(candle.timestamp);
  const day = m(time).startOf('day');
  const midnight = m(day).set('hour', 23).set('minute', 59);
  const nextDay = m(day).add(1, 'day').startOf('day');

  const SYDNEY_SESSION_START_TIME = isDST ? m(day).set('hour', 17) : m(day).set('hour', 15);
  const SYDNEY_SESSION_END_TIME = isDST ? m(day).add(1, 'day').set('hour', 2) : m(day);
  const TOKYO_SESSION_START_TIME = isDST ? m(day).set('hour', 18) : m(day).set('hour', 17);
  const TOKYO_SESSION_END_TIME = isDST ? m(day).add(1, 'day').set('hour', 3) : m(day).add(1, 'day').set('hour', 2);
  const LONDON_SESSION_START_TIME = m(day).set('hour', 2);
  const LONDON_SESSION_END_TIME = m(day).set('hour', 11);
  const US_SESSION_START_TIME = m(day).set('hour', 8);
  const US_SESSION_END_TIME = m(day).set('hour', 17);

  const sessions = [];


  if (time.isBetween(SYDNEY_SESSION_START_TIME.subtract(1, 'minute'), SYDNEY_SESSION_END_TIME)) {
    sessions.push('sydney');
  }

  if (time.isBetween(TOKYO_SESSION_START_TIME.subtract(1, 'minute'), m(nextDay)) || time.isBetween(m(nextDay), TOKYO_SESSION_END_TIME)) {
    sessions.push('tokyo');
  }

  if (time.isBetween(LONDON_SESSION_START_TIME.subtract(1, 'minute'), LONDON_SESSION_END_TIME)) {
    sessions.push('london');
  }

  if (time.isBetween(US_SESSION_START_TIME.subtract(1, 'minute'), US_SESSION_END_TIME)) {
    sessions.push('us');
  }

  if (!sessions.length && time.isSameOrAfter(day) && time.isBefore(LONDON_SESSION_START_TIME)) {
    sessions.push('tokyo');
  }

  console.log(time.toLocaleString(), sessions)


  return sessions;
}

function getCandleLatestSession(candle) {
  const sessions = getCandleSessions(candle);
  return sessions.reverse()[0];
}


module.exports = {
  getCandleSessions,
  getCandleLatestSession,
};