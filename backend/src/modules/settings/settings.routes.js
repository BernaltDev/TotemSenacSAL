const express = require("express");
const settingsController = require("./settings.controller");
const { authMiddleware } = require("../../middlewares/auth.middleware");
const { schoolMapUpload } = require("../../middlewares/upload.middleware");

const router = express.Router();

router.get("/", settingsController.get);
router.put("/", authMiddleware, settingsController.update);
router.post(
  "/school-map",
  authMiddleware,
  schoolMapUpload.single("schoolMap"),
  settingsController.uploadSchoolMap
);
router.get("/teacher-qr", authMiddleware, settingsController.teacherQrCode);

module.exports = router;
