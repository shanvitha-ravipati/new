import React from "react";
import { BatteryMedium } from "lucide-react";

export default function BatteryCard({ value, lowThreshold = 20 }) {
  const low = value < lowThreshold;
  return (
    <article className={`sensor-card tone-${low ? "red" : "green"}`}>
      <div className="card-topline">
        <span className="metric-icon"><BatteryMedium size={20} /></span>
        <span className="metric-label">BATTERY</span>
      </div>
      <div className="metric-value">{value}<span>%</span></div>
      <div className="battery-track"><span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>
      <div className={`metric-detail ${low ? "warning-text" : ""}`}>{low ? "Low battery — recharge soon" : "Battery level healthy"}</div>
    </article>
  );
}
