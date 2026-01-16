import React from "react";

export default function FullscreenThrobber({ throbberAlignment }) {
  return (
    <>
      <div
        className={`throbber-fs-bg  ${
          throbberAlignment === "content-center"
            ? "throbber-fs-content-center"
            : ""
        }`}
      >
        <div className="row h-100 justify-content-center">
          <div className="col text-center align-self-start">
            <div className={"throbber-fs-content rounded-pill"}>
              <span className="spinner-border throbber-fs" role="status"></span>
              <span className="align-bottom">&nbsp;&nbsp;Please Wait...</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
