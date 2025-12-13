const mysql = require("mysql2/promise");

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "test_login",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

console.log("MySQL Pool Ready");

module.exports = db;
