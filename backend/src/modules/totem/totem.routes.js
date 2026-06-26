const express = require("express");
const totemController = require("./totem.controller");

const router = express.Router();

router.get("/data", totemController.getData);
router.get("/stream", totemController.stream);

module.exports = router;
