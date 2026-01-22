const mysql = require("mysql2/promise");

const logDb = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "root1234",
  database: "logs_sentral",
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  port: 3307,
});

console.log("✅ Log DB Pool Ready");

module.exports = logDb;
