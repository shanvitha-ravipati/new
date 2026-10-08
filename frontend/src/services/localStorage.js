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

function getStorageKey(userId) {
  if (!userId) throw new Error("You must be signed in to access Smart Bag data.");
  return `smartbag-dashboard-data:${userId}`;
}

function readStore(userId) {
  try {
    const saved = window.localStorage.getItem(getStorageKey(userId));
    if (!saved) return { readings: [], alerts: [], timetable: [], remindedClasses: [] };
    const store = JSON.parse(saved);
    if (!Array.isArray(store.readings) || !Array.isArray(store.alerts)) {
      throw new SyntaxError("Invalid saved data shape.");
    }
    if (!Array.isArray(store.timetable)) store.timetable = [];
    if (!Array.isArray(store.remindedClasses)) store.remindedClasses = [];
    return store;
  } catch (error) {
    throw storageError(error);
  }
}

function writeStore(userId, store) {
  try {
    window.localStorage.setItem(getStorageKey(userId), JSON.stringify(store));
  } catch (error) {
    throw storageError(error);
  }
}

function createId() {
  return globalThis.crypto?.randomUUID?.() ||
    `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function sortTimetable(classes) {
  return classes.sort((first, second) => {
    const firstWeekday = (first.day + 6) % 7;
    const secondWeekday = (second.day + 6) % 7;
    return firstWeekday - secondWeekday || first.time.localeCompare(second.time);
  });
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

export async function getLatest(userId) {
  const store = readStore(userId);
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

export async function getHistory(userId, limit = 30) {
  return readStore(userId).readings.slice(-limit);
}

export async function getAlerts(userId) {
  return readStore(userId).alerts.filter((alert) => !alert.resolved).slice(0, 100);
}

export async function sendMockReading(userId) {
  const store = readStore(userId);
  const previous = store.readings.at(-1);
  const reading = {
    _id: createId(),
    bagId: "BAG001",
    weight: Number((3.2 + Math.random() * 2.5).toFixed(1)),
    temperature: Number((23 + Math.random() * 9).toFixed(1)),
    battery: 70 + Math.floor(Math.random() * 30),
    bagStatus: Math.random() > 0.96 ? "OPEN" : "CLOSED",
    motion: Math.random() > 0.94,
    timestamp: new Date().toISOString()
  };
  store.readings.push(reading);
  store.readings = store.readings.slice(-500);
  addAutomaticAlerts(store, reading, previous);
  store.alerts = store.alerts.slice(0, 100);
  writeStore(userId, store);
  return reading;
}

export async function resolveAlert(userId, id) {
  const store = readStore(userId);
  const alert = store.alerts.find((item) => item._id === id);
  if (!alert) throw new Error("This alert was not found in browser storage.");
  alert.resolved = true;
  writeStore(userId, store);
  return alert;
}

export async function getTimetable(userId) {
  return sortTimetable(readStore(userId).timetable);
}

export async function addTimetableClass(userId, classItem) {
  const subject = classItem.subject.trim();
  if (!subject) throw new Error("Enter a subject name.");
  if (!Number.isInteger(classItem.day) || classItem.day < 0 || classItem.day > 6) {
    throw new Error("Choose a valid day of the week.");
  }
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(classItem.time)) {
    throw new Error("Choose a valid class start time.");
  }
  const store = readStore(userId);
  const duplicate = store.timetable.some(
    (item) => item.day === classItem.day && item.time === classItem.time && item.subject.toLowerCase() === subject.toLowerCase()
  );
  if (duplicate) throw new Error("This subject is already scheduled at that time.");

  const savedClass = { id: createId(), subject, day: classItem.day, time: classItem.time };
  store.timetable.push(savedClass);
  sortTimetable(store.timetable);
  writeStore(userId, store);
  return store.timetable;
}

export async function removeTimetableClass(userId, id) {
  const store = readStore(userId);
  store.timetable = store.timetable.filter((item) => item.id !== id);
  store.remindedClasses = store.remindedClasses.filter((key) => !key.startsWith(`${id}:`));
  sortTimetable(store.timetable);
  writeStore(userId, store);
  return store.timetable;
}

export async function checkClassReminders(userId, now = new Date()) {
  const store = readStore(userId);
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const reminders = store.timetable.filter((item) => {
    const reminderKey = `${item.id}:${today}`;
    return item.day === now.getDay() && item.time === currentTime && !store.remindedClasses.includes(reminderKey);
  });

  if (reminders.length) {
    const reminderKeys = reminders.map((item) => `${item.id}:${today}`);
    store.remindedClasses.push(...reminderKeys);
    store.remindedClasses = store.remindedClasses.slice(-300);
    writeStore(userId, store);
  }
  return reminders;
}
