const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/user.model");
const logger = require("../utils/logger");

const secret_key = "flystudio_secret_key";

// =====================
// LOGIN
// =====================
exports.login = async (req, res) => {
  const rid = req.requestId;
  const { username, password } = req.body;

  logger.info(
    `request_id=${rid} action=login status=start username=${username}`
  );

  try {
    if (!username || !password) {
      logger.warn(
        `request_id=${rid} action=login status=invalid reason=missing_field`
      );
      return res.json({
        status: false,
        message: "Username dan password harus diisi"
      });
    }

    const user = await User.getByUsername(username);
    if (!user) {
      logger.warn(
        `request_id=${rid} action=login status=not_found username=${username}`
      );
      return res.json({
        status: false,
        message: "User tidak ditemukan"
      });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      logger.warn(
        `request_id=${rid} action=login status=unauthorized reason=wrong_password username=${username}`
      );
      return res.json({
        status: false,
        message: "Password salah"
      });
    }

    const payload = {
      id_user: user.id_user,
      username: user.username,
      email: user.email,
      role: user.role
    };

    const token = jwt.sign(payload, secret_key, { expiresIn: "24h" });
    await User.updateToken(user.id_user, token);

    logger.info(
      `request_id=${rid} action=login status=success userId=${user.id_user} role=${user.role}`
    );

    return res.json({
      status: true,
      message: "Login berhasil",
      token,
      user: payload
    });

  } catch (error) {
    logger.error(
      `request_id=${rid} action=login status=error error=${error.message}`
    );
    return res.status(500).json({
      status: false,
      message: "Terjadi kesalahan server"
    });
  }
};

// =====================
// REGISTER
// =====================
exports.register = async (req, res) => {
  const rid = req.requestId;
  const { username, password, email } = req.body;

  logger.info(
    `request_id=${rid} action=register status=start username=${username}`
  );

  try {
    if (!username || !password) {
      logger.warn(
        `request_id=${rid} action=register status=invalid reason=missing_field`
      );
      return res.json({
        status: false,
        message: "Username dan password wajib diisi"
      });
    }

    const cleanUsername = username.trim();
    const cleanEmail = email ? email.trim() : "";

    const exists = await User.checkUsernameExists(cleanUsername);
    if (exists) {
      logger.warn(
        `request_id=${rid} action=register status=exists username=${cleanUsername}`
      );
      return res.json({
        status: false,
        message: "Username sudah digunakan"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.insertUser({
      username: cleanUsername,
      email: cleanEmail,
      password: hashedPassword,
      role: "user"
    });

    logger.info(
      `request_id=${rid} action=register status=success username=${cleanUsername}`
    );

    return res.json({
      status: true,
      message: "Registrasi berhasil",
      data: {
        username: cleanUsername,
        email: cleanEmail
      }
    });

  } catch (error) {
    logger.error(
      `request_id=${rid} action=register status=error error=${error.message}`
    );
    return res.status(500).json({
      status: false,
      message: "Registrasi gagal"
    });
  }
};
