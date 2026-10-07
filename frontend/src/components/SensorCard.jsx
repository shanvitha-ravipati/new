import React from "react";

export default function SensorCard({ icon: Icon, label, value, unit, detail, tone = "blue" }) {
  return (
    <article className={`sensor-card tone-${tone}`}>
      <div className="card-topline">
        <span className="metric-icon"><Icon size={20} strokeWidth={2} /></span>
        <span className="metric-label">{label}</span>
      </div>
      <div className="metric-value">{value}<span>{unit}</span></div>
      <div className="metric-detail">{detail}</div>
    </article>
  );
}
