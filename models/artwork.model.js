const db = require("../config/db");

// =========================================
// HELPER: GROUPING (AMAN DARI NULL)
// =========================================
function groupArtwork(rows) {
  if (!rows || rows.length === 0) return [];

  const map = {};

  rows.forEach((r) => {
    if (!map[r.id_artwork]) {
      map[r.id_artwork] = {
        id_artwork: r.id_artwork,
        id_user: r.id_user,
        username: r.username,
        avatar: r.avatar,
        title: r.title,
        description: r.description,
        price: r.price,
        status: r.status,
        created_at: r.created_at,
        images: [],
        tags: [],
        _imageSet: new Set(),
        _tagSet: new Set(),
      };
    }

    const obj = map[r.id_artwork];

    if (r.id_image && !obj._imageSet.has(r.id_image)) {
      obj.images.push({
        id_image: r.id_image,
        image_url: r.image_url,
        preview_url: r.preview_url,
      });
      obj._imageSet.add(r.id_image);
    }

    if (r.id_tag && !obj._tagSet.has(r.id_tag)) {
      obj.tags.push({
        id_tag: r.id_tag,
        tag_name: r.tag_name,
      });
      obj._tagSet.add(r.id_tag);
    }
  });

  return Object.values(map).map((item) => {
    delete item._imageSet;
    delete item._tagSet;
    return item;
  });
}

module.exports = {

  // =========================================
  // INSERTS
  // =========================================

  insertArtwork: async (data) => {
    const [result] = await db.query(
      "INSERT INTO artworks SET ?",
      data
    );
    return result.insertId;
  },

  insertImage: async (data) => {
    await db.query(
      "INSERT INTO artwork_images SET ?",
      data
    );
    return true;
  },

  insertTagMap: async (id_artwork, id_tag) => {
    await db.query(
      "INSERT INTO artwork_tag_map SET ?",
      { id_artwork, id_tag }
    );
    return true;
  },

  // =========================================
  // GET LIST ARTWORK
  // =========================================

  getAll: async () => {
    const sql = `
      SELECT 
        a.*, u.username, u.avatar,
        ai.id_image, ai.image_url, ai.preview_url,
        t.id_tag, t.tag_name
      FROM artworks a
      JOIN users u ON u.id_user = a.id_user
      LEFT JOIN artwork_images ai ON ai.id_artwork = a.id_artwork
      LEFT JOIN artwork_tag_map tm ON tm.id_artwork = a.id_artwork
      LEFT JOIN artwork_tags t ON t.id_tag = tm.id_tag
      WHERE a.status IN ('published','sold')
      ORDER BY a.created_at DESC
    `;
    const [rows] = await db.query(sql);
    return groupArtwork(rows);
  },

  getAllAdmin: async () => {
    const sql = `
      SELECT 
        a.*, u.username, u.avatar,
        ai.id_image, ai.image_url, ai.preview_url,
        t.id_tag, t.tag_name
      FROM artworks a
      JOIN users u ON u.id_user = a.id_user
      LEFT JOIN artwork_images ai ON ai.id_artwork = a.id_artwork
      LEFT JOIN artwork_tag_map tm ON tm.id_artwork = a.id_artwork
      LEFT JOIN artwork_tags t ON t.id_tag = tm.id_tag
      ORDER BY a.created_at DESC
    `;
    const [rows] = await db.query(sql);
    return groupArtwork(rows);
  },

  getDraft: async () => {
    const sql = `
      SELECT 
        a.*, u.username, u.avatar,
        ai.id_image, ai.image_url, ai.preview_url,
        t.id_tag, t.tag_name
      FROM artworks a
      JOIN users u ON u.id_user = a.id_user
      LEFT JOIN artwork_images ai ON ai.id_artwork = a.id_artwork
      LEFT JOIN artwork_tag_map tm ON tm.id_artwork = a.id_artwork
      LEFT JOIN artwork_tags t ON t.id_tag = tm.id_tag
      WHERE a.status = 'draft'
      ORDER BY a.created_at DESC
    `;
    const [rows] = await db.query(sql);
    return groupArtwork(rows);
  },

  getByUser: async (id_user) => {
    const sql = `
      SELECT 
        a.*, u.username, u.avatar,
        ai.id_image, ai.image_url, ai.preview_url,
        t.id_tag, t.tag_name
      FROM artworks a
      JOIN users u ON u.id_user = a.id_user
      LEFT JOIN artwork_images ai ON ai.id_artwork = a.id_artwork
      LEFT JOIN artwork_tag_map tm ON tm.id_artwork = a.id_artwork
      LEFT JOIN artwork_tags t ON t.id_tag = tm.id_tag
      WHERE a.id_user = ?
      ORDER BY a.created_at DESC
    `;
    const [rows] = await db.query(sql, [id_user]);
    return groupArtwork(rows);
  },

  getPending: async () => {
    const sql = `
      SELECT 
        a.*, u.username, u.avatar
      FROM artworks a
      JOIN users u ON u.id_user = a.id_user
      WHERE a.status = 'pending'
      ORDER BY a.created_at DESC
    `;
    const [rows] = await db.query(sql);
    return rows;
  },

  // =========================================
  // GET DETAIL
  // =========================================

  getDetail: async (id_artwork) => {
    const sql = `
      SELECT 
        a.*, u.username, u.avatar,
        ai.id_image, ai.image_url, ai.preview_url,
        t.id_tag, t.tag_name
      FROM artworks a
      JOIN users u ON u.id_user = a.id_user
      LEFT JOIN artwork_images ai ON ai.id_artwork = a.id_artwork
      LEFT JOIN artwork_tag_map tm ON tm.id_artwork = a.id_artwork
      LEFT JOIN artwork_tags t ON t.id_tag = tm.id_tag
      WHERE a.id_artwork = ?
    `;
    const [rows] = await db.query(sql, [id_artwork]);
    const formatted = groupArtwork(rows);
    return formatted[0] || null;
  },

  // =========================================
  // UPDATE STATUS
  // =========================================

  updateStatus: async (id_artwork, status) => {
    await db.query(
      "UPDATE artworks SET status = ? WHERE id_artwork = ?",
      [status, id_artwork]
    );
    return true;
  },
};
