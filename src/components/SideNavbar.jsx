import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function SideNavbar({
  activeModuleParam,
  activeFeatureParam,
  mobileOpen,
  onMobileClose,
}) {
  const [activeModule, setActiveModule] = useState(activeModuleParam);
  const [activeFeature, setActiveFeature] = useState(activeFeatureParam);

  const modules = JSON.parse(sessionStorage.getItem("modules") || "[]");
  const features = JSON.parse(sessionStorage.getItem("features") || "[]");

  const [collapsed, setCollapsed] = useState(false);
  const [adminOpen, setAdminOpen] = useState(
    activeModuleParam === "administration",
  );

  // Close mobile sidebar when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        mobileOpen &&
        !event.target.closest(".sidebar-modern") &&
        !event.target.closest(".mobile-menu-trigger")
      ) {
        onMobileClose?.();
      }
    }

    if (mobileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [mobileOpen, onMobileClose]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  function toggleNavState(module, feature) {
    setActiveModule(module);
    setActiveFeature(feature);
    // Close mobile sidebar when navigating
    if (window.innerWidth < 1024) {
      onMobileClose?.();
    }
  }

  const isAdministrationVisible =
    modules.includes("PE-1") &&
    (features.includes("PE-1") ||
      features.includes("PE-2") ||
      features.includes("PE-3") ||
      features.includes("PE-5"));

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`sidebar-backdrop ${mobileOpen ? "active" : ""}`}
        onClick={onMobileClose}
      />

      <aside
        className={`sidebar-modern ${collapsed ? "collapsed" : "expanded"} ${
          mobileOpen ? "mobile-open" : ""
        }`}
      >
        <button
          className="sidebar-toggle-pill"
          onClick={() => setCollapsed((v) => !v)}
          aria-label="Toggle sidebar"
        >
          <i
            className={`fa-solid fa-chevron-${collapsed ? "right" : "left"}`}
          ></i>
        </button>

        <div className="sidebar-inner">
          <nav className="sidebar-nav">
            {isAdministrationVisible && (
              <div className="sidebar-group">
                <button
                  className={`sidebar-group-toggle ${adminOpen ? "open" : ""}`}
                  onClick={() => setAdminOpen((v) => !v)}
                  data-tooltip="Administration"
                >
                  <i className="fa-solid fa-users-gear"></i>
                  <span className="label">Administration</span>
                  <i
                    className={`fa-solid fa-chevron-${adminOpen ? "up" : "down"} caret`}
                  />
                </button>
                <div
                  className={`sidebar-group-content ${adminOpen ? "open" : ""}`}
                >
                  {features.includes("PE-1") && (
                    <Link
                      to="/users"
                      className={`sidebar-subitem ${activeFeature === "users" ? "active" : ""}`}
                      onClick={() => toggleNavState("administration", "users")}
                      data-tooltip="Users"
                    >
                      <i className="fa-solid fa-user"></i>
                      <span className="label">Users</span>
                    </Link>
                  )}
                  {(features.includes("PE-2") || features.includes("PE-3")) && (
                    <Link
                      to="/usergroups"
                      className={`sidebar-subitem ${activeFeature === "usergroups" ? "active" : ""}`}
                      onClick={() =>
                        toggleNavState("administration", "usergroups")
                      }
                      data-tooltip="User Groups"
                    >
                      <i className="fa-solid fa-user-group"></i>
                      <span className="label">User Groups</span>
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Settings intentionally removed from sidebar */}
          </nav>
        </div>
      </aside>
    </>
  );
}
