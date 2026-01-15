const Transport = require('winston-transport');
const db = require('../config/db');

class DBLoggerTransport extends Transport {
  log(info, callback) {
    setImmediate(() => this.emit('logged', info));

    const sql = `
      INSERT INTO api_logs
      (timestamp, request_id, level, payload, serverresponse, apiresponse, appname, endpointfull)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      new Date(),
      info.request_id || null,
      info.level || 'info',
      info.payload ? JSON.stringify(info.payload) : null,
      info.serverresponse ? JSON.stringify(info.serverresponse) : null,
      info.apiresponse ? JSON.stringify(info.apiresponse) : null,
      info.appname || null,
      info.endpointfull || null
    ];

    db.query(sql, values, (err) => {
      if (err) console.error('DB LOG ERROR:', err);
    });

    callback();
  }
}

module.exports = DBLoggerTransport;
