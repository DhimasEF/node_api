const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const db = require("../config/db");
const Artwork = require("../models/artwork.model");

// Folder Upload
const originalPath = path.join(__dirname, "..", "uploads", "artworks", "original");
const previewPath = path.join(__dirname, "..", "uploads", "artworks", "preview");

// Buat folder jika belum ada
if (!fs.existsSync(originalPath)) fs.mkdirSync(originalPath, { recursive: true });
if (!fs.existsSync(previewPath)) fs.mkdirSync(previewPath, { recursive: true });

module.exports = {

  // =========================================
  // GET LIST
  // =========================================

  getAll: async (req, res) => {
    try {
      const data = await Artwork.getAll();

      // pastikan tidak null
      data.forEach(item => {
        item.images = item.images || [];
        item.tags = item.tags || [];
      });

      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  },

  getAllAdmin: async (req, res) => {
    try {
      const data = await Artwork.getAllAdmin();

      data.forEach(item => {
        item.images = item.images || [];
        item.tags = item.tags || [];
      });

      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  },

  getDraft: async (req, res) => {
    try {
      const data = await Artwork.getDraft();

      data.forEach(item => {
        item.images = item.images || [];
        item.tags = item.tags || [];
      });

      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  },

  getByUser: async (req, res) => {
    try {
      const data = await Artwork.getByUser(req.params.id_user);

      data.forEach(item => {
        item.images = item.images || [];
        item.tags = item.tags || [];
      });

      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  },

  getPending: async (req, res) => {
    try {
      const data = await Artwork.getPending();

      data.forEach(item => {
        item.images = item.images || [];
        item.tags = item.tags || [];
      });

      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  },

  // =========================================
  // GET DETAIL
  // =========================================

  getDetail: async (req, res) => {
    try {
      const data = await Artwork.getDetail(req.params.id);

      if (!data) {
        return res.json({ success: false, message: "Artwork not found" });
      }

      // FIX: pastikan array tidak null
      data.images = data.images || [];
      data.tags = data.tags || [];

      res.json({ success: true, data });

    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  },

  // =========================================
  // UPLOAD ARTWORK
  // =========================================

  upload: async (req, res) => {
    try {
      const { id_user, title, description, price } = req.body;
      const tags = JSON.parse(req.body.tags || "[]");

      if (!id_user || !title || !description || !price) {
        return res.json({ success: false, message: "Missing required fields" });
      }

      const id_artwork = await Artwork.insertArtwork({
        id_user,
        title,
        description,
        price,
        status: "pending",
        created_at: new Date(),
      });

      // =========================================
      // PROCESS IMAGES
      // =========================================
      for (const file of req.files) {
        const previewName = file.filename.replace(/\.(.*)$/, "_preview.jpg");

        await sharp(file.path)
          .resize(350)
          .jpeg({ quality: 70 })
          .toFile(path.join(previewPath, previewName));

        await Artwork.insertImage({
          id_artwork,
          image_url: file.filename,
          preview_url: previewName,
        });
      }

      // =========================================
      // PROCESS TAGS
      // =========================================
      for (const tag of tags) {
        await new Promise((resolve, reject) => {
          db.query(
            "SELECT id_tag FROM artwork_tags WHERE tag_name = ?",
            [tag],
            (err, rows) => {
              if (err) return reject(err);

              if (rows.length > 0) {
                Artwork.insertTagMap(id_artwork, rows[0].id_tag).then(resolve);
              } else {
                db.query(
                  "INSERT INTO artwork_tags SET ?",
                  { tag_name: tag },
                  (err2, ok) => {
                    if (err2) return reject(err2);
                    Artwork.insertTagMap(id_artwork, ok.insertId).then(resolve);
                  }
                );
              }
            }
          );
        });
      }

      res.json({ success: true, message: "Artwork uploaded", id_artwork });

    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  },

  // =========================================
  // UPDATE STATUS
  // =========================================

  updateStatus: async (req, res) => {
    try {
      const { id_artwork, status } = req.body;

      const allowed = ["approved", "rejected", "published", "draft"];
      if (!allowed.includes(status))
        return res.json({ success: false, message: "Invalid status" });

      await Artwork.updateStatus(id_artwork, status);

      res.json({ success: true, message: `Status updated to ${status}` });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  },
};
