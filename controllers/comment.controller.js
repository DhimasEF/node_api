const Comment = require("../models/comment.model");
const logger = require("../utils/logger");

module.exports = {

  // =========================================
  // ADD COMMENT
  // =========================================
  addComment: async (req, res) => {
    const request_id = req.requestId;
    const id_user = req.user?.id_user;
    const { id_artwork, comment_text } = req.body;

    logger.info({
      request_id,
      action: "addComment",
      status: "start",
      id_user,
      id_artwork
    });

    if (!id_user || !id_artwork || !comment_text) {
      logger.warn({
        request_id,
        action: "addComment",
        status: "invalid",
        reason: "missing_data"
      });

      return res.apiResponse(
        { message: "Data tidak lengkap" },
        400
      );
    }

    try {
      const id_comment = await Comment.insert({
        id_user,
        id_artwork,
        comment_text
      });

      logger.info({
        request_id,
        action: "addComment",
        status: "success",
        id_comment,
        id_user,
        id_artwork
      });

      return res.apiResponse(
        {
          message: "Komentar berhasil ditambahkan",
          id_comment
        },
        201
      );

    } catch (error) {
      logger.error({
        request_id,
        action: "addComment",
        status: "error",
        error: error.message
      });

      return res.apiResponse(
        { message: "Database error" },
        500
      );
    }
  },

  // =========================================
  // GET COMMENTS BY ARTWORK
  // =========================================
  getByArtwork: async (req, res) => {
    const request_id = req.requestId;
    const id_artwork = Number(req.params.id);

    logger.info({
      request_id,
      action: "getComments",
      status: "start",
      id_artwork
    });

    if (!id_artwork) {
      logger.warn({
        request_id,
        action: "getComments",
        status: "invalid"
      });

      return res.apiResponse(
        { message: "ID artwork tidak valid" },
        400
      );
    }

    try {
      const comments = await Comment.getByArtwork(id_artwork);

      logger.info({
        request_id,
        action: "getComments",
        status: "success",
        total: comments.length
      });

      return res.apiResponse(
        { comments },
        200
      );

    } catch (error) {
      logger.error({
        request_id,
        action: "getComments",
        status: "error",
        error: error.message
      });

      return res.apiResponse(
        { message: "Database error" },
        500
      );
    }
  },

  // =========================================
  // DELETE COMMENT
  // =========================================
  deleteComment: async (req, res) => {
    const request_id = req.requestId;
    const id_user = req.user?.id_user;
    const id_comment = Number(req.params.id);

    logger.info({
      request_id,
      action: "deleteComment",
      status: "start",
      id_user,
      id_comment
    });

    if (!id_user || !id_comment) {
      logger.warn({
        request_id,
        action: "deleteComment",
        status: "invalid"
      });

      return res.apiResponse(
        { message: "Parameter tidak valid" },
        400
      );
    }

    try {
      const deleted = await Comment.remove(id_comment, id_user);

      if (!deleted) {
        logger.warn({
          request_id,
          action: "deleteComment",
          status: "not_found",
          id_comment
        });

        return res.apiResponse(
          { message: "Komentar tidak ditemukan" },
          404
        );
      }

      logger.info({
        request_id,
        action: "deleteComment",
        status: "success",
        id_comment
      });

      return res.apiResponse(
        { message: "Komentar berhasil dihapus" },
        200
      );

    } catch (error) {
      logger.error({
        request_id,
        action: "deleteComment",
        status: "error",
        error: error.message
      });

      return res.apiResponse(
        { message: "Database error" },
        500
      );
    }
  }

};
