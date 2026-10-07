const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema({
  bagId: { type: String, required: true, trim: true, index: true },
  type: {
    type: String,
    required: true,
    enum: ["MOTION", "LOW_BATTERY", "EXCESSIVE_WEIGHT", "HIGH_TEMPERATURE", "BAG_OPENED", "CUSTOM"]
  },
  message: { type: String, required: true, trim: true },
  severity: { type: String, required: true, enum: ["info", "warning", "critical"] },
  timestamp: { type: Date, default: Date.now, index: true },
  resolved: { type: Boolean, default: false, index: true }
});

module.exports = mongoose.model("Alert", alertSchema);
