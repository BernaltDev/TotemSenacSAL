const express = require("express");
const schedulesController = require("./schedules.controller");
const { authMiddleware } = require("../../middlewares/auth.middleware");
const { spreadsheetUpload } = require("../../middlewares/upload.middleware");

const router = express.Router();

router.get("/", authMiddleware, schedulesController.list);
router.post(
  "/import",
  authMiddleware,
  spreadsheetUpload.single("spreadsheet"),
  schedulesController.importSpreadsheet
);
router.put("/:id", authMiddleware, schedulesController.update);
router.delete("/:id", authMiddleware, schedulesController.remove);
router.post("/actions/reset-statuses", authMiddleware, schedulesController.resetStatuses);

module.exports = router;
