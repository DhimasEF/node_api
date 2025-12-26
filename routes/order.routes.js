const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
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
router.get("/all-order", orderCtrl.getAllOrdersAdmin);
router.get("/detail", orderCtrl.detail);
router.post('/accept-payment', orderCtrl.acceptPayment);
router.post('/reject-payment', orderCtrl.rejectPayment);
router.get('/:id/download', orderCtrl.downloadOrderArtwork);


router.post("/upload-payment", upload.single("bukti"), orderCtrl.uploadPayment);

module.exports = router;
