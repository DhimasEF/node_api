const User = require('../models/user.model');
const fs = require('fs');
const path = require('path');
// const logger = require('../utils/logger');

// ====================
// GET PROFILE BY ID
// ====================
exports.getProfile = async (req, res) => {
  const request_id = req.requestId;
  const userId = Number(req.params.id);

  // logger.info({
  //   request_id,
  //   action: "getProfile",
  //   status: "start",
  //   userId
  // });

  try {
    const user = await User.getUserById(userId);

    if (!user) {
      // logger.warn({
      //   request_id,
      //   action: "getProfile",
      //   status: "not_found",
      //   userId
      // });

      return res.apiResponse(
        { message: "User tidak ditemukan" },
        404
      );
    }

    // logger.info({
    //   request_id,
    //   action: "getProfile",
    //   status: "success",
    //   userId,
    //   username: user.username
    // });

    return res.apiResponse({ data: user }, 200);

  } catch (error) {
    // logger.error({
    //   request_id,
    //   action: "getProfile",
    //   status: "error",
    //   userId,
    //   error: error.message
    // });

    return res.apiResponse(
      { message: "Database error" },
      500
    );
  }
};

// ====================
// UPDATE PROFILE
// ====================
exports.updateProfile = async (req, res) => {
  const request_id = req.requestId;
  const userId = Number(req.params.id);
  const data = req.body;

  // logger.info({
  //   request_id,
  //   action: "updateProfile",
  //   status: "start",
  //   userId
  // });

  if (!data || Object.keys(data).length === 0) {
    // logger.warn({
    //   request_id,
    //   action: "updateProfile",
    //   status: "invalid",
    //   userId,
    //   reason: "empty_payload"
    // });

    return res.apiResponse(
      { message: "Data tidak valid" },
      400
    );
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
      // logger.warn({
      //   request_id,
      //   action: "updateProfile",
      //   status: "not_updated",
      //   userId
      // });

      return res.apiResponse(
        { message: "Profil gagal diperbarui" },
        400
      );
    }

    // logger.info({
    //   request_id,
    //   action: "updateProfile",
    //   status: "success",
    //   userId
    // });

    return res.apiResponse(
      { message: "Profil berhasil diperbarui" },
      200
    );

  } catch (error) {
    // logger.error({
    //   request_id,
    //   action: "updateProfile",
    //   status: "error",
    //   userId,
    //   error: error.message
    // });

    return res.apiResponse(
      { message: "Database error" },
      500
    );
  }
};

// ====================
// UPLOAD AVATAR
// ====================
exports.uploadAvatar = async (req, res) => {
  const request_id = req.requestId;

  // ⚠️ Sebaiknya CORS di middleware global
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") return res.sendStatus(200);

  try {
    const { id_user, avatar_base64 } = req.body;

    // logger.info({
    //   request_id,
    //   action: "uploadAvatar",
    //   status: "start",
    //   id_user
    // });

    if (!id_user || !avatar_base64) {
      // logger.warn({
      //   request_id,
      //   action: "uploadAvatar",
      //   status: "invalid",
      //   id_user,
      //   reason: "missing_data"
      // });

      return res.apiResponse({ message: "Data tidak lengkap" }, 400);
    }

    // =========================
    // 1️⃣ Ambil avatar lama
    // =========================
    const user = await User.getById(id_user);
    const oldAvatar = user?.avatar;

    // =========================
    // 2️⃣ Decode base64 → buffer
    // =========================
    const base64Data = avatar_base64.replace(
      /^data:image\/\w+;base64,/,
      ""
    );
    const buffer = Buffer.from(base64Data, "base64");

    // =========================
    // 3️⃣ Simpan avatar baru
    // =========================
    const filename = `avatar_${id_user}_${Date.now()}.png`;
    const folder = path.join(__dirname, "../uploads/avatar");

    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });

      // logger.info({
      //   request_id,
      //   action: "uploadAvatar",
      //   status: "folder_created",
      //   folder
      // });
    }

    const filepath = path.join(folder, filename);
    fs.writeFileSync(filepath, buffer);

    // =========================
    // 4️⃣ Update DB
    // =========================
    const updated = await User.updateUser(id_user, { avatar: filename });

    if (!updated) {
      // logger.warn({
      //   request_id,
      //   action: "uploadAvatar",
      //   status: "db_failed",
      //   id_user
      // });

      return res.apiResponse(
        { message: "Gagal update avatar ke database" },
        500
      );
    }

    // =========================
    // 5️⃣ Hapus avatar lama
    // =========================
    if (oldAvatar && oldAvatar !== "default.png") {
      const oldPath = path.join(folder, oldAvatar);

      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);

        // logger.info({
        //   request_id,
        //   action: "uploadAvatar",
        //   status: "old_avatar_deleted",
        //   file: oldAvatar
        // });
      }
    }

    // =========================
    // 6️⃣ Response sukses
    // =========================
    // logger.info({
    //   request_id,
    //   action: "uploadAvatar",
    //   status: "success",
    //   id_user,
    //   file: filename
    // });

    return res.apiResponse(
      {
        message: "Avatar berhasil diunggah",
        avatar: filename
      },
      200
    );

  } catch (error) {
    // logger.error({
    //   request_id,
    //   action: "uploadAvatar",
    //   status: "error",
    //   error: error.message
    // });

    return res.apiResponse(
      { message: "Gagal menyimpan avatar" },
      500
    );
  }
};
