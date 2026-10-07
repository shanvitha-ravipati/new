const express = require("express");
const {
  postSensorData,
  getLatestSensorData,
  getSensorHistory,
  postMockSensorData
} = require("../controllers/sensorController");

const router = express.Router();

router.post("/", postSensorData);
router.post("/mock", postMockSensorData);
router.get("/latest", getLatestSensorData);
router.get("/history", getSensorHistory);

module.exports = router;
