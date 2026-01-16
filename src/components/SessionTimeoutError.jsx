import React from "react";
import { NavLink } from "react-router-dom";

export default function SessionTimoutError() {
  return (
    <>
      <div className="content-centered vh-100">
        <div className="container h-100">
          <div className="row h-100 justify-content-center">
            <div className="col align-self-center text-center">
              <h1 className="timeout-heading">Session Timed Out</h1>
              <p className="timeout-paragraph">
                Sorry, your browser session timed out. Please login again to
                continue.
              </p>
              <NavLink to="/login" className="btn btn-theme">
                &nbsp;<i className="fa-solid fa-right-to-bracket"></i>
                &nbsp;&nbsp;Login&nbsp;&nbsp;&nbsp;
              </NavLink>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
