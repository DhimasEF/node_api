const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");
const bcrypt = require("bcryptjs");
const User = require("../models/user.model");

module.exports = {

  // ========================
  // GET /user/getData
  // ========================
  getData: async (req, res) => {
    const request_id = req.requestId;

    logger.info({
      request_id,
      action: "getData",
      status: "start"
    });

    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        logger.warn({
          request_id,
          action: "getData",
          status: "unauthorized",
          reason: "missing_token"
        });

        return res.apiResponse(
          { message: "Token tidak ditemukan" },
          401
        );
      }

      const token = authHeader.substring(7);
      const user = await User.getByToken(token);

      if (!user) {
        logger.warn({
          request_id,
          action: "getData",
          status: "unauthorized",
          reason: "invalid_token"
        });

        return res.apiResponse(
          { message: "Token tidak valid atau user tidak ditemukan" },
          401
        );
      }

      logger.info({
        request_id,
        action: "getData",
        status: "success",
        userId: user.id_user,
        role: user.role
      });

      return res.apiResponse({
        data: {
          id_user: user.id_user,
          username: user.username,
          email: user.email,
          role: user.role
        }
      }, 200);

    } catch (error) {
      logger.error({
        request_id,
        action: "getData",
        status: "error",
        error: error.message
      });

      return res.apiResponse(
        { message: "Database error" },
        500
      );
    }
  },

  // ========================
  // GET /user/list
  // ========================
  list: async (req, res) => {
    const request_id = req.requestId;

    logger.info({
      request_id,
      action: "listUser",
      status: "start"
    });

    try {
      const users = await User.getAllUsers();

      logger.info({
        request_id,
        action: "listUser",
        status: "success",
        total: users.length
      });

      return res.apiResponse(
        { data: users },
        200
      );

    } catch (error) {
      logger.error({
        request_id,
        action: "listUser",
        status: "error",
        error: error.message
      });

      return res.apiResponse(
        { message: "Database error" },
        500
      );
    }
  },

  // ========================
  // GET /user/detail/:id
  // ========================
  detail: async (req, res) => {
    const request_id = req.requestId;
    const userId = Number(req.params.id);

    logger.info({
      request_id,
      action: "detailUser",
      status: "start",
      userId
    });

    try {
      const user = await User.getUserById(userId);

      if (!user) {
        logger.warn({
          request_id,
          action: "detailUser",
          status: "not_found",
          userId
        });

        return res.apiResponse(
          { message: "User tidak ditemukan" },
          404
        );
      }

      logger.info({
        request_id,
        action: "detailUser",
        status: "success",
        userId
      });

      return res.apiResponse(
        { data: user },
        200
      );

    } catch (error) {
      logger.error({
        request_id,
        action: "detailUser",
        status: "error",
        userId,
        error: error.message
      });

      return res.apiResponse(
        { message: "Database error" },
        500
      );
    }
  },

  // ========================
  // POST /user/reset_password/:id
  // ========================
  resetPassword: async (req, res) => {
    const request_id = req.requestId;
    const userId = Number(req.params.id);

    logger.warn({
      request_id,
      action: "resetPassword",
      status: "start",
      userId
    });

    try {
      const newPassword = "user" + Math.floor(10000 + Math.random() * 90000);
      const hash = await bcrypt.hash(newPassword, 10);

      const updated = await User.resetPassword(userId, hash);

      if (!updated) {
        logger.warn({
          request_id,
          action: "resetPassword",
          status: "failed",
          userId
        });

        return res.apiResponse(
          { message: "Gagal reset password" },
          400
        );
      }

      logger.info({
        request_id,
        action: "resetPassword",
        status: "success",
        userId
      });

      return res.apiResponse(
        {
          message: "Password berhasil direset",
          new_password: newPassword
        },
        200
      );

    } catch (error) {
      logger.error({
        request_id,
        action: "resetPassword",
        status: "error",
        userId,
        error: error.message
      });

      return res.apiResponse(
        { message: "Database error" },
        500
      );
    }
  },

  // ========================
  // GET /user/uplofile/:id_user
  // ========================
  uplofile: async (req, res) => {
    const request_id = req.requestId;
    const userId = Number(req.params.id_user);

    logger.info({
      request_id,
      action: "uplofile",
      status: "start",
      userId
    });

    try {
      const user = await User.getUserById(userId);

      if (!user) {
        logger.warn({
          request_id,
          action: "uplofile",
          status: "not_found",
          userId
        });

        return res.apiResponse(
          { message: "User tidak ditemukan" },
          404
        );
      }

      const totalArtwork = await User.countArtworkByUser(userId);

      logger.info({
        request_id,
        action: "uplofile",
        status: "success",
        userId,
        totalArtwork
      });

      return res.apiResponse({
        data: {
          username: user.username,
          avatar: user.avatar,
          bio: user.bio ?? "-",
          total_post: totalArtwork
        }
      }, 200);

    } catch (error) {
      logger.error({
        request_id,
        action: "uplofile",
        status: "error",
        userId,
        error: error.message
      });

      return res.apiResponse(
        { message: "Database error" },
        500
      );
    }
  }
};
