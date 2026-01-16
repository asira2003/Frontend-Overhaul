import React, { useEffect } from "react";
import logo from "../assets/images/logo/logo.png";

export default function PrimaryHeader() {
  return (
    // <header className="header header-secondary">
    //   <img src={logo} className="logo" alt="Logo" />

    //   <div className="main main-secondary">
    //    <div className="comp-name">Sirima Lanka (Pvt) Ltd</div>
    //   </div>
    // </header>
    <nav className="navbar-portal logged">
      <img src="/logo.png" alt="pwe-logo" className="logo" />

      <div className="main main-secondary">
        <div className="comp-name fw-bold">Sirima Lanka (Pvt) Ltd</div>
      </div>
    </nav>
  );
}
