require('module-alias/register');
require('dotenv').config();
require('./global');


const { PORT, ENABLE_SYSTEM_COMMANDS } = fxtdr.config
const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const log = fxtdr.createLogContext('server');

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/api', require('./routes'));

if (ENABLE_SYSTEM_COMMANDS) {
  log.debug(require('chalk').yellow('[ /system ] routes enabled'));
  app.use('/system', require('./routes/system'));
}

const server = http.createServer(app);
(require('./socket'))(server);

server.listen(PORT, () => {
  log.info(`Listening: http://0.0.0.0:${PORT}/`);
});