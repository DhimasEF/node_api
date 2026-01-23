const Transport = require('winston-transport');
const logDb = require('../config/logDb');

class DBLoggerTransport extends Transport {
  constructor(opts = {}) {
    super(opts);
    this.onError = opts.onError; // 🔥 hook ke luar
  }

  log(info, callback) {
    (async () => {
      try {
        const sql = `
          INSERT INTO api_logs
          (
            log_time,
            request_id,
            level,
            payload,
            serverresponse,
            apiresponse,
            appname,
            endpointfull,
            host_backend,
            response_time,
            status_code
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
          new Date(),
          info.request_id || null,
          info.level || 'info',
          info.payload ? JSON.stringify(info.payload) : null,
          info.serverresponse ? JSON.stringify(info.serverresponse) : null,
          info.apiresponse ? JSON.stringify(info.apiresponse) : null,
          info.appname || null,
          info.endpointfull || null,
          info.host_backend || 'Nodejs',
          info.response_time ?? null,
          info.status_code ?? null
        ];

        await logDb.query(sql, values);

      } catch (err) {
        console.error('❌ LOG DB ERROR:', err.message);

        // 🔥 INI KUNCI UTAMA
        if (this.onError) {
          this.onError(err);
        }

      } finally {
        callback();               // wajib
        this.emit('logged', info); // lifecycle winston
      }
    })();
  }
}

module.exports = DBLoggerTransport;
