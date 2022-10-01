const { info } = require("winston");
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const toBoolean = value => {
    if (!value) return false;
    return (value === 'true');
};

const CONFIGURATION = {
    DEVELOPER_MODE: toBoolean(process.env.DEVELOPER_MODE) || false,
    DEVELOPER_MODE_HOOK_INTERVAL_SECONDS: (1000 + process.env.DEVELOPER_MODE_HOOK_INTERVAL_SECONDS) || 15000,
    ROOT_SECRET_TOKEN: process.env.ROOT_SECRET_TOKEN || uuidv4(),
    ROOT_DIRECTORY: path.resolve(path.dirname(require.main.filename), '../../'),
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    NODE_ENV: process.env.NODE_ENV || 'local',
    PORT: process.env.PORT || 3000,
    OANDA_API_URL: process.env.OANDA_API_URL || 'https://api-fxpractice.oanda.com/v3',
    OANDA_API_TOKEN: process.env.OANDA_API_TOKEN,
    OANDA_API_TIMEZONE: process.env.OANDA_API_TIMEZONE || 'America/New_York',
    OANDA_ACCOUNT_ID: process.env.OANDA_ACCOUNT_ID,
    ENABLE_SYSTEM_COMMANDS:  toBoolean(process.env.ENABLE_SYSTEM_COMMANDS),
    LOG_FILE_NAME: process.env.LOG_FILE_NAME || 'fxtdr.log',
    WRITE_TO_LOG_FILE:  toBoolean(process.env.WRITE_TO_LOG_FILE),
    LOG_FILE_LEVEL: process.env.LOG_FILE_LEVEL || info,
    BUS_BUFFER_SIZE: process.env.BUS_BUFFER_SIZE || 1,
    

    REFRESH_CACHE_AFTER_EXPIRATION: toBoolean(process.env.REFRESH_CACHE_AFTER_EXPIRATION),
    CACHE_EXPIRE_INTERVAL_MINUTES: process.CACHE_EXPIRE_INTERVAL_MINUTES || 15,
};

if (process.env.NODE_ENV === 'production') {
    
}

module.exports = CONFIGURATION;