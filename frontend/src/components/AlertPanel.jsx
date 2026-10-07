import React from "react";
import { Check, CircleAlert, ShieldAlert, Thermometer, Weight, Zap } from "lucide-react";

const alertIcons = {
  MOTION: ShieldAlert,
  LOW_BATTERY: Zap,
  EXCESSIVE_WEIGHT: Weight,
  HIGH_TEMPERATURE: Thermometer,
  BAG_OPENED: CircleAlert
};

export default function AlertPanel({ alerts, onResolve, resolvingId }) {
  return (
    <section className="panel alerts-panel">
      <div className="panel-heading">
        <div><span className="eyebrow">BAG ACTIVITY</span><h2>Recent alerts</h2></div>
        <span className="count-badge">{alerts.length}</span>
      </div>
      <div className="alert-list">
        {alerts.length === 0 ? (
          <div className="empty-state"><span className="empty-icon"><Check size={18} /></span><div><strong>All clear</strong><p>No active alerts for your bag.</p></div></div>
        ) : alerts.map((alert) => {
          const Icon = alertIcons[alert.type] || CircleAlert;
          return (
            <article className="alert-item" key={alert._id}>
              <span className={`alert-icon severity-${alert.severity}`}><Icon size={17} /></span>
              <div className="alert-copy"><strong>{alert.message}</strong><span>{new Date(alert.timestamp).toLocaleString()}</span></div>
              <button className="resolve-button" onClick={() => onResolve(alert._id)} disabled={resolvingId === alert._id} title="Resolve alert" aria-label="Resolve alert"><Check size={16} /></button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
