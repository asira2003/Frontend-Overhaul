import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function SideNavbar({ activeModuleParam, activeFeatureParam }) {
  const [activeModule, setActiveModule] = useState(activeModuleParam);
  const [activeFeature, setActiveFeature] = useState(activeFeatureParam);

  const modules = JSON.parse(sessionStorage.getItem("modules") || "[]");
  const features = JSON.parse(sessionStorage.getItem("features") || "[]");

  const [collapsed, setCollapsed] = useState(false);
  const [adminOpen, setAdminOpen] = useState(
    activeModuleParam === "administration",
  );

  function toggleNavState(module, feature) {
    setActiveModule(module);
    setActiveFeature(feature);
  }

  const isAdministrationVisible =
    modules.includes("PE-1") &&
    (features.includes("PE-1") ||
      features.includes("PE-2") ||
      features.includes("PE-3") ||
      features.includes("PE-5"));

  return (
    <aside className={`sidebar-modern ${collapsed ? "collapsed" : "expanded"}`}>
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
  );
}
