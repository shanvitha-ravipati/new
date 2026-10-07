import React from "react";
import { Activity, Backpack } from "lucide-react";

export default function Navbar({ online }) {
  return (
    <header className="topbar">
      <a className="brand" href="#dashboard" aria-label="Smart Bag dashboard">
        <span className="brand-icon"><Backpack size={23} /></span>
        <span><strong>Smart Bag</strong><small>MONITORING SYSTEM</small></span>
      </a>
      <div className={`connection-pill ${online ? "is-online" : "is-offline"}`}>
        <Activity size={15} />
        <span>{online ? "SYSTEM ONLINE" : "BAG OFFLINE"}</span>
      </div>
    </header>
  );
}
