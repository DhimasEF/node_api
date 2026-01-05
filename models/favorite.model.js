// const db = require("../config/db");

// module.exports = {

//   isFavorited: async (id_user, id_artwork) => {
//     const [rows] = await db.query(
//       "SELECT 1 FROM favorites WHERE id_user = ? AND id_artwork = ? LIMIT 1",
//       [id_user, id_artwork]
//     );
//     return rows.length > 0;
//   },

//   add: async (id_user, id_artwork) => {
//     await db.query(
//       "INSERT IGNORE INTO favorites (id_user, id_artwork) VALUES (?, ?)",
//       [id_user, id_artwork]
//     );
//     return true;
//   },

//   remove: async (id_user, id_artwork) => {
//     await db.query(
//       "DELETE FROM favorites WHERE id_user = ? AND id_artwork = ?",
//       [id_user, id_artwork]
//     );
//     return true;
//   },

//   count: async (id_artwork) => {
//     const [[row]] = await db.query(
//       "SELECT COUNT(*) AS total FROM favorites WHERE id_artwork = ?",
//       [id_artwork]
//     );
//     return row?.total || 0;
//   }

// };
