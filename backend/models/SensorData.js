const mongoose = require("mongoose");

const sensorDataSchema = new mongoose.Schema(
  {
    bagId: { type: String, required: true, trim: true, index: true },
    weight: { type: Number, required: true, min: 0 },
    temperature: { type: Number, required: true, min: -50, max: 150 },
    battery: { type: Number, required: true, min: 0, max: 100 },
    bagStatus: { type: String, enum: ["OPEN", "CLOSED"], required: true },
    motion: { type: Boolean, required: true }
  },
  { timestamps: { createdAt: "timestamp", updatedAt: false } }
);

module.exports = mongoose.model("SensorData", sensorDataSchema);
