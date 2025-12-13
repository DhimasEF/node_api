const db = require("../config/db");

const User = {

  // =====================
  // GET USER BY USERNAME
  // =====================
  async getByUsername(username) {
    const [rows] = await db.query(
      "SELECT * FROM users WHERE username = ? LIMIT 1",
      [username]
    );
    return rows[0] || null;
  },

  // =====================
  // GET USER BY TOKEN
  // =====================
  async getByToken(token) {
    const [rows] = await db.query(
      "SELECT * FROM users WHERE token_login = ? LIMIT 1",
      [token]
    );
    return rows[0] || null;
  },

  // =====================
  // GET USER BY ID
  // =====================
  async getUserById(id_user) {
    const [rows] = await db.query(
      "SELECT * FROM users WHERE id_user = ? LIMIT 1",
      [id_user]
    );
    return rows[0] || null;
  },

  // =====================
  // UPDATE USER
  // =====================
  async updateUser(id_user, data) {
    const fields = Object.keys(data).map(k => `${k} = ?`).join(", ");
    const values = [...Object.values(data), id_user];

    const [result] = await db.query(
      `UPDATE users SET ${fields} WHERE id_user = ?`,
      values
    );

    return result.affectedRows > 0;
  },

  // =====================
  // GET ALL USERS
  // =====================
  async getAllUsers() {
    const [rows] = await db.query(`
      SELECT id_user, username, email, name, role, avatar, created_at
      FROM users
      ORDER BY id_user DESC
    `);
    return rows;
  },

  // =====================
  // RESET PASSWORD
  // =====================
  async resetPassword(id_user, new_hash) {
    const [result] = await db.query(
      "UPDATE users SET password = ? WHERE id_user = ?",
      [new_hash, id_user]
    );
    return result.affectedRows > 0;
  },

  // =====================
  // UPDATE TOKEN LOGIN
  // =====================
  async updateToken(id_user, token) {
    await db.query(
      "UPDATE users SET token_login = ? WHERE id_user = ?",
      [token, id_user]
    );
    return true;
  },

  // =====================
  // CEK USERNAME
  // =====================
  async checkUsernameExists(username) {
    const [rows] = await db.query(
      "SELECT id_user FROM users WHERE username = ? LIMIT 1",
      [username]
    );
    return rows.length > 0;
  },

  // =====================
  // INSERT USER BARU
  // =====================
  async insertUser(data) {
    const [result] = await db.query(
      `
      INSERT INTO users (username, email, password, role, created_at)
      VALUES (?, ?, ?, ?, NOW())
      `,
      [data.username, data.email, data.password, data.role]
    );
    return result.insertId;
  },

  // =====================
  // HITUNG ARTWORK
  // =====================
  async countArtworkByUser(id_user) {
    const [rows] = await db.query(
      "SELECT COUNT(*) AS total FROM artworks WHERE id_user = ?",
      [id_user]
    );
    return rows[0].total;
  }

};

module.exports = User;
