const mysql = require("mysql2/promise");

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "root1234",
  database: "test_login",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  port: 3307,
});

console.log("MySQL Pool Ready");

db.getConnection((err, conn) => {
  if (err) {
    console.error("❌ DB ERROR:", err.message);
  } else {
    console.log("✅ MariaDB Connected!");
    conn.release();
  }
});

module.exports = db;
