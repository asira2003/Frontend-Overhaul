import React from "react";
import "../styles/header-footer.css";
import logo from "../assets/images/logo/logo.png";

export default function PrimaryHeader() {
  return (
    <header
      className="primary-header"
      role="banner"
      aria-label="Primary header"
    >
      <div className="primary-header-inner">
        <div className="brand">
          <div className="brand-icon" aria-hidden="true">
            <img src="/logo.png" alt="Logo" />
          </div>
          <div className="brand-text">
            <div className="brand-title">Sirima Lanka (Pvt) Ltd</div>
            <div className="brand-sub">Admin Console</div>
          </div>
        </div>
        <div className="header-actions" aria-hidden="true">
          {/* reserved for user avatar / quick links */}
        </div>
      </div>
    </header>
  );
}
