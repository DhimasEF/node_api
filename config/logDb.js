const mysql = require("mysql2/promise");

const logDb = mysql.createPool({
  host: "192.168.6.15",
  user: "log",
  password: "log12345",
  database: "logs_sentral",
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  port: 3306,
});

console.log("✅ Log DB Pool Ready");

module.exports = logDb;
