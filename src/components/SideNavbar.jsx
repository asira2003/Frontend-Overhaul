import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/images/logo/logo.png";

export default function SideNavbar({ activeModuleParam, activeFeatureParam }) {
  const [activeModule, setActiveModule] = useState(activeModuleParam);
  const [activeFeature, setActiveFeature] = useState(activeFeatureParam);
  const navigate = useNavigate();

  const modules = JSON.parse(sessionStorage.getItem("modules")) || [];
  const features = JSON.parse(sessionStorage.getItem("features")) || [];

  function toggleNavState(module, feature) {
    setActiveModule(module);
    setActiveFeature(feature);
  }

  const [isSideNavOpen, setIsSideNavOpen] = useState(false);

  const toggleSideNav = () => {
    setIsSideNavOpen(!isSideNavOpen);
  };

  const isAdministrationVisible =
    modules.includes("PE-1") &&
    (features.includes("PE-1") ||
      features.includes("PE-2") ||
      features.includes("PE-3") ||
      features.includes("PE-5"));

  return (
    <>
      <section>
        <div className={`side-bar-icon ${isSideNavOpen ? "opened" : ""}`}>
          <i
            className={`fas fa-angle-right side-icon ${
              isSideNavOpen ? "close" : ""
            }`}
            onClick={toggleSideNav}
          />
        </div>
        <div
          className={`side-navigation-container fixed-top bg-theme-1 border-end ${
            isSideNavOpen ? "side-nav-open" : "side-nav-hidden"
          }`}
        >
          <div className="container side-navigation-positioner">
            <div className="row justify-content-center">
              <div className="col align-self-center text-center">
                <img src={logo} className="img-fluid logo-side" alt="logo" />
              </div>
            </div>
            <div className="row justify-content-center">
              <div className="col align-self-center">
                {isAdministrationVisible && (
                  <div className="accordion-item accordion accordion-flush ">
                    <div className="accordion-header" id="sideNavAccordionHead">
                      <button
                        className={`accordion-button side-navigation-item-group-btn ${
                          activeModule === "administration" ? "" : "collapsed"
                        }`}
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#administration"
                        aria-expanded="false"
                        aria-controls="administration"
                      >
                        <i className="fa-solid fa-users-gear fa-sm"></i>
                        &nbsp;&nbsp;Administration
                      </button>
                    </div>
                    <div
                      id="administration"
                      className={`accordion-collapse collapse side-navigation-item-group ${
                        activeModule === "administration" ? "show" : ""
                      }`}
                      aria-labelledby="administration"
                    >
                      {features.includes("PE-1") && (
                        <div
                          className={`list-group-item list-group-item-action ${
                            activeFeature === "users"
                              ? "side-navigation-item-active"
                              : "side-navigation-item"
                          } side-nav-border-bottom`}
                        >
                          <div className="row">
                            <div className="col">
                              <Link
                                to="users"
                                className="stretched-link link-text-modifer"
                                onClick={() => {
                                  toggleNavState("administration", "users");
                                  toggleSideNav();
                                }}
                              >
                                <i className="fa-solid fa-user fa-sm"></i>
                                &nbsp;&nbsp;Users
                              </Link>
                            </div>
                            <div className="col col-2 text-end">
                              <i className="fa-sharp fa-solid fa-caret-right"></i>
                            </div>
                          </div>
                        </div>
                      )}
                      {(features.includes("PE-2") ||
                        features.includes("PE-3")) && (
                        <div
                          className={`list-group-item list-group-item-action ${
                            activeFeature === "usergroups"
                              ? "side-navigation-item-active"
                              : "side-navigation-item"
                          } side-nav-border-bottom`}
                        >
                          <div className="row">
                            <div className="col">
                              <Link
                                to="usergroups"
                                className="stretched-link link-text-modifer"
                                onClick={() => {
                                  toggleNavState(
                                    "administration",
                                    "usergroups"
                                  );
                                  toggleSideNav();
                                }}
                              >
                                <i className="fa-solid fa-user-group fa-sm"></i>
                                &nbsp;&nbsp;User Groups
                              </Link>
                            </div>
                            <div className="col col-2 text-end">
                              <i className="fa-sharp fa-solid fa-caret-right"></i>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="side-nav-spacer"></div>
                <div className="row justify-content-center side-navigation-positioner-row">
                  <div className="col align-self-center">
                    <div
                      className="accordion accordion-flush"
                      id="sideNavAccordion"
                    >
                      {features.includes("PE-4") && (
                        <div
                          className={`list-group-item list-group-item-action ${
                            activeFeature === "settings"
                              ? "side-navigation-item-active"
                              : "side-navigation-item settings"
                          } side-nav-border-bottom`}
                        >
                          <div className="row">
                            <div className="col text-truncate">
                              <Link
                                to="/settings"
                                className="stretched-link link-text-modifer"
                                onClick={() => {
                                  toggleNavState("settings", "settings");
                                  toggleSideNav();
                                }}
                              >
                                <i className="fa-solid fa-gear"></i>
                                &nbsp;&nbsp;Settings
                              </Link>
                            </div>
                            <div className="col col-3 text-end">
                              <i className="fa-sharp fa-solid fa-caret-right"></i>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {isSideNavOpen && <div className="overlay" onClick={toggleSideNav}></div>}
    </>
  );
}
