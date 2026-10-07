import React from "react";
import { LockKeyhole, ShieldAlert, ShieldCheck, UnlockKeyhole } from "lucide-react";

export function BagStatus({ status }) {
  const isOpen = status === "OPEN";
  const Icon = isOpen ? UnlockKeyhole : LockKeyhole;
  return (
    <article className={`sensor-card status-card ${isOpen ? "tone-orange" : "tone-green"}`}>
      <div className="card-topline"><span className="metric-icon"><Icon size={20} /></span><span className="metric-label">BAG STATUS</span></div>
      <div className="status-value">{status}</div>
      <div className="metric-detail">{isOpen ? "Bag is currently open" : "Bag is securely closed"}</div>
    </article>
  );
}

export function SecurityCard({ motion }) {
  const active = Boolean(motion);
  const Icon = active ? ShieldAlert : ShieldCheck;
  return (
    <article className={`sensor-card status-card ${active ? "tone-red" : "tone-green"}`}>
      <div className="card-topline"><span className="metric-icon"><Icon size={20} /></span><span className="metric-label">SECURITY</span></div>
      <div className="status-value">{active ? "MOTION" : "SAFE"}</div>
      <div className={`metric-detail ${active ? "warning-text" : ""}`}>{active ? "Motion detected — check your bag" : "No unusual movement detected"}</div>
    </article>
  );
}
