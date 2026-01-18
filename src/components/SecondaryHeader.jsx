import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../api/administration/authenticationApi";

export default function SecondaryHeader() {
  const fullName = sessionStorage.getItem("fullName");
  const userEmail = sessionStorage.getItem("userEmail");
  const userGroupDescription = sessionStorage.getItem("userGroupDescription");

  // Initialize navigate
  const navigate = useNavigate();

  const [dropdownVisible, setDropdownVisible] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    closeDropdown();
    logout(navigate);
  };

  const toggleDropdown = () => {
    setDropdownVisible((prev) => !prev);
  };

  const closeDropdown = () => {
    setDropdownVisible(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        closeDropdown();
      }
    };

    if (dropdownVisible) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownVisible]);

  return (
    <header className="secondary-header">
      <div className="secondary-brand">
        <img src="/logo.png" alt="Logo" className="brand-logo" />
        <span className="brand-name">Sirima Lanka</span>
      </div>

      <div className="secondary-actions" ref={dropdownRef}>
        <button
          className={`profile-button ${dropdownVisible ? "open" : ""}`}
          type="button"
          onClick={toggleDropdown}
          aria-expanded={dropdownVisible}
        >
          <i className="bx bx-user-circle avatar" aria-hidden="true"></i>
          <span className="profile-name">{fullName}</span>
          <i
            className={`fa-solid fa-chevron-${dropdownVisible ? "up" : "down"}`}
            aria-hidden="true"
          ></i>
        </button>

        {dropdownVisible && (
          <div className="profile-menu" role="menu">
            <div className="profile-meta">
              <div className="email">{userEmail}</div>
              <div className="group">{userGroupDescription}</div>
            </div>
            <div className="profile-divider" />
            <button
              className="profile-item"
              type="button"
              onClick={() => {
                closeDropdown();
                navigate("/settings");
              }}
            >
              <i className="bx bx-cog"></i>
              <span>Settings</span>
            </button>
            <button
              className="profile-item danger"
              type="button"
              onClick={handleLogout}
            >
              <i className="bx bx-log-out"></i>
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
