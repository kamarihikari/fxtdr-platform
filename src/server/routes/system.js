/**
 * System Routes
 * Debugging / system routes that should not be enabled in production
 * To enable system routes, the ENABLE_SYSTEM_ROUTES env variable needs to be true 
 */

const express = require('express');
const router = express.Router();
const log = fxtdr.createLogContext('routes/system');
const chalk = require('chalk');



/**
 * Config dumper
 */
router.get('/config', (req, res) => res.json(v.config));

/**
 * Function Caller
 */

router.post('/function', async (req, res) => {
  try {
    const args = req.body.arguments;
    const fnPath = req.body.path;
    const fn = req.body.function;

    log.debug(chalk.yellow(`[ /system ] call to function ${fnPath}.${chalk.green(fn)} with arguments: ${JSON.stringify(args)}`));
    const output = await require(fnPath)[fn].apply(global, args);

    return res.status(200).send(output);
  } catch (exception) {
    log.debug('exception on [ /system ] call: %o', exception)
    return res.status(500).send(exception);
  }
});

module.exports = router;