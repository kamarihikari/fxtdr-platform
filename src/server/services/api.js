/**
 * API Service
 * Communicates with external APIs
 */

const Candle = require('classes/Candle');
const axios = require('axios');
const moment = require('moment');
const { to } = require('await-to-js');
const { OANDA_API_URL, OANDA_API_TOKEN, OANDA_ACCOUNT_ID } = v.config;
const { read, write } = require('services/cache');

const log = v.createLogContext('services/api');

const getCandleStartTime = () => {
  const dayOfWeek = moment().day();
  const isDST = moment().isDST();
  //TODO: Should be '16' hours. Need to add +2 hours due to timing from API / need to fix with a moment ext.
  return dayOfWeek < 3 ? moment().startOf('day').subtract(5, 'days').add(isDST ? 18 : 20, 'hours').format() : moment().startOf('day').subtract(3, 'days').add(isDST ? 18 : 20, 'hours').format();
};


async function getCandlesticks(instrument, opts = {}) {
  return new Promise(async (resolve, reject) => {
    const defaultOptions = {
      instrument,
      granularity: 'M15',
      price: 'M',
      smooth: true,
      from: getCandleStartTime(), // Three business days worth of data
      to: moment().subtract(1, 'minute')
    };
    const requestOptions = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OANDA_API_TOKEN}`
      }
    };
    const options = Object.assign({}, defaultOptions, opts);
  
    const cache = read(instrument);
    const cachedCandles = cache ? cache.map(c => (new Candle(instrument, c))) : false;
    if (cachedCandles) return resolve(cachedCandles);

    const url = `${OANDA_API_URL}/instruments/${instrument}/candles?price=${options.price}&smooth=${options.smooth}&granularity=${options.granularity}&from=${options.from}`;
    const [err, res] = await to(axios.get(`${url}`, requestOptions));

    if (err) {
      log.error('failed to get candlestick data from external API:\n%o', err);
      return reject(err);
    }

    const candles = res.data.candles.map(candle => new Candle(instrument, candle));

    write(instrument, candles);
    
    return resolve(candles);
  });
}


module.exports = {
  getCandlesticks
};


