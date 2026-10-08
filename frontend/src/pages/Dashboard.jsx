import React, { useCallback, useEffect, useState } from "react";
import { Bell, BellRing, CalendarPlus, Clock3, RefreshCw, Trash2, Thermometer, Weight, X } from "lucide-react";
import { signOut } from "firebase/auth";
import AlertPanel from "../components/AlertPanel";
import { BagStatus, SecurityCard } from "../components/BagStatus";
import BatteryCard from "../components/BatteryCard";
import Navbar from "../components/Navbar";
import SensorCard from "../components/SensorCard";
import SensorChart from "../components/SensorChart";
import {
  addTimetableClass,
  checkClassReminders,
  getAlerts,
  getHistory,
  getLatest,
  getTimetable,
  removeTimetableClass,
  resolveAlert,
  sendMockReading
} from "../services/localStorage";
import { auth } from "../firebase";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function Dashboard({ user }) {
  const [reading, setReading] = useState(null);
  const [history, setHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [demoMode, setDemoMode] = useState(false);
  const [demoBusy, setDemoBusy] = useState(false);
  const [resolvingId, setResolvingId] = useState("");
  const [timetable, setTimetable] = useState([]);
  const [subject, setSubject] = useState("");
  const [classDay, setClassDay] = useState(String(new Date().getDay()));
  const [classTime, setClassTime] = useState("");
  const [timetableError, setTimetableError] = useState("");
  const [classReminder, setClassReminder] = useState("");
  const [notificationPermission, setNotificationPermission] = useState(
    "Notification" in window ? window.Notification.permission : "unsupported"
  );

  const refresh = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const [latestResult, historyResult, alertsResult, timetableResult] = await Promise.allSettled([
        getLatest(user.uid),
        getHistory(user.uid),
        getAlerts(user.uid),
        getTimetable(user.uid)
      ]);
      if (latestResult.status === "fulfilled") {
        setReading(latestResult.value);
        setError("");
      } else if (latestResult.reason.status === 404) {
        setReading(null);
        setError("");
      } else {
        setError(latestResult.reason.message);
      }
      if (historyResult.status === "fulfilled") setHistory(historyResult.value);
      if (alertsResult.status === "fulfilled") setAlerts(alertsResult.value);
      if (timetableResult.status === "fulfilled") setTimetable(timetableResult.value);
      const failure = [historyResult, alertsResult, timetableResult].find((result) => result.status === "rejected");
      if (failure && latestResult.status === "fulfilled") setError(`Some dashboard data could not refresh: ${failure.reason.message}`);
    } finally {
      setLoading(false);
    }
  }, [user.uid]);

  useEffect(() => {
    refresh(true);
    const timer = window.setInterval(() => refresh(), 4000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  useEffect(() => {
    let cancelled = false;
    const checkReminders = async () => {
      try {
        const reminders = await checkClassReminders(user.uid);
        if (!cancelled && reminders.length) {
          const message = reminders.map((item) => item.subject).join(", ");
          setClassReminder(message);
          if ("Notification" in window && window.Notification.permission === "granted") {
            try {
              new window.Notification("Smart Bag class reminder", {
                body: `It's time to take your ${message} materials.`
              });
            } catch {
              setTimetableError("The browser could not display a desktop notification. The in-app reminder is still active.");
            }
          }
          const latest = await getTimetable(user.uid);
          if (!cancelled) setTimetable(latest);
        }
      } catch (reminderError) {
        if (!cancelled) setTimetableError(reminderError.message);
      }
    };
    checkReminders();
    const timer = window.setInterval(checkReminders, 10_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [user.uid]);

  useEffect(() => {
    if (!demoMode) return undefined;
    let cancelled = false;
    const generate = async () => {
      try {
        await sendMockReading(user.uid);
        if (!cancelled) await refresh();
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.message);
          setDemoMode(false);
        }
      }
    };
    generate();
    const timer = window.setInterval(generate, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [demoMode, refresh, user.uid]);

  async function handleDemoToggle() {
    if (demoMode) {
      setDemoMode(false);
      return;
    }
    setDemoBusy(true);
    try {
      await sendMockReading(user.uid);
      setError("");
      setDemoMode(true);
      await refresh();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setDemoBusy(false);
    }
  }

  async function handleResolve(id) {
    setResolvingId(id);
    try {
      await resolveAlert(user.uid, id);
      setAlerts((current) => current.filter((alert) => alert._id !== id));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setResolvingId("");
    }
  }

  async function handleSignOut() {
    try {
      await signOut(auth);
    } catch {
      setError("Could not sign out. Check your internet connection and try again.");
    }
  }

  async function handleAddClass(event) {
    event.preventDefault();
    setTimetableError("");
    try {
      const updated = await addTimetableClass(user.uid, {
        subject,
        day: Number(classDay),
        time: classTime
      });
      setTimetable(updated);
      setSubject("");
      setClassTime("");
    } catch (scheduleError) {
      setTimetableError(scheduleError.message);
    }
  }

  async function handleRemoveClass(id) {
    setTimetableError("");
    try {
      setTimetable(await removeTimetableClass(user.uid, id));
    } catch (scheduleError) {
      setTimetableError(scheduleError.message);
    }
  }

  async function enableNotifications() {
    if (!("Notification" in window)) {
      setNotificationPermission("unsupported");
      return;
    }
    try {
      const permission = await window.Notification.requestPermission();
      setNotificationPermission(permission);
    } catch {
      setTimetableError("Could not request notification permission. You can still use in-app reminders.");
    }
  }

  const online = Boolean(reading?.online);
  const thresholds = reading?.thresholds || {
    weightLimitKg: 15,
    temperatureLimitC: 45,
    lowBatteryPercent: 20
  };
  return (
    <div id="dashboard" className="app-shell">
      <Navbar online={online} userEmail={user.email} onSignOut={handleSignOut} />
      <main className="dashboard-main">
        <section className="welcome-row">
          <div>
            <div className="eyebrow">OVERVIEW <span className="eyebrow-dot" /> BAG001</div>
            <h1>Your bag, at a glance.</h1>
            <p className="welcome-subtitle">Live conditions and security from your Smart Bag.</p>
          </div>
          <div className="welcome-actions">
            <div className={`bag-presence ${online ? "present" : ""}`}><span className="status-dot" />{online ? "Connected" : "Offline"}<span className="action-separator">·</span> BAG001</div>
            <button className={`demo-button ${demoMode ? "demo-active" : ""}`} onClick={handleDemoToggle} disabled={demoBusy}>
              <span className="demo-dot" />{demoBusy ? "Starting..." : demoMode ? "Stop demo" : "Run live demo"}
            </button>
          </div>
        </section>

        {error && <div className="error-banner" role="alert"><strong>Dashboard issue</strong><span>{error}</span><button onClick={() => refresh(true)}>Retry</button></div>}
        {classReminder && (
          <div className="class-reminder" role="status">
            <BellRing size={20} />
            <span><strong>Class time!</strong> Take your {classReminder} materials.</span>
            <button onClick={() => setClassReminder("")} aria-label="Dismiss class reminder"><X size={17} /></button>
          </div>
        )}

        <div className="section-label"><span>LIVE READINGS</span><small>Updates every 4 seconds</small></div>
        {loading && !reading ? (
          <section className="loading-panel"><RefreshCw className="spin" size={20} /><span>Loading saved Smart Bag readings...</span></section>
        ) : !reading ? (
          <section className="no-data-panel"><div className="no-data-icon">🎒</div><h2>No readings yet</h2><p>Start the live demo to generate sample readings saved in this browser.</p><button className="primary-button" onClick={handleDemoToggle} disabled={demoBusy}>Generate sample data</button></section>
        ) : (
          <>
            <section className="sensor-grid">
              <SensorCard icon={Weight} label="WEIGHT" value={reading.weight.toFixed(1)} unit="kg" detail={reading.weight > thresholds.weightLimitKg ? `Above the ${thresholds.weightLimitKg} kg weight limit` : "Within a safe weight range"} tone={reading.weight > thresholds.weightLimitKg ? "orange" : "blue"} />
              <SensorCard icon={Thermometer} label="TEMPERATURE" value={reading.temperature.toFixed(1)} unit="°C" detail={reading.temperature > thresholds.temperatureLimitC ? "Temperature is above the safe limit" : "Ambient bag temperature"} tone={reading.temperature > thresholds.temperatureLimitC ? "red" : "orange"} />
              <BatteryCard value={reading.battery} lowThreshold={thresholds.lowBatteryPercent} />
              <BagStatus status={reading.bagStatus} />
              <SecurityCard motion={reading.motion} />
            </section>
            <div className="updated-line"><Clock3 size={14} />Last reading {new Date(reading.timestamp).toLocaleTimeString()}<span className="updated-divider">·</span>Bag ID <strong>{reading.bagId}</strong></div>
            {reading.online === false && <div className="offline-notice">No new readings have been saved recently. Displaying the latest saved reading.</div>}
          </>
        )}
        <section className="panel timetable-panel">
          <div className="panel-heading">
            <div><span className="eyebrow">CLASS PREPARATION</span><h2>My timetable</h2></div>
            <button className="notification-button" onClick={enableNotifications} disabled={notificationPermission === "granted" || notificationPermission === "denied" || notificationPermission === "unsupported"}>
              <Bell size={15} />
              {notificationPermission === "granted" ? "Notifications on" : notificationPermission === "denied" ? "Notifications blocked" : notificationPermission === "unsupported" ? "In-app reminder only" : "Enable notifications"}
            </button>
          </div>
          <p className="timetable-help">Add your class timings. Smart Bag will remind you to take the subject materials for class. Keep this dashboard open for reminders.</p>
          {timetableError && <div className="timetable-error" role="alert">{timetableError}</div>}
          <form className="timetable-form" onSubmit={handleAddClass}>
            <label>Subject<input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="e.g. Physics" maxLength={60} required /></label>
            <label>Day<select value={classDay} onChange={(event) => setClassDay(event.target.value)}>{WEEKDAYS.map((day, index) => <option key={day} value={index}>{day}</option>)}</select></label>
            <label>Start time<input type="time" value={classTime} onChange={(event) => setClassTime(event.target.value)} required /></label>
            <button className="primary-button timetable-add" type="submit"><CalendarPlus size={16} />Add class</button>
          </form>
          <div className="timetable-table-wrap">
            {timetable.length === 0 ? (
              <div className="timetable-empty">No classes added yet. Add a class above to set your first reminder.</div>
            ) : (
              <table className="timetable-table">
                <thead>
                  <tr><th scope="col">Day</th><th scope="col">Time</th><th scope="col">Subject</th><th scope="col"><span className="sr-only">Actions</span></th></tr>
                </thead>
                <tbody>
                  {timetable.map((item) => (
                    <tr key={item.id}>
                      <td>{WEEKDAYS[item.day]}</td>
                      <td><span className="timetable-time"><Clock3 size={14} />{item.time}</span></td>
                      <td className="timetable-subject">{item.subject}</td>
                      <td className="timetable-action-cell">
                        <button className="timetable-remove" onClick={() => handleRemoveClass(item.id)} aria-label={`Remove ${item.subject} class`} title="Remove class"><Trash2 size={15} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <p className="timetable-footnote">Browser reminders work while the dashboard is open. Allow notifications when prompted to receive desktop notifications.</p>
        </section>
        {reading && (
          <section className="detail-grid">
            <AlertPanel alerts={alerts} onResolve={handleResolve} resolvingId={resolvingId} />
            <SensorChart history={history} />
          </section>
        )}
        <footer className="page-footer"><span>SMART BAG MONITORING</span><span>Built for a safer carry.</span></footer>
      </main>
    </div>
  );
}
