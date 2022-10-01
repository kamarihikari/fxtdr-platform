const EventEmitter = require('events');
const moment = require('moment');
const { v4: uuid } = require('uuid');



const TYPES = [
    'CONTEXT',
    'CANDLE',
    'SUPPORT',
    'RESISTANCE',
    'DAY',
    'SESSION',
    'HIGHER_TIMEFRAME',
    'LOWER_TIMEFRAME'
];

const STATES = [
    'UNKNOWN',
    'RANGING',
    'TRENDING'
];

const PHASES = [
    'READING',
    'MONITORING',
    'EXECUTING'
];

function getCandlestickSessionName(candle) {
  const isDST = moment().isDST();
  const day = moment(candle.timestamp).startOf('day');
  const time = moment(candle.timestamp);

  const sydneyStart = moment(day).add((isDST ? 17 : 15), 'hours').subtract(1, 'minute');
  const sydneyEnd = moment(day).add(1, 'day').add((isDST ? 2 : 0), 'hours');
  const tokyoStart = moment(day).add((isDST ? 17 : 17), 'hours').subtract(1, 'minute');
  const tokyoEnd = moment(day).add(1, 'day').add((isDST ? 3 : 2), 'hours');
  const londonStart = moment(day).add(1, 'hours').add(59, 'minutes');
  const londonEnd = moment(day).add(11, 'hours')
  const usStart = moment(day).add(7, 'hours').add(59, 'minutes');
  const usEnd = moment(day).add(16, 'hours');


  if (time.isBetween(sydneyStart, sydneyEnd)) return 'sydney';
  if (time.isBetween(tokyoStart, tokyoEnd)) return 'tokyo';
  if (time.isBetween(londonStart, londonEnd)) return 'london';
  if (time.isBetween(usStart, usEnd)) return 'us';

  return 'sydney';
}

function getSessionStartTime(candle) {
  const sessionName = getCandlestickSessionName(candle);
  const time = moment(candle.timestamp).startOf('day');
  const isDST = moment().isDST();

  if (sessionName === 'sydney') return moment(time).add((isDST ? 17 : 15), 'hours');
  if (sessionName === 'tokyo') return moment(time).add((isDST ? 17 : 17), 'hours');
  if (sessionName === 'london') return moment(time).add(2, 'hours');
  if (sessionName === 'us') return moment(time).add(8, 'hours');
}

function getSessionEndTime(candle) {
  const sessionName = getCandlestickSessionName(candle);
  const time = moment(candle.timestamp).startOf('day');
  const isDST = moment().isDST();

  if (sessionName === 'sydney') return moment(time).add(1, 'day').add(isDST ? 2 : 0, 'hours');
  if (sessionName === 'tokyo') return moment(time).add(1, 'day').add(isDST ? 3 : 2, 'hours');
  if (sessionName === 'london') return moment(time).add(11, 'hours');
  if (sessionName === 'us') return moment(time).add(16, 'hours');
}

function getEndTimeForSession() {

}

class TradingZone extends EventEmitter {
    constructor (candle, opts = {}) {
        super();

        this.id = uuid();
        this.instrument = candle.instrument;
        this.type = opts.type;
        this.name = opts.name || opts.type || this.id;
        this.children = [];
        this.open = null;
        this.close = null;
        this.high = null;
        this.low = null;
        this.breached = false;
        this.depletion = 0;
        this.retracementPercentage = 0; 
        this.state = 'UNKNOWN';
        this.moneySpot = false;
        this.atr = 0;
        this.volume = 0;
        this.length = 0;
        this.timestamp = candle.timestamp;
        this.latestTimestamp = null;
        this.candle = null;
        this.lastCandle = null;
        this.startTime = null;
        this.endTime = null;

        if ( candle ) {
            this.candle = candle;
            this.timestamp = candle.timestamp;
            this.startTime = moment(this.timestamp);

            if (this.type === 'SESSION') {
              this.name = getCandlestickSessionName(candle);
              this.open = candle.open;
              this.startTime = getSessionStartTime(candle);
              this.endTime = getSessionEndTime(candle);
              this.lastCandle = v.bus.findObjectOnDate(this.instrument, moment(this.endTime).format('x'));
              this.timestamp = parseInt(getSessionStartTime(candle).format('x'));

              if (this.lastCandle) this.close = this.lastCandle.open;
            }

            if (this.type === 'SUPPORT' || this.type === 'RESISTANCE') {

            }

            this.process(candle);
        }
    }

    inRange(candle) {
      // const inrange = (candle.timestamp >= this.startTime.format('x') && candle.timestamp <= this.endTime.format('x'));
      const inrange = moment(candle.timestamp).isBetween(this.startTime, this.endTime);

      if (inrange) {
        
        if (this.low > candle.low) this.low = candle.low;
        if (this.high < candle.high) this.high = candle.high;

        this.volume += candle.volume;
        this.lastCandle = candle;
      }

      return inrange;
    }

    process(candle) {
        this.volume += candle.volume;
        
        if (!this.high) this.high = candle.high;
        if (!this.low) this.low = candle.low;

        // closed lower than this zone
        if (this.low > candle.close) {

        }

        // closed higher than this zone
        if (this.high < candle.close) {

        }
    }
}

module.exports = TradingZone;