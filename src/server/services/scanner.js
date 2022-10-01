/**
 * Scans currency candles for specific signatures
 */

const { getCandlesticks } = require('services/api');
const log = v.createLogContext('services/scanner');
const Zone = require('classes/Zone');
const { sortBy, concat, uniqBy } = require('lodash');

async function scanForSessions(instrument) {
  const candlesticks = await getCandlesticks(instrument);
  const getSessionFromCandles = sessionName => {
    const sessionCandlesticks = candlesticks.filter(candle => {

      return sessionName === candle.getLatestSession();

      // Session overlap
      if (candle.sessions.length > 1) {
          return candle.sessions.includes(sessionName);
      }

      return candle.sessions[0] === sessionName;
    });
    const { sessions } = sessionCandlesticks.reduce((acc, candle, index) => {

      if (!acc.session) {
        acc.session = new Zone(candle, { type: 'SESSION' });
        return acc;
      }

      const inRange = acc.session.inRange(candle);

      if (!inRange) {
        acc.sessions.push(acc.session);
        acc.session = null;
      }

      if (index === sessionCandlesticks.length - 1) {
        acc.sessions.push(acc.session);
        // acc.sessions = uniqBy(acc.sessions, 'timestamp');
      }

      return acc;
    }, { sessions: [], session: null });

    return Promise.resolve(sessions);
  };

  const sydney = await getSessionFromCandles('sydney')
  const tokyo = await getSessionFromCandles('tokyo')
  const london = await getSessionFromCandles('london')
  const us = await getSessionFromCandles('us')

  console.log(sydney.length, tokyo.length, london.length, us.length);

  const sessions = concat([], sydney, tokyo, london, us);


  return sortBy(sessions, ['timestamp']);
};

async function scanForSupportZones(instrument) {
  const candles = await getCandlesticks(instrument);

  log.debug('scanning %s for support zones', instrument);

  const { supportZones } = candles.reduce((acc, candle) => {

    if (!acc.lastCandle) {
      acc.lastCandle = candle;
      return acc;
    }

    // console.log(candle.green, acc.lastCandle.red, candle.open, acc.lastCandle.close)

    if (candle.green && acc.lastCandle.red && candle.open === acc.lastCandle.close) {
      // const priceList = Object
      //                   .keys(acc.prices)
      //                   .filter(price => candle.open <= price);
      const newZone = {
        type: 'support',
        price: candle.open,
        precisionPrice: candle.low,
        timestamp: candle.timestamp
      };

      acc.prices[candle.open] = newZone;
      acc.supportZones.push(newZone);

      // if (!priceList.length) {
      //   acc.prices[candle.open] = newZone;
      //   acc.supportZones.push(newZone);
      // }
    }
    


    acc.lastCandle = candle;
    return acc;

  }, { supportZones: [], prices: {}, currentZone: null, lastCandle: null });

  return supportZones;
}

async function scanForResistanceZones(instrument) {
  const candles = await getCandlesticks(instrument);

  log.debug('scanning %s for resistance zones', instrument);

  const { resistanceZones } = candles.reduce((acc, candle) => {

    if (!acc.lastCandle) {
      acc.lastCandle = candle;
      return acc;
    }

    if (candle.red && acc.lastCandle.green && candle.open === acc.lastCandle.close) {
      const newZone = {
        type: 'resistance',
        price: candle.open,
        precisionPrice: candle.high,
        volume: candle.volume,
        timestamp: candle.timestamp
      };

      acc.prices[candle.open] = newZone;
      acc.resistanceZones.push(newZone);
    }
    


    acc.lastCandle = candle;
    return acc;

  }, { resistanceZones: [], prices: {}, currentZone: null, lastCandle: null });

  return resistanceZones;
}

async function scanForPower(instrument) {
  const sessions = await scanForSessions(instrument);

  return sessions.reduce((acc, session) => {

    if (!acc.lastSession) {
      acc.lastSession = session;
      return acc;
    }

    const process = (current) => {
      if (session.close > session.open && session.close > acc.lastSession.high) {
        acc.sessions.push({type: `${current ? 'CURRENT_BUY' : 'BUY'}`, timestamp: session.timestamp, name: session.name});
        return acc;
      }
  
      if (session.close < session.open && session.close < acc.lastSession.low) {
        acc.sessions.push({type: `${current ? 'CURRENT_SELL' : 'SELL'}`, timestamp: session.timestamp, name: session.name});
        return acc;
      }
  
      // SESSION PROBES
      if (session.low <= acc.lastSession.low && session.close > session.open || session.low <= acc.lastSession.close && session.close > session.open || session.low <= acc.lastSession.high && session.close > session.open) {
        acc.sessions.push({type: `${current ? 'CURRENT_PROBE_BUY' : 'PROBE_BUY'}`, timestamp: session.timestamp, name: session.name});
        return acc;
      }
  
      if (session.high >= acc.lastSession.high && session.close < session.open || session.high >= acc.lastSession.close && session.close < session.open || session.high >= acc.lastSession.low && session.close < session.open) {
        acc.sessions.push({type: `${current ? 'CURRENT_PROBE_SELL' : 'PROBE_SELL'}`, timestamp: session.timestamp, name: session.name});
        return acc;
      }
    };

    // Current running session / Pending
    if (!session.close) {
      session.close = session.lastCandle.close;
      // acc.sessions.push({ type: session.close > session.open ? 'CURRENT_BUY' : 'CURRENT_SELL', name: session.name });
      process(true);

      return acc;
    }

    process();


    acc.sessions.push({type: 'RANGE', timestamp: session.timestamp, name: session.name});
    return acc;
  }, { lastSession: null, sessions: [] }).sessions;
}

module.exports = {
  scanForSessions,
  scanForSupportZones,
  scanForResistanceZones,
  scanForPower
};