const Alert = require("../models/Alert");
const SensorData = require("../models/SensorData");

const ALERT_RULES = [
  {
    type: "LOW_BATTERY",
    severity: "warning",
    message: (reading) => `Battery is low (${reading.battery}%).`,
    applies: (reading) => reading.battery < Number(process.env.LOW_BATTERY_PERCENT || 20)
  },
  {
    type: "EXCESSIVE_WEIGHT",
    severity: "warning",
    message: (reading) => `Bag weight exceeds the limit (${reading.weight.toFixed(1)} kg).`,
    applies: (reading) => reading.weight > Number(process.env.WEIGHT_LIMIT_KG || 15)
  },
  {
    type: "HIGH_TEMPERATURE",
    severity: "critical",
    message: (reading) => `Temperature is too high (${reading.temperature.toFixed(1)}°C).`,
    applies: (reading) => reading.temperature > Number(process.env.TEMPERATURE_LIMIT_C || 45)
  }
];

function validateReading(body) {
  const errors = [];
  if (typeof body.bagId !== "string" || !body.bagId.trim()) errors.push("bagId must be a non-empty string.");
  for (const field of ["weight", "temperature", "battery"]) {
    if (typeof body[field] !== "number" || !Number.isFinite(body[field])) {
      errors.push(`${field} must be a finite number.`);
    }
  }
  if (typeof body.weight === "number" && body.weight < 0) errors.push("weight cannot be negative.");
  if (typeof body.temperature === "number" && (body.temperature < -50 || body.temperature > 150)) {
    errors.push("temperature must be between -50 and 150.");
  }
  if (typeof body.battery === "number" && (body.battery < 0 || body.battery > 100)) {
    errors.push("battery must be between 0 and 100.");
  }
  if (!["OPEN", "CLOSED"].includes(body.bagStatus)) errors.push("bagStatus must be OPEN or CLOSED.");
  if (typeof body.motion !== "boolean") errors.push("motion must be true or false.");

  return errors;
}

async function createAutomaticAlert(reading, type, severity, message) {
  const existing = await Alert.findOne({ bagId: reading.bagId, type, resolved: false });
  if (!existing) await Alert.create({ bagId: reading.bagId, type, severity, message });
}

async function checkAlerts(reading, previous) {
  for (const rule of ALERT_RULES) {
    if (rule.applies(reading) && (!previous || !rule.applies(previous))) {
      await createAutomaticAlert(reading, rule.type, rule.severity, rule.message(reading));
    }
  }
  if (reading.motion && (!previous || !previous.motion)) {
    await createAutomaticAlert(reading, "MOTION", "critical", "Motion or possible tampering detected.");
  }
  if (reading.bagStatus === "OPEN" && (!previous || previous.bagStatus !== "OPEN")) {
    await createAutomaticAlert(reading, "BAG_OPENED", "warning", "The bag was opened.");
  }
}

async function postSensorData(req, res, next) {
  try {
    const body = req.body || {};
    const errors = validateReading(body);
    if (errors.length) return res.status(400).json({ message: "Invalid sensor data.", errors });

    const reading = {
      bagId: body.bagId.trim(),
      weight: body.weight,
      temperature: body.temperature,
      battery: body.battery,
      bagStatus: body.bagStatus,
      motion: body.motion
    };
    const previous = await SensorData.findOne({ bagId: reading.bagId }).sort({ timestamp: -1 });
    const saved = await SensorData.create(reading);
    await checkAlerts(reading, previous);
    res.status(201).json(saved);
  } catch (error) {
    next(error);
  }
}

async function getLatestSensorData(req, res, next) {
  try {
    const bagId = req.query.bagId || "BAG001";
    const reading = await SensorData.findOne({ bagId }).sort({ timestamp: -1 });
    if (!reading) return res.status(404).json({ message: `No sensor data has been received for ${bagId}.` });
    const offlineAfter = Number(process.env.OFFLINE_AFTER_SECONDS || 15);
    res.json({
      ...reading.toObject(),
      online: Date.now() - reading.timestamp.getTime() <= offlineAfter * 1000,
      offlineAfterSeconds: offlineAfter,
      thresholds: {
        weightLimitKg: Number(process.env.WEIGHT_LIMIT_KG || 15),
        temperatureLimitC: Number(process.env.TEMPERATURE_LIMIT_C || 45),
        lowBatteryPercent: Number(process.env.LOW_BATTERY_PERCENT || 20)
      }
    });
  } catch (error) {
    next(error);
  }
}

async function getSensorHistory(req, res, next) {
  try {
    const bagId = req.query.bagId || "BAG001";
    const parsedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 500) : 100;
    const readings = await SensorData.find({ bagId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
    res.json(readings.reverse());
  } catch (error) {
    next(error);
  }
}

async function postMockSensorData(req, res, next) {
  try {
    const previous = await SensorData.findOne({ bagId: "BAG001" }).sort({ timestamp: -1 }).lean();
    const reading = {
      bagId: "BAG001",
      weight: Number((3.2 + Math.random() * 2.5).toFixed(1)),
      temperature: Number((23 + Math.random() * 9).toFixed(1)),
      battery: Math.max(5, Math.floor(85 - (Date.now() % 70_000) / 1_000)),
      bagStatus: Math.random() > 0.96 ? "OPEN" : "CLOSED",
      motion: Math.random() > 0.94
    };
    const saved = await SensorData.create(reading);
    await checkAlerts(reading, previous);
    res.status(201).json(saved);
  } catch (error) {
    next(error);
  }
}

module.exports = { postSensorData, getLatestSensorData, getSensorHistory, postMockSensorData };
