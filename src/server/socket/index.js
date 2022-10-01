/**
 * Websocket connection handler
 */

const ws = require('ws');
const log = v.createLogContext('server/socket');
const { ENABLE_SYSTEM_COMMANDS } = v.config;
let wss;

async function execute(path, args) {
  return new Promise(async (resolve, reject) => {
    try {
      const [filepath, fn] = path.split('.');
      
      log.debug('executing system command: %s - arguments: %o', path, args);
      const output = await (require(filepath))[fn].apply({}, [...args]);

      return resolve(output);
    } catch (exception) {
      log.debug('exception while executing system command: $o', exception);
      reject(exception)
    }
  });
}

async function parseCommand(ws, message) {
  try {
    const { subscribe, exec, args } = JSON.parse(message);

    // Enter function execution mode
    if (exec) {
      if (!ENABLE_SYSTEM_COMMANDS) return ws.send('Error: ENABLE_SYSTEM_COMMANDS is not enabled');

      const output = await execute(exec, args);
      return ws.send({message: 'command executed successfully', output: `${JSON.stringify(output)}`});
    }

  } catch (exception) {
    return ws.send(`${exception}`);
  }
}

function WEB_SOCKET_HANDLER (server) {
  wss = new ws.Server({ server });

  log.debug(require('chalk').blue('websocket server handler created'));

  wss.on('connection', (ws, req) => {

    log.debug('websocket connection established: %o', req.headers);
    //connection is up, let's add a simple simple event
    ws.on('message', (message) => parseCommand(ws, message));

    //send immediatly a feedback to the incoming connection    
    ws.send(JSON.stringify({

    }));
  });

}

module.exports = WEB_SOCKET_HANDLER;