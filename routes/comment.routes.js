const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth.middleware");
const CommentController = require("../controllers/comment.controller");

router.get("/artwork/:id", CommentController.getByArtwork);
router.post("/", auth, CommentController.addComment);
router.delete("/:id", auth, CommentController.deleteComment);

module.exports = router;
