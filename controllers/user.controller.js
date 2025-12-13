const db = require("../config/db");
const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");
const bcrypt = require("bcryptjs");
const User = require("../models/user.model");

module.exports = {

    // ========================
    // GET /user/getData
    // ========================
    getData: async (req, res) => {
        logger.info("Request getData diterima", {
            ip: req.ip,
            userAgent: req.headers["user-agent"]
        });

        try {
            const authHeader = req.headers["authorization"];

            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                logger.warn("Token tidak ditemukan di header", { ip: req.ip });
                return res.status(401).json({
                    status: false,
                    message: "Token tidak ditemukan",
                    data: []
                });
            }

            const token = authHeader.substring(7);

            logger.info("Token diterima (disensor)", {
                token_preview: token.substring(0, 10) + "...(hidden)"
            });

            // ⬇️ PAKAI MODEL (BUKAN db.query langsung)
            const user = await User.getByToken(token);

            if (!user) {
                logger.warn("Token tidak valid", { token_preview: token.substring(0, 10) });
                return res.status(401).json({
                    status: false,
                    message: "Token tidak valid atau user tidak ditemukan",
                    data: []
                });
            }

            logger.info("Token valid", {
                id_user: user.id_user,
                username: user.username,
                role: user.role
            });

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
            logger.error("DB Error saat getData", {
                error: err.message,
                stack: err.stack
            });

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
        logger.info("Request list user");

        try {
            const users = await User.getAllUsers();

            logger.info("List user berhasil diambil", {
                total: users.length
            });

            res.json({
                status: true,
                message: "List user berhasil diambil",
                data: users
            });

        } catch (err) {
            logger.error("DB Error saat ambil list user", {
                error: err.message,
                stack: err.stack
            });

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
        const id = req.params.id;
        logger.info("Request detail user", { id });

        try {
            const user = await User.getUserById(id);

            if (!user) {
                logger.warn("User tidak ditemukan", { id });
                return res.status(404).json({
                    status: false,
                    message: "User tidak ditemukan"
                });
            }

            logger.info("Detail user ditemukan", {
                id_user: user.id_user,
                username: user.username
            });

            res.json({
                status: true,
                data: user
            });

        } catch (err) {
            logger.error("DB Error saat ambil detail user", {
                error: err.message,
                stack: err.stack,
                id
            });

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
        const id = req.params.id;
        logger.warn("Request reset password", { id });

        try {
            const newPassword = "user" + Math.floor(10000 + Math.random() * 90000);
            const hash = await bcrypt.hash(newPassword, 10);

            const updated = await User.resetPassword(id, hash);

            if (!updated) {
                logger.warn("Reset password gagal", { id });
                return res.status(400).json({
                    status: false,
                    message: "Gagal reset password"
                });
            }

            logger.info("Password berhasil direset", { id });

            res.json({
                status: true,
                message: "Password berhasil direset",
                new_password: newPassword
            });

        } catch (err) {
            logger.error("DB Error saat reset password", {
                error: err.message,
                stack: err.stack,
                id
            });

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
        const id_user = req.params.id_user;
        logger.info("Request uplofile user", { id_user });

        try {
            const user = await User.getUserById(id_user);

            if (!user) {
                logger.warn("User uplofile tidak ditemukan", { id_user });
                return res.status(404).json({
                    success: false,
                    message: "User tidak ditemukan"
                });
            }

            const totalArtwork = await User.countArtworkByUser(id_user);

            logger.info("Uplofile berhasil diambil", {
                id_user,
                totalArtwork
            });

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
            logger.error("DB Error saat ambil uplofile", {
                error: err.message,
                stack: err.stack,
                id_user
            });

            res.status(500).json({
                success: false,
                message: "Database error"
            });
        }
    }

};
