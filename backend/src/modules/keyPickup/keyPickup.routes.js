const express = require("express");
const keyPickupController = require("./keyPickup.controller");

const router = express.Router();

router.get("/current", keyPickupController.currentClasses);
router.post("/:id/confirm", keyPickupController.confirm);

module.exports = router;
