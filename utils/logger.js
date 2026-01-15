const winston = require('winston');
const DBLoggerTransport = require('./dbLoggerTransport');

const logger = winston.createLogger({
  level: 'info',

  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json() // 🔥 INI KUNCI
  ),

  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.json()
      )
    }),
    new DBLoggerTransport()
  ]
});

module.exports = logger;
