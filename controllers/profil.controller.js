const User = require('../models/user.model');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

// ====================
// GET PROFILE BY ID
// ====================
exports.getProfile = async (req, res) => {
    const userId = parseInt(req.params.id);

    logger.info("Request getProfile", { userId });

    try {
        const user = await User.getUserById(userId);

        if (!user) {
            logger.warn("User tidak ditemukan (getProfile)", { userId });
            return res.status(404).json({
                status: false,
                message: "User tidak ditemukan"
            });
        }

        logger.info("Get profile berhasil", {
            userId,
            username: user.username
        });

        res.json({
            status: true,
            data: user
        });

    } catch (err) {
        logger.error("DB Error saat getProfile", {
            error: err.message,
            stack: err.stack,
            userId
        });

        res.status(500).json({
            status: false,
            message: "Database error"
        });
    }
};

// ====================
// UPDATE PROFILE
// ====================
exports.updateProfile = async (req, res) => {
    const userId = parseInt(req.params.id);
    const data = req.body;

    logger.info("Request updateProfile", { userId });

    if (!data || Object.keys(data).length === 0) {
        logger.warn("Update profile gagal: data kosong", { userId });
        return res.status(400).json({
            status: false,
            message: "Data tidak valid"
        });
    }

    const updateData = {
        username: data.username,
        email: data.email,
        name: data.name,
        bio: data.bio
    };

    if (data.avatar) updateData.avatar = data.avatar;

    try {
        const updated = await User.updateUser(userId, updateData);

        if (!updated) {
            logger.warn("Update profile gagal (tidak ada row berubah)", {
                userId,
                updateData
            });

            return res.status(400).json({
                status: false,
                message: "Profil gagal diperbarui"
            });
        }

        logger.info("Profil berhasil diperbarui", {
            userId,
            updateData
        });

        res.json({
            status: true,
            message: "Profil berhasil diperbarui"
        });

    } catch (err) {
        logger.error("DB Error saat updateProfile", {
            error: err.message,
            stack: err.stack,
            userId,
            updateData
        });

        res.status(500).json({
            status: false,
            message: "Database error"
        });
    }
};

// ====================
// UPLOAD AVATAR
// ====================
exports.uploadAvatar = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

    if (req.method === 'OPTIONS') return res.sendStatus(200);

    try {
        const { id_user, avatar_base64 } = req.body;

        if (!id_user || !avatar_base64) {
            logger.warn("Upload avatar gagal: data tidak lengkap", { id_user });
            return res.status(400).json({
                status: false,
                message: "Data tidak lengkap"
            });
        }

        const base64Data = avatar_base64.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        const filename = `avatar_${id_user}_${Date.now()}.png`;
        const folder = path.join(__dirname, '../uploads/avatar');

        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, { recursive: true });
            logger.info("Folder avatar dibuat", { folder });
        }

        const filepath = path.join(folder, filename);
        fs.writeFileSync(filepath, buffer);

        const url = `uploads/avatar/${filename}`;

        const updated = await User.updateUser(id_user, { avatar: url });

        if (!updated) {
            logger.warn("Avatar gagal disimpan ke DB", { id_user, url });
            return res.status(500).json({
                status: false,
                message: "Gagal update avatar ke database"
            });
        }

        logger.info("Avatar berhasil diunggah", {
            id_user,
            file: filename,
            url
        });

        res.json({
            status: true,
            message: "Avatar berhasil diunggah",
            avatar: url
        });

    } catch (err) {
        logger.error("Gagal upload avatar", {
            error: err.message,
            stack: err.stack
        });

        res.status(500).json({
            status: false,
            message: "Gagal menyimpan avatar"
        });
    }
};
