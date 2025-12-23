const User = require('../models/user.model');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

// ====================
// GET PROFILE BY ID
// ====================
exports.getProfile = async (req, res) => {
  const userId = parseInt(req.params.id);
  const rid = req.requestId;

  logger.info(
    `request_id=${rid} action=getProfile status=start userId=${userId}`
  );

  try {
    const user = await User.getUserById(userId);

    if (!user) {
      logger.warn(
        `request_id=${rid} action=getProfile status=not_found userId=${userId}`
      );
      return res.status(404).json({
        status: false,
        message: "User tidak ditemukan"
      });
    }

    logger.info(
      `request_id=${rid} action=getProfile status=success userId=${userId} username=${user.username}`
    );

    res.json({
      status: true,
      data: user
    });

  } catch (err) {
    logger.error(
      `request_id=${rid} action=getProfile status=error userId=${userId} error=${err.message}`
    );

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
  const rid = req.requestId;
  const data = req.body;

  logger.info(
    `request_id=${rid} action=updateProfile status=start userId=${userId}`
  );

  if (!data || Object.keys(data).length === 0) {
    logger.warn(
      `request_id=${rid} action=updateProfile status=invalid userId=${userId} reason=empty_data`
    );
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
      logger.warn(
        `request_id=${rid} action=updateProfile status=not_updated userId=${userId}`
      );
      return res.status(400).json({
        status: false,
        message: "Profil gagal diperbarui"
      });
    }

    logger.info(
      `request_id=${rid} action=updateProfile status=success userId=${userId}`
    );

    res.json({
      status: true,
      message: "Profil berhasil diperbarui"
    });

  } catch (err) {
    logger.error(
      `request_id=${rid} action=updateProfile status=error userId=${userId} error=${err.message}`
    );

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
  const rid = req.requestId;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.sendStatus(200);

  try {
    const { id_user, avatar_base64 } = req.body;

    logger.info(
      `request_id=${rid} action=uploadAvatar status=start userId=${id_user}`
    );

    if (!id_user || !avatar_base64) {
      logger.warn(
        `request_id=${rid} action=uploadAvatar status=invalid userId=${id_user} reason=missing_data`
      );
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
      logger.info(
        `request_id=${rid} action=uploadAvatar status=folder_created folder=${folder}`
      );
    }

    const filepath = path.join(folder, filename);
    fs.writeFileSync(filepath, buffer);

    const updated = await User.updateUser(id_user, { avatar: filename });

    if (!updated) {
      logger.warn(
        `request_id=${rid} action=uploadAvatar status=db_failed userId=${id_user}`
      );
      return res.status(500).json({
        status: false,
        message: "Gagal update avatar ke database"
      });
    }

    logger.info(
      `request_id=${rid} action=uploadAvatar status=success userId=${id_user} file=${filename}`
    );

    res.json({
      status: true,
      message: "Avatar berhasil diunggah",
      avatar: filename
    });

  } catch (err) {
    logger.error(
      `request_id=${rid} action=uploadAvatar status=error error=${err.message}`
    );

    res.status(500).json({
      status: false,
      message: "Gagal menyimpan avatar"
    });
  }
};

