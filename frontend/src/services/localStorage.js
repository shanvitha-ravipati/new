const STORAGE_KEY = "smartbag-dashboard-data";
const OFFLINE_AFTER_MS = 15_000;

const THRESHOLDS = {
  weightLimitKg: 15,
  temperatureLimitC: 45,
  lowBatteryPercent: 20
};

function storageError(error) {
  if (error instanceof SyntaxError) {
    return new Error("Saved Smart Bag data is damaged. Clear this site's local storage and try again.");
  }
  if (error instanceof DOMException && error.name === "QuotaExceededError") {
    return new Error("Browser storage is full. Clear this site's saved data and try again.");
  }
  return new Error("Browser storage is unavailable. Enable local storage for this site and try again.");
}

function readStore() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return { readings: [], alerts: [] };
    const store = JSON.parse(saved);
    if (!Array.isArray(store.readings) || !Array.isArray(store.alerts)) {
      throw new SyntaxError("Invalid saved data shape.");
    }
    return store;
  } catch (error) {
    throw storageError(error);
  }
}

function writeStore(store) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (error) {
    throw storageError(error);
  }
}

function createId() {
  return globalThis.crypto?.randomUUID?.() ||
    `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function addAlert(store, reading, type, severity, message) {
  const alreadyActive = store.alerts.some(
    (alert) => alert.bagId === reading.bagId && alert.type === type && !alert.resolved
  );
  if (alreadyActive) return;
  store.alerts.unshift({
    _id: createId(),
    bagId: reading.bagId,
    type,
    severity,
    message,
    timestamp: reading.timestamp,
    resolved: false
  });
}

function addAutomaticAlerts(store, reading, previous) {
  const rules = [
    {
      type: "LOW_BATTERY",
      severity: "warning",
      active: reading.battery < THRESHOLDS.lowBatteryPercent,
      wasActive: previous?.battery < THRESHOLDS.lowBatteryPercent,
      message: `Battery is low (${reading.battery}%).`
    },
    {
      type: "EXCESSIVE_WEIGHT",
      severity: "warning",
      active: reading.weight > THRESHOLDS.weightLimitKg,
      wasActive: previous?.weight > THRESHOLDS.weightLimitKg,
      message: `Bag weight exceeds the limit (${reading.weight.toFixed(1)} kg).`
    },
    {
      type: "HIGH_TEMPERATURE",
      severity: "critical",
      active: reading.temperature > THRESHOLDS.temperatureLimitC,
      wasActive: previous?.temperature > THRESHOLDS.temperatureLimitC,
      message: `Temperature is too high (${reading.temperature.toFixed(1)}°C).`
    }
  ];

  rules.forEach((rule) => {
    if (rule.active && !rule.wasActive) {
      addAlert(store, reading, rule.type, rule.severity, rule.message);
    }
  });
  if (reading.motion && !previous?.motion) {
    addAlert(store, reading, "MOTION", "critical", "Motion or possible tampering detected.");
  }
  if (reading.bagStatus === "OPEN" && previous?.bagStatus !== "OPEN") {
    addAlert(store, reading, "BAG_OPENED", "warning", "The bag was opened.");
  }
}

export async function getLatest() {
  const store = readStore();
  const latest = store.readings.at(-1);
  if (!latest) {
    const error = new Error("No sensor data has been saved yet.");
    error.status = 404;
    throw error;
  }
  return {
    ...latest,
    online: Date.now() - new Date(latest.timestamp).getTime() <= OFFLINE_AFTER_MS,
    offlineAfterSeconds: OFFLINE_AFTER_MS / 1000,
    thresholds: THRESHOLDS
  };
}

export async function getHistory(limit = 30) {
  return readStore().readings.slice(-limit);
}

export async function getAlerts() {
  return readStore().alerts.filter((alert) => !alert.resolved).slice(0, 100);
}

export async function sendMockReading() {
  const store = readStore();
  const previous = store.readings.at(-1);
  const reading = {
    _id: createId(),
    bagId: "BAG001",
    weight: Number((3.2 + Math.random() * 2.5).toFixed(1)),
    temperature: Number((23 + Math.random() * 9).toFixed(1)),
    battery: 70 + Math.floor(Math.random() * 30),
    bagStatus: Math.random() > 0.96 ? "OPEN" : "CLOSED",
    motion: Math.random() > 0.94,
    latitude: Number((17.385 + (Math.random() - 0.5) * 0.008).toFixed(6)),
    longitude: Number((78.4867 + (Math.random() - 0.5) * 0.008).toFixed(6)),
    timestamp: new Date().toISOString()
  };
  store.readings.push(reading);
  store.readings = store.readings.slice(-500);
  addAutomaticAlerts(store, reading, previous);
  store.alerts = store.alerts.slice(0, 100);
  writeStore(store);
  return reading;
}

export async function resolveAlert(id) {
  const store = readStore();
  const alert = store.alerts.find((item) => item._id === id);
  if (!alert) throw new Error("This alert was not found in browser storage.");
  alert.resolved = true;
  writeStore(store);
  return alert;
}
