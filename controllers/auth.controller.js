const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/user.model");
const logger = require("../utils/logger");

const secret_key = "flystudio_secret_key";

// =====================
// LOGIN
// =====================
exports.login = async (req, res) => {
  const request_id = req.requestId;
  const { username, password } = req.body;

  logger.info({
    request_id,
    action: "login",
    status: "start",
    payload: { username }
  });

  try {
    if (!username || !password) {
      logger.warn({
        request_id,
        action: "login",
        status: "invalid",
        reason: "missing_field"
      });

      return res.apiResponse(
        { message: "Username dan password harus diisi" },
        400
      );
    }

    const user = await User.getByUsername(username);
    if (!user) {
      logger.warn({
        request_id,
        action: "login",
        status: "not_found",
        username
      });

      return res.apiResponse(
        { message: "User tidak ditemukan" },
        404
      );
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      logger.warn({
        request_id,
        action: "login",
        status: "unauthorized",
        reason: "wrong_password",
        user_id: user.id_user
      });

      return res.apiResponse(
        { message: "Password salah" },
        401
      );
    }

    const payload = {
      id_user: user.id_user,
      username: user.username,
      email: user.email,
      role: user.role
    };

    const token = jwt.sign(payload, secret_key, { expiresIn: "24h" });
    await User.updateToken(user.id_user, token);

    logger.info({
      request_id,
      action: "login",
      status: "success",
      user_id: user.id_user,
      role: user.role
    });

    return res.apiResponse(
      {
        message: "Login berhasil",
        token,
        user: payload
      },
      200
    );

  } catch (error) {
    logger.error({
      request_id,
      action: "login",
      status: "error",
      error: error.message
    });

    return res.apiResponse(
      { message: "Terjadi kesalahan server" },
      500
    );
  }
};

// =====================
// REGISTER
// =====================
exports.register = async (req, res) => {
  const request_id = req.requestId;
  const { username, password, email } = req.body;

  logger.info({
    request_id,
    action: "register",
    status: "start",
    payload: { username, email }
  });

  try {
    if (!username || !password) {
      logger.warn({
        request_id,
        action: "register",
        status: "invalid",
        reason: "missing_field"
      });

      return res.apiResponse(
        { message: "Username dan password wajib diisi" },
        400
      );
    }

    const cleanUsername = username.trim();
    const cleanEmail = email ? email.trim() : null;

    const exists = await User.checkUsernameExists(cleanUsername);
    if (exists) {
      logger.warn({
        request_id,
        action: "register",
        status: "exists",
        username: cleanUsername
      });

      return res.apiResponse(
        { message: "Username sudah digunakan" },
        409
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.insertUser({
      username: cleanUsername,
      email: cleanEmail,
      password: hashedPassword,
      role: "user"
    });

    logger.info({
      request_id,
      action: "register",
      status: "success",
      username: cleanUsername
    });

    return res.apiResponse(
      {
        message: "Registrasi berhasil",
        user: {
          username: cleanUsername,
          email: cleanEmail
        }
      },
      201
    );

  } catch (error) {
    logger.error({
      request_id,
      action: "register",
      status: "error",
      error: error.message
    });

    return res.apiResponse(
      { message: "Registrasi gagal" },
      500
    );
  }
};
