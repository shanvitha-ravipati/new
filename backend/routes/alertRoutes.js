const express = require("express");
const { getAlerts, createAlert, resolveAlert } = require("../controllers/alertController");

const router = express.Router();

router.get("/", getAlerts);
router.post("/", createAlert);
router.patch("/:id/resolve", resolveAlert);

module.exports = router;
