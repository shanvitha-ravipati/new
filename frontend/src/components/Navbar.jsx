import React from "react";
import { Activity, Backpack, LogOut } from "lucide-react";

export default function Navbar({ online, userEmail, onSignOut }) {
  return (
    <header className="topbar">
      <a className="brand" href="#dashboard" aria-label="Smart Bag dashboard">
        <span className="brand-icon"><Backpack size={23} /></span>
        <span><strong>Smart Bag</strong><small>MONITORING SYSTEM</small></span>
      </a>
      <div className="navbar-actions">
        <div className={`connection-pill ${online ? "is-online" : "is-offline"}`}>
          <Activity size={15} />
          <span>{online ? "SYSTEM ONLINE" : "BAG OFFLINE"}</span>
        </div>
        <span className="signed-in-email" title={userEmail}>{userEmail}</span>
        <button className="signout-button" onClick={onSignOut} title="Sign out" aria-label="Sign out">
          <LogOut size={16} /><span>Sign out</span>
        </button>
      </div>
    </header>
  );
}
