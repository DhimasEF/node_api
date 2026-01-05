const db = require("../config/db");

module.exports = {

  // =========================
  // INSERT COMMENT
  // =========================
  insert: async (data) => {
    const [result] = await db.query(
      "INSERT INTO comments SET ?",
      data
    );
    return result.insertId;
  },

  // =========================
  // GET COMMENT BY ARTWORK
  // =========================
  getByArtwork: async (id_artwork) => {
    const [rows] = await db.query(
      `
      SELECT 
        c.id_comment,
        c.comment_text,
        c.created_at,
        u.id_user,
        u.username,
        u.avatar
      FROM comments c
      JOIN users u ON u.id_user = c.id_user
      WHERE c.id_artwork = ?
      ORDER BY c.created_at ASC
      `,
      [id_artwork]
    );
    return rows;
  },

  // =========================
  // DELETE COMMENT
  // =========================
  remove: async (id_comment, id_user) => {
    const [result] = await db.query(
      "DELETE FROM comments WHERE id_comment = ? AND id_user = ?",
      [id_comment, id_user]
    );
    return result.affectedRows > 0;
  }

};
