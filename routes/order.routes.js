const express = require("express");
const router = express.Router();
const multer = require("multer");
const orderCtrl = require("../controllers/order.controller");

const storage = multer.diskStorage({
    destination: "./uploads/payment",
    filename: (req, file, cb) => {
        cb(null, "bukti_" + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

router.post("/create", orderCtrl.create);
router.get("/my-buyer", orderCtrl.myAsBuyer);
router.get("/my-creator", orderCtrl.myAsCreator);
router.get("/detail", orderCtrl.detail);
router.post("/upload-payment", upload.single("bukti"), orderCtrl.uploadPayment);

module.exports = router;
