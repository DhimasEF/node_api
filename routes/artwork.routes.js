const express = require("express");
const router = express.Router();
const multer = require("multer");
const controller = require("../controllers/artwork.controller");

// UPLOAD CONFIG
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/artworks/original"),
  filename: (req, file, cb) => cb(null, Date.now() + "_" + file.originalname),
});

const upload = multer({ storage });

router.get("/all", controller.getAll);
router.get("/all_admin", controller.getAllAdmin);
router.get("/draft", controller.getDraft);
router.get("/detail/:id", controller.getDetail);
router.get("/my/:id_user", controller.getByUser);
router.get("/pending", controller.getPending);

// upload multiple images
router.post("/upload", upload.array("images", 10), controller.upload);

router.post("/updateStatus", controller.updateStatus);

module.exports = router;
