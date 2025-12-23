const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");
const bcrypt = require("bcryptjs");
const User = require("../models/user.model");

module.exports = {

  // ========================
  // GET /user/getData
  // ========================
  getData: async (req, res) => {
    const rid = req.requestId;

    logger.info(
      `request_id=${rid} action=getData status=start`
    );

    try {
      const authHeader = req.headers["authorization"];

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        logger.warn(
          `request_id=${rid} action=getData status=unauthorized reason=missing_token`
        );
        return res.status(401).json({
          status: false,
          message: "Token tidak ditemukan",
          data: []
        });
      }

      const token = authHeader.substring(7);

      const user = await User.getByToken(token);

      if (!user) {
        logger.warn(
          `request_id=${rid} action=getData status=unauthorized reason=invalid_token`
        );
        return res.status(401).json({
          status: false,
          message: "Token tidak valid atau user tidak ditemukan",
          data: []
        });
      }

      logger.info(
        `request_id=${rid} action=getData status=success userId=${user.id_user} username=${user.username} role=${user.role}`
      );

      res.json({
        status: true,
        message: "Data ditemukan",
        data: {
          id_user: user.id_user,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });

    } catch (err) {
      logger.error(
        `request_id=${rid} action=getData status=error error=${err.message}`
      );

      res.status(500).json({
        status: false,
        message: "Database error",
        data: []
      });
    }
  },

  // ========================
  // GET /user/list
  // ========================
  list: async (req, res) => {
    const rid = req.requestId;

    logger.info(
      `request_id=${rid} action=listUser status=start`
    );

    try {
      const users = await User.getAllUsers();

      logger.info(
        `request_id=${rid} action=listUser status=success total=${users.length}`
      );

      res.json({
        status: true,
        message: "List user berhasil diambil",
        data: users
      });

    } catch (err) {
      logger.error(
        `request_id=${rid} action=listUser status=error error=${err.message}`
      );

      res.status(500).json({
        status: false,
        message: "Database error"
      });
    }
  },

  // ========================
  // GET /user/detail/:id
  // ========================
  detail: async (req, res) => {
    const rid = req.requestId;
    const id = req.params.id;

    logger.info(
      `request_id=${rid} action=detailUser status=start userId=${id}`
    );

    try {
      const user = await User.getUserById(id);

      if (!user) {
        logger.warn(
          `request_id=${rid} action=detailUser status=not_found userId=${id}`
        );
        return res.status(404).json({
          status: false,
          message: "User tidak ditemukan"
        });
      }

      logger.info(
        `request_id=${rid} action=detailUser status=success userId=${user.id_user} username=${user.username}`
      );

      res.json({
        status: true,
        data: user
      });

    } catch (err) {
      logger.error(
        `request_id=${rid} action=detailUser status=error userId=${id} error=${err.message}`
      );

      res.status(500).json({
        status: false,
        message: "Database error"
      });
    }
  },

  // ========================
  // POST /user/reset_password/:id
  // ========================
  resetPassword: async (req, res) => {
    const rid = req.requestId;
    const id = req.params.id;

    logger.warn(
      `request_id=${rid} action=resetPassword status=start userId=${id}`
    );

    try {
      const newPassword = "user" + Math.floor(10000 + Math.random() * 90000);
      const hash = await bcrypt.hash(newPassword, 10);

      const updated = await User.resetPassword(id, hash);

      if (!updated) {
        logger.warn(
          `request_id=${rid} action=resetPassword status=failed userId=${id}`
        );
        return res.status(400).json({
          status: false,
          message: "Gagal reset password"
        });
      }

      logger.info(
        `request_id=${rid} action=resetPassword status=success userId=${id}`
      );

      res.json({
        status: true,
        message: "Password berhasil direset",
        new_password: newPassword
      });

    } catch (err) {
      logger.error(
        `request_id=${rid} action=resetPassword status=error userId=${id} error=${err.message}`
      );

      res.status(500).json({
        status: false,
        message: "Database error"
      });
    }
  },

  // ========================
  // GET /user/uplofile/:id_user
  // ========================
  uplofile: async (req, res) => {
    const rid = req.requestId;
    const id_user = req.params.id_user;

    logger.info(
      `request_id=${rid} action=uplofile status=start userId=${id_user}`
    );

    try {
      const user = await User.getUserById(id_user);

      if (!user) {
        logger.warn(
          `request_id=${rid} action=uplofile status=not_found userId=${id_user}`
        );
        return res.status(404).json({
          success: false,
          message: "User tidak ditemukan"
        });
      }

      const totalArtwork = await User.countArtworkByUser(id_user);

      logger.info(
        `request_id=${rid} action=uplofile status=success userId=${id_user} totalArtwork=${totalArtwork}`
      );

      res.json({
        success: true,
        data: {
          username: user.username,
          avatar: user.avatar,
          bio: user.bio ?? "-",
          total_post: totalArtwork
        }
      });

    } catch (err) {
      logger.error(
        `request_id=${rid} action=uplofile status=error userId=${id_user} error=${err.message}`
      );

      res.status(500).json({
        success: false,
        message: "Database error"
      });
    }
  }

};
