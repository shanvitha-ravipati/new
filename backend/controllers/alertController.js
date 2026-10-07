const Alert = require("../models/Alert");

async function getAlerts(req, res, next) {
  try {
    const filter = {};
    if (req.query.bagId) filter.bagId = req.query.bagId;
    if (req.query.resolved === "true") filter.resolved = true;
    if (req.query.resolved === "false") filter.resolved = false;
    const alerts = await Alert.find(filter).sort({ timestamp: -1 }).limit(100);
    res.json(alerts);
  } catch (error) {
    next(error);
  }
}

async function createAlert(req, res, next) {
  try {
    const { bagId, type, message, severity } = req.body;
    if (!bagId || !type || !message || !severity) {
      return res.status(400).json({ message: "bagId, type, message and severity are required." });
    }
    const alert = await Alert.create({ bagId, type, message, severity });
    res.status(201).json(alert);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
}

async function resolveAlert(req, res, next) {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { resolved: true },
      { new: true, runValidators: true }
    );
    if (!alert) return res.status(404).json({ message: "Alert not found." });
    res.json(alert);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid alert ID." });
    }
    next(error);
  }
}

module.exports = { getAlerts, createAlert, resolveAlert };
