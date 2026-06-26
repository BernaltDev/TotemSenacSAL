const express = require("express");
const contentController = require("./content.controller");
const { authMiddleware } = require("../../middlewares/auth.middleware");

const router = express.Router();

router.get("/:type", authMiddleware, contentController.list);
router.post("/:type", authMiddleware, contentController.create);
router.put("/:type/:id", authMiddleware, contentController.update);
router.delete("/:type/:id", authMiddleware, contentController.remove);

module.exports = router;
