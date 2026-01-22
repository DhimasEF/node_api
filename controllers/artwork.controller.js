const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const db = require("../config/db");
const Artwork = require("../models/artwork.model");
// const logger = require("../utils/logger");
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
    const request_id = req.requestId;

    // logger.info({
    //   request_id,
    //   action: "getArtworkAll",
    //   status: "start"
    // });

    try {
      const data = await Artwork.getAll();

      data.forEach(i => {
        i.images ||= [];
        i.tags ||= [];
      });

      // logger.info({
      //   request_id,
      //   action: "getArtworkAll",
      //   status: "success",
      //   total: data.length
      // });

      return res.apiResponse({ data }, 200);

    } catch (error) {
      // logger.error({
      //   request_id,
      //   action: "getArtworkAll",
      //   status: "error",
      //   error: error.message
      // });

      return res.apiResponse({ message: "Server error" }, 500);
    }
  },

  getAllAdmin: async (req, res) => {
    const request_id = req.requestId;

    // logger.info({ request_id, action: "getArtworkAllAdmin", status: "start" });

    try {
      const data = await Artwork.getAllAdmin();

      data.forEach(i => {
        i.images ||= [];
        i.tags ||= [];
      });

      // logger.info({
      //   request_id,
      //   action: "getArtworkAllAdmin",
      //   status: "success",
      //   total: data.length
      // });

      return res.apiResponse({ data }, 200);

    } catch (error) {
      // logger.error({
      //   request_id,
      //   action: "getArtworkAllAdmin",
      //   status: "error",
      //   error: error.message
      // });

      return res.apiResponse({ message: "Server error" }, 500);
    }
  },

  getDraft: async (req, res) => {
    const request_id = req.requestId;

    // logger.info({
    //   request_id,
    //   action: "getArtworkDraft",
    //   status: "start"
    // });

    try {
      const data = await Artwork.getDraft();

      data.forEach(item => {
        item.images ||= [];
        item.tags ||= [];
      });

      // logger.info({
      //   request_id,
      //   action: "getArtworkDraft",
      //   status: "success",
      //   total: data.length
      // });

      return res.apiResponse({ data }, 200);

    } catch (error) {
      // logger.error({
      //   request_id,
      //   action: "getArtworkDraft",
      //   status: "error",
      //   error: error.message
      // });

      return res.apiResponse(
        { message: "Server error" },
        500
      );
    }
  },

  getByUser: async (req, res) => {
    const request_id = req.requestId;
    const id_user = req.params.id_user;

    // logger.info({
    //   request_id,
    //   action: "getArtworkByUser",
    //   status: "start",
    //   id_user
    // });

    try {
      const data = await Artwork.getByUser(id_user);

      data.forEach(item => {
        item.images ||= [];
        item.tags ||= [];
      });

      // logger.info({
      //   request_id,
      //   action: "getArtworkByUser",
      //   status: "success",
      //   id_user,
      //   total: data.length
      // });

      return res.apiResponse({ data }, 200);

    } catch (error) {
      // logger.error({
      //   request_id,
      //   action: "getArtworkByUser",
      //   status: "error",
      //   id_user,
      //   error: error.message
      // });

      return res.apiResponse(
        { message: "Server error" },
        500
      );
    }
  },

  getPending: async (req, res) => {
    const request_id = req.requestId;

    // logger.info({
    //   request_id,
    //   action: "getArtworkPending",
    //   status: "start"
    // });

    try {
      const data = await Artwork.getPending();

      data.forEach(item => {
        item.images ||= [];
        item.tags ||= [];
      });

      // logger.info({
      //   request_id,
      //   action: "getArtworkPending",
      //   status: "success",
      //   total: data.length
      // });

      return res.apiResponse({ data }, 200);

    } catch (error) {
      // logger.error({
      //   request_id,
      //   action: "getArtworkPending",
      //   status: "error",
      //   error: error.message
      // });

      return res.apiResponse(
        { message: "Server error" },
        500
      );
    }
  },

  // =========================================
  // GET DETAIL
  // =========================================
  getDetail: async (req, res) => {
    const request_id = req.requestId;
    const id_artwork = req.params.id;

    // logger.info({
    //   request_id,
    //   action: "getArtworkDetail",
    //   status: "start",
    //   id_artwork
    // });

    try {
      const data = await Artwork.getDetail(id_artwork);

      if (!data) {
        // logger.warn({
        //   request_id,
        //   action: "getArtworkDetail",
        //   status: "not_found",
        //   id_artwork
        // });

        return res.apiResponse(
          { message: "Artwork tidak ditemukan" },
          404
        );
      }

      data.images ||= [];
      data.tags ||= [];

      // logger.info({
      //   request_id,
      //   action: "getArtworkDetail",
      //   status: "success",
      //   id_artwork
      // });

      return res.apiResponse({ data }, 200);

    } catch (error) {
      // logger.error({
      //   request_id,
      //   action: "getArtworkDetail",
      //   status: "error",
      //   error: error.message
      // });

      return res.apiResponse({ message: "Server error" }, 500);
    }
  },

  // =========================================
  // UPLOAD ARTWORK
  // =========================================
  upload: async (req, res) => {
    const request_id = req.requestId;
    let conn;

    // logger.info({
    //   request_id,
    //   action: "uploadArtwork",
    //   status: "start",
    //   payload: { id_user: req.body.id_user }
    // });

    try {
      const { id_user, title, description, price } = req.body;
      const tags = JSON.parse(req.body.tags || "[]");

      if (!id_user || !title || !description || !price) {
        return res.apiResponse(
          { message: "Field wajib belum lengkap" },
          400
        );
      }

      if (!req.files || req.files.length === 0) {
        return res.apiResponse(
          { message: "Minimal 1 gambar wajib diupload" },
          400
        );
      }

      conn = await db.getConnection();
      await conn.beginTransaction();

      const [art] = await conn.query(
        `INSERT INTO artworks 
        (id_user, title, description, price, status, created_at)
        VALUES (?, ?, ?, ?, 'draft', NOW())`,
        [id_user, title, description, price]
      );

      const id_artwork = art.insertId;

      for (const file of req.files) {
        const previewName = file.filename.replace(/\.(.*)$/, "_preview.jpg");

        await sharp(file.path)
          .resize(350)
          .jpeg({ quality: 70 })
          .toFile(path.join(previewPath, previewName));

        await conn.query(
          `INSERT INTO artwork_images (id_artwork, image_url, preview_url)
          VALUES (?, ?, ?)`,
          [id_artwork, file.filename, previewName]
        );
      }

      for (const tag of tags) {
        const clean = tag.trim().toLowerCase();
        if (!clean) continue;

        const [[existing]] = await conn.query(
          "SELECT id_tag FROM artwork_tags WHERE tag_name = ?",
          [clean]
        );

        const id_tag = existing
          ? existing.id_tag
          : (await conn.query(
              "INSERT INTO artwork_tags (tag_name) VALUES (?)",
              [clean]
            ))[0].insertId;

        await conn.query(
          `INSERT INTO artwork_tag_map (id_artwork, id_tag)
          VALUES (?, ?)`,
          [id_artwork, id_tag]
        );
      }

      await conn.commit();

      // logger.info({
      //   request_id,
      //   action: "uploadArtwork",
      //   status: "success",
      //   id_artwork
      // });

      return res.apiResponse(
        { message: "Artwork berhasil diupload", id_artwork },
        201
      );

    } catch (error) {
      if (conn) await conn.rollback();

      // logger.error({
      //   request_id,
      //   action: "uploadArtwork",
      //   status: "error",
      //   error: error.message
      // });

      return res.apiResponse({ message: "Upload gagal" }, 500);

    } finally {
      if (conn) conn.release();
    }
  },

  // =========================================
  // UPDATE STATUS
  // =========================================
  updateStatus: async (req, res) => {
    const request_id = req.requestId;
    const { id_artwork, status } = req.body;

    // logger.info({
    //   request_id,
    //   action: "updateArtworkStatus",
    //   status: "start",
    //   id_artwork,
    //   new_status: status
    // });

    try {
      const allowed = ["approved", "rejected", "published", "draft"];
      if (!allowed.includes(status)) {
        return res.apiResponse(
          { message: "Status tidak valid" },
          400
        );
      }

      await Artwork.updateStatus(id_artwork, status);

      // logger.info({
      //   request_id,
      //   action: "updateArtworkStatus",
      //   status: "success",
      //   id_artwork
      // });

      return res.apiResponse(
        { message: `Status artwork diubah ke ${status}` },
        200
      );

    } catch (error) {
      // logger.error({
      //   request_id,
      //   action: "updateArtworkStatus",
      //   status: "error",
      //   error: error.message
      // });

      return res.apiResponse({ message: "Server error" }, 500);
    }
  }
};
