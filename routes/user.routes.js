const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");

router.get("/data", userController.getData);
router.get("/list", userController.list);
router.get("/detail/:id", userController.detail);
router.post("/reset_password/:id", userController.resetPassword)
router.get("/uplofile/:id_user", userController.uplofile);

module.exports = router;
