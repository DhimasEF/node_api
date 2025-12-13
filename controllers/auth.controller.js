const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/user.model");
const logger = require("../utils/logger");

const secret_key = "flystudio_secret_key";

// =====================
// LOGIN
// =====================
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        logger.info("Login attempt", { username });

        if (!username || !password) {
            logger.warn("Login gagal: field kosong");
            return res.json({
                status: false,
                message: "Username dan password harus diisi"
            });
        }

        const user = await User.getByUsername(username);

        if (!user) {
            logger.warn("Login gagal: user tidak ditemukan", { username });
            return res.json({
                status: false,
                message: "User tidak ditemukan"
            });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            logger.warn("Login gagal: password salah", { username });
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

        logger.info("Login berhasil", {
            id_user: user.id_user,
            role: user.role
        });

        return res.json({
            status: true,
            message: "Login berhasil",
            token,
            user: payload
        });

    } catch (error) {
        logger.error("Login error", { error });
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
    try {
        const { username, password, email } = req.body;

        logger.info("Register attempt", { username });

        if (!username || !password) {
            logger.warn("Register gagal: field kosong");
            return res.json({
                status: false,
                message: "Username dan password wajib diisi"
            });
        }

        const cleanUsername = username.trim();
        const cleanEmail = email ? email.trim() : "";

        const exists = await User.checkUsernameExists(cleanUsername);
        if (exists) {
            logger.warn("Register gagal: username sudah dipakai", { cleanUsername });
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

        logger.info("Register berhasil", { cleanUsername });

        return res.json({
            status: true,
            message: "Registrasi berhasil",
            data: {
                username: cleanUsername,
                email: cleanEmail
            }
        });

    } catch (error) {
        logger.error("Register error", { error });
        return res.status(500).json({
            status: false,
            message: "Registrasi gagal"
        });
    }
};
