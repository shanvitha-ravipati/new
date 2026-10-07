import React, { useCallback, useEffect, useState } from "react";
import { Clock3, RefreshCw, Thermometer, Weight } from "lucide-react";
import AlertPanel from "../components/AlertPanel";
import { BagStatus, SecurityCard } from "../components/BagStatus";
import BatteryCard from "../components/BatteryCard";
import LocationMap from "../components/LocationMap";
import Navbar from "../components/Navbar";
import SensorCard from "../components/SensorCard";
import SensorChart from "../components/SensorChart";
import { getAlerts, getHistory, getLatest, resolveAlert, sendMockReading } from "../services/localStorage";

export default function Dashboard() {
  const [reading, setReading] = useState(null);
  const [history, setHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [demoMode, setDemoMode] = useState(false);
  const [demoBusy, setDemoBusy] = useState(false);
  const [resolvingId, setResolvingId] = useState("");

  const refresh = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const [latestResult, historyResult, alertsResult] = await Promise.allSettled([
        getLatest(),
        getHistory(),
        getAlerts()
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
      const failure = [historyResult, alertsResult].find((result) => result.status === "rejected");
      if (failure && latestResult.status === "fulfilled") setError(`Some dashboard data could not refresh: ${failure.reason.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh(true);
    const timer = window.setInterval(() => refresh(), 4000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  useEffect(() => {
    if (!demoMode) return undefined;
    let cancelled = false;
    const generate = async () => {
      try {
        await sendMockReading();
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
  }, [demoMode, refresh]);

  async function handleDemoToggle() {
    if (demoMode) {
      setDemoMode(false);
      return;
    }
    setDemoBusy(true);
    try {
      await sendMockReading();
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
      await resolveAlert(id);
      setAlerts((current) => current.filter((alert) => alert._id !== id));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setResolvingId("");
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
      <Navbar online={online} />
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
            <section className="detail-grid">
              <LocationMap latitude={reading.latitude} longitude={reading.longitude} />
              <SensorChart history={history} />
              <AlertPanel alerts={alerts} onResolve={handleResolve} resolvingId={resolvingId} />
            </section>
          </>
        )}
        <footer className="page-footer"><span>SMART BAG MONITORING</span><span>Built for a safer carry.</span></footer>
      </main>
    </div>
  );
}
