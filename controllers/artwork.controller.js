const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const db = require("../config/db");
const Artwork = require("../models/artwork.model");
const logger = require("../utils/logger");
const archiver = require("archiver");


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
    const rid = req.requestId;

    logger.info(
      `request_id=${rid} action=getArtworkAll status=start`
    );

    try {
      const data = await Artwork.getAll();

      data.forEach(item => {
        item.images = item.images || [];
        item.tags = item.tags || [];
      });

      logger.info(
        `request_id=${rid} action=getArtworkAll status=success total=${data.length}`
      );

      res.json({ status: true, data });

    } catch (e) {
      logger.error(
        `request_id=${rid} action=getArtworkAll status=error error=${e.message}`
      );
      res.status(500).json({ status: false, message: e.message });
    }
  },

  getAllAdmin: async (req, res) => {
    const rid = req.requestId;

    logger.info(
      `request_id=${rid} action=getArtworkAllAdmin status=start`
    );

    try {
      const data = await Artwork.getAllAdmin();

      data.forEach(item => {
        item.images = item.images || [];
        item.tags = item.tags || [];
      });

      logger.info(
        `request_id=${rid} action=getArtworkAllAdmin status=success total=${data.length}`
      );

      res.json({ status: true, data });

    } catch (e) {
      logger.error(
        `request_id=${rid} action=getArtworkAllAdmin status=error error=${e.message}`
      );
      res.status(500).json({ status: false, message: e.message });
    }
  },


  getDraft: async (req, res) => {
    const rid = req.requestId;

    logger.info(
      `request_id=${rid} action=getArtworkDraft status=start`
    );

    try {
      const data = await Artwork.getDraft();

      data.forEach(item => {
        item.images = item.images || [];
        item.tags = item.tags || [];
      });

      logger.info(
        `request_id=${rid} action=getArtworkDraft status=success total=${data.length}`
      );

      res.json({ status: true, data });

    } catch (e) {
      logger.error(
        `request_id=${rid} action=getArtworkDraft status=error error=${e.message}`
      );
      res.status(500).json({ status: false, message: e.message });
    }
  },

  getByUser: async (req, res) => {
    const rid = req.requestId;
    const id_user = req.params.id_user;

    logger.info(
      `request_id=${rid} action=getArtworkByUser status=start id_user=${id_user}`
    );

    try {
      const data = await Artwork.getByUser(id_user);

      data.forEach(item => {
        item.images = item.images || [];
        item.tags = item.tags || [];
      });

      logger.info(
        `request_id=${rid} action=getArtworkByUser status=success id_user=${id_user} total=${data.length}`
      );

      res.json({ status: true, data });

    } catch (e) {
      logger.error(
        `request_id=${rid} action=getArtworkByUser status=error id_user=${id_user} error=${e.message}`
      );
      res.status(500).json({ status: false, message: e.message });
    }
  },

  getPending: async (req, res) => {
    const rid = req.requestId;

    logger.info(
      `request_id=${rid} action=getArtworkPending status=start`
    );

    try {
      const data = await Artwork.getPending();

      data.forEach(item => {
        item.images = item.images || [];
        item.tags = item.tags || [];
      });

      logger.info(
        `request_id=${rid} action=getArtworkPending status=success total=${data.length}`
      );

      res.json({ status: true, data });

    } catch (e) {
      logger.error(
        `request_id=${rid} action=getArtworkPending status=error error=${e.message}`
      );
      res.status(500).json({ status: false, message: e.message });
    }
  },

  // =========================================
  // GET DETAIL
  // =========================================
  getDetail: async (req, res) => {
    const rid = req.requestId;
    const id_artwork = req.params.id;

    logger.info(
      `request_id=${rid} action=getArtworkDetail status=start id_artwork=${id_artwork}`
    );

    try {
      const data = await Artwork.getDetail(id_artwork);

      if (!data) {
        logger.warn(
          `request_id=${rid} action=getArtworkDetail status=not_found id_artwork=${id_artwork}`
        );
        return res.json({ status: false, message: "Artwork not found" });
      }

      data.images = data.images || [];
      data.tags = data.tags || [];

      logger.info(
        `request_id=${rid} action=getArtworkDetail status=success id_artwork=${id_artwork}`
      );

      res.json({ status: true, data });

    } catch (e) {
      logger.error(
        `request_id=${rid} action=getArtworkDetail status=error id_artwork=${id_artwork} error=${e.message}`
      );
      res.status(500).json({ status: false, message: e.message });
    }
  },


  // =========================================
  // UPLOAD ARTWORK
  // =========================================
  upload: async (req, res) => {
    const rid = req.requestId;
    let conn;

    try {
      const { id_user, title, description, price } = req.body;
      const tags = JSON.parse(req.body.tags || "[]");

      logger.info(
        `request_id=${rid} action=uploadArtwork status=start id_user=${id_user}`
      );

      // =========================
      // VALIDATION
      // =========================
      if (!id_user || !title || !description || !price) {
        logger.warn(
          `request_id=${rid} action=uploadArtwork status=invalid reason=missing_field`
        );
        return res.json({ status: false, message: "Missing required fields" });
      }

      if (!Array.isArray(tags)) {
        logger.warn(
          `request_id=${rid} action=uploadArtwork status=invalid reason=invalid_tags`
        );
        return res.json({ status: false, message: "Invalid tags format" });
      }

      if (!req.files || req.files.length === 0) {
        logger.warn(
          `request_id=${rid} action=uploadArtwork status=invalid reason=no_file`
        );
        return res.json({ status: false, message: "Minimal 1 gambar wajib diupload" });
      }

      // =========================
      // START TRANSACTION
      // =========================
      conn = await db.getConnection();
      await conn.beginTransaction();

      // =========================
      // INSERT ARTWORK
      // =========================
      const [artworkResult] = await conn.query(
        `INSERT INTO artworks 
          (id_user, title, description, price, status, created_at)
        VALUES (?, ?, ?, ?, ?, NOW())`,
        [id_user, title, description, price, "draft"]
      );

      const id_artwork = artworkResult.insertId;

      logger.info(
        `request_id=${rid} step=insert_artwork id_artwork=${id_artwork}`
      );

      // =========================
      // PROCESS IMAGES
      // =========================
      logger.info(
        `request_id=${rid} step=process_images count=${req.files.length}`
      );

      for (const file of req.files) {
        const previewName = file.filename.replace(/\.(.*)$/, "_preview.jpg");

        await sharp(file.path)
          .resize(350)
          .jpeg({ quality: 70 })
          .toFile(path.join(previewPath, previewName));

        await conn.query(
          `INSERT INTO artwork_images 
            (id_artwork, image_url, preview_url)
          VALUES (?, ?, ?)`,
          [id_artwork, file.filename, previewName]
        );
      }

      // =========================
      // PROCESS TAGS
      // =========================
      logger.info(
        `request_id=${rid} step=process_tags count=${tags.length}`
      );

      for (const tag of tags) {
        const cleanTag = tag.trim().toLowerCase();
        if (!cleanTag) continue;

        const [rows] = await conn.query(
          "SELECT id_tag FROM artwork_tags WHERE tag_name = ?",
          [cleanTag]
        );

        let id_tag;
        if (rows.length > 0) {
          id_tag = rows[0].id_tag;
        } else {
          const [tagResult] = await conn.query(
            "INSERT INTO artwork_tags (tag_name) VALUES (?)",
            [cleanTag]
          );
          id_tag = tagResult.insertId;
        }

        await conn.query(
          `INSERT INTO artwork_tag_map (id_artwork, id_tag)
          VALUES (?, ?)`,
          [id_artwork, id_tag]
        );
      }

      // =========================
      // COMMIT
      // =========================
      await conn.commit();

      logger.info(
        `request_id=${rid} action=uploadArtwork status=success id_artwork=${id_artwork}`
      );

      return res.json({
        status: true,
        message: "Artwork uploaded",
        id_artwork,
      });

    } catch (err) {
      if (conn) await conn.rollback();

      logger.error(
        `request_id=${rid} action=uploadArtwork status=error error=${err.message}`
      );

      return res.status(500).json({
        status: false,
        message: "Upload gagal",
      });

    } finally {
      if (conn) conn.release();
    }
  },


  // =========================================
  // UPDATE STATUS
  // =========================================
  updateStatus: async (req, res) => {
    const rid = req.requestId;
    const { id_artwork, status } = req.body;

    logger.info(
      `request_id=${rid} action=updateArtworkStatus status=start id_artwork=${id_artwork} new_status=${status}`
    );

    try {
      const allowed = ["approved", "rejected", "published", "draft"];
      if (!allowed.includes(status)) {
        logger.warn(
          `request_id=${rid} action=updateArtworkStatus status=invalid new_status=${status}`
        );
        return res.json({ status: false, message: "Invalid status" });
      }

      await Artwork.updateStatus(id_artwork, status);

      logger.info(
        `request_id=${rid} action=updateArtworkStatus status=success id_artwork=${id_artwork}`
      );

      res.json({ status: true, message: `Status updated to ${status}` });

    } catch (e) {
      logger.error(
        `request_id=${rid} action=updateArtworkStatus status=error error=${e.message}`
      );
      res.status(500).json({ status: false, message: e.message });
    }
  },
};
