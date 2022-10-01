/**
 * Global Context
 */

const boxen = require('boxen');
const moment = require('moment');
const { createLogContext } = require('./log');
const globalLog = createLogContext('*');
const figlet = require('figlet');
const chalk = require('chalk');
const message = () => new Promise(resolve => figlet('FxTDR', (err, result) => !err ? resolve(globalLog.info('\n\n%s', boxen(result, {padding: 1}))) : resolve(false)));

(async () => {
  await message();
})();

const bMarketIsOpen = () => {
  const openTime = moment().startOf('week').add(15, 'hours').add(59, 'minutes');
  const endTime = moment().startOf('week').set('day', 5).set('hour', 15).set('minute', 59);
  return moment().isBetween(openTime, endTime);
};

/**
 * 
 * seatbelt code
 */
 function execFunctionWrapper(fn) {
  return new Promise((resolve, reject) => {
    let ret;

    try { ret = fn(); }
    catch(exception) { return reject(exception); }

    return resolve(ret);
  });
}

global.seatbelt = function seatbelt(fn) {
  return new Promise((resolve, reject) => {
    if (!fn || typeof fn !== 'function') return reject(new Error('First argument must be a function'));
  
    return resolve(execFunctionWrapper(fn));
  })
  .then(data => [null, data])
  .catch(exception => [exception, null]);
}

/**
 * end seatbelt code
 */


global.devModeHook = () => {};
if (require('./config').DEVELOPER_MODE) {
  globalLog.info(chalk.bold(chalk.red('[ [**DANGER**] DEVELOPER MODE ENABLED [**DANGER**] ]')));

  global.devModeHook = async function(fn) {
    try {
      if (require('./config').DEVELOPER_MODE) {
        await fn();
      }
    }catch (ex) {
      globalLog.debug('Error message while executing dev mode hook: \n\n%o', ex);
    }
  };
}



const fxtdr = {
  ROOT_DIR: process.cwd(),
  bus: (require('./bus')),
  config: require('./config'),
  isMarketOpen: bMarketIsOpen,
  createLogContext,
  log: globalLog
};


global.fxtdr = fxtdr;
