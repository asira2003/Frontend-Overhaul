import React from "react";

export default function ContentThrobber() {
  return (
    <div className="throbber-con-bg">
      <div className="row h-100 justify-content-center">
        <div className="col text-center align-self-center">
          <div className="throbber-con-content">
            <span className="spinner-border throbber-con" role="status"></span>
            <span className="align-text-bottom fw-bold">
              &nbsp;&nbsp;Please Wait...
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
