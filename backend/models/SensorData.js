const mongoose = require("mongoose");

const sensorDataSchema = new mongoose.Schema(
  {
    bagId: { type: String, required: true, trim: true, index: true },
    weight: { type: Number, required: true, min: 0 },
    temperature: { type: Number, required: true, min: -50, max: 150 },
    battery: { type: Number, required: true, min: 0, max: 100 },
    bagStatus: { type: String, enum: ["OPEN", "CLOSED"], required: true },
    motion: { type: Boolean, required: true },
    latitude: { type: Number, default: null, min: -90, max: 90 },
    longitude: { type: Number, default: null, min: -180, max: 180 }
  },
  { timestamps: { createdAt: "timestamp", updatedAt: false } }
);

module.exports = mongoose.model("SensorData", sensorDataSchema);
