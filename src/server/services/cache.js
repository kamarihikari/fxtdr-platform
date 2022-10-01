/**
 * Candlestick Cache
 * Stores copies of the API response to limit request hit
 */

const fs = require('fs');
const chalk = require('chalk');
const moment = require('moment');
const { createLogContext } = require('../global/log');

const log = createLogContext('services/cache');
const { REFRESH_CACHE_AFTER_EXPIRATION, CACHE_EXPIRE_INTERVAL_MINUTES, ROOT_DIRECTORY } = v.config
const CACHE_DIRECTORY = `${ROOT_DIRECTORY}/.vale`;
const CACHE_FILE = `${CACHE_DIRECTORY}/cache.json`;
 
let cache = {};

async function readCacheFromStorage() {
  const data = fs.readFileSync(CACHE_FILE);
  cache = JSON.parse(data.toString());
  return cache;
}

async function writeCacheToStorage() {
  log.debug(`writing cache to storage`)
  return fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

function read(instrument) {
  if (!cache[instrument]) return null;
  if (!REFRESH_CACHE_AFTER_EXPIRATION) {
    log.debug(`returning cached result for ${instrument} - last updated: ${chalk.cyan(moment(cache[instrument].timestamp).toLocaleString())}`);
    return cache[instrument].candles;
  }

  // If cache is expired
  if (moment(cache[instrument].timestamp).isBefore(moment().subtract(CACHE_EXPIRE_INTERVAL_MINUTES, 'minutes'))) {
    log.debug(`cached marked as expired. returning null`)
    return null;
  }

  log.debug(`returning instrument from cache: ${instrument}`);
  return cache[instrument].candles;
}

function write(instrument, candles) {
  cache[instrument] = {
    candles,
    timestamp: (new Date()).getTime()
  };

  log.debug(`writing instrument cache to storage: ${instrument} - count: ${candles.length}`);
  return writeCacheToStorage();
}





// TODO: ADD CHECK AND CREATE CACHE DIRECTORY
(function CACHE_INIT() {
  if (fs.existsSync(CACHE_FILE)) {
    readCacheFromStorage();
  } else {
    fs.writeFileSync(CACHE_FILE, "{}", { flag: 'a' });
  }
})();

module.exports = {
  read,
  write
};