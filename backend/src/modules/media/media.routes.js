const express = require("express");
const mediaController = require("./media.controller");
const { authMiddleware } = require("../../middlewares/auth.middleware");
const { mediaUpload } = require("../../middlewares/upload.middleware");

const router = express.Router();

router.get("/", authMiddleware, mediaController.list);
router.post("/", authMiddleware, mediaUpload.single("file"), mediaController.create);
router.put("/:id", authMiddleware, mediaController.update);
router.delete("/:id", authMiddleware, mediaController.remove);

module.exports = router;
