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
    <nav className="navbar-portal logged">
      <img src="/logo.png" alt="pwe-logo" className="logo" />

      <div className="navbar-portal-right">
        <div className="btn-group" ref={dropdownRef}>
          <button
            className={`navbar-portal-login ${
              dropdownVisible ? "clicked" : ""
            }`}
            type="button"
            onClick={toggleDropdown}
            aria-expanded={dropdownVisible}
          >
            <i className="bx bx-user user-ico"></i>
            {fullName}
            &nbsp;
            <i
              className={`fa-solid fa-angle-${dropdownVisible ? "up" : "down"}`}
            ></i>
          </button>
          {dropdownVisible && (
            <ul className="dropdown-menu-login">
              <div className="customer-email-nav text-end">{userEmail}</div>
              <div className="user-group-des">{userGroupDescription}</div>
              <hr />
              <li className="user-links user-settings"></li>
              <li className="user-links user-link-email ">
                <a href="#" onClick={handleLogout}>
                  <div className="text-center">Logout</div>
                </a>
              </li>
            </ul>
          )}
        </div>
      </div>
    </nav>
  );
}
