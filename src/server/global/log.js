const moment = require('moment');
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf, splat, simple, json } = format;
const { LOG_LEVEL, WRITE_TO_LOG_FILE, LOG_FILE_NAME, LOG_FILE_LEVEL } = require('./config');

const myFormat = printf(({ level, message, label, timestamp }) => {
  return `[${moment(timestamp).toLocaleString()}][${label}] ${level}: ${message}`;
});

const defaultTransports = [
  new transports.Console(),
];
let transportsForLogWriting = [];

if (WRITE_TO_LOG_FILE) {
  transportsForLogWriting = [
    new transports.Console(),
    new transports.File({ filename: 'error.log', level: 'error' }),
    new transports.File({ filename: LOG_FILE_NAME, level: LOG_FILE_LEVEL }),
  ];
}

function createLogContext(context = '*') {
  return createLogger({
    level: LOG_LEVEL,
    format: combine(
      label({ label: context }),
      timestamp(),
      splat(),
      simple(),
      myFormat
    ),
    transports: WRITE_TO_LOG_FILE ? transportsForLogWriting : defaultTransports
  });
}

module.exports = {
  createLogContext
};