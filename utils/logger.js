const winston = require('winston');
const DBLoggerTransport = require('./dbLoggerTransport');

let logDisabled = false;
let failCount = 0;
const FAIL_LIMIT = 3;

// 🔥 transport dengan hook
const dbTransport = new DBLoggerTransport({
  onError: () => {
    failCount++;

    if (failCount >= FAIL_LIMIT && !logDisabled) {
      logDisabled = true;
      console.warn('🚨 Logging DISABLED (Log DB Down)');
    }
  }
});

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    dbTransport
  ]
});

// 🔥 SATU-SATUNYA API logging yang dipakai app
function safeLog(data) {
  if (logDisabled) return;
  logger.log(data);
}

module.exports = {
  logger,
  safeLog
};
