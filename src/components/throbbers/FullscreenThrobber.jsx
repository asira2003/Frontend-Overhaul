import React from "react";

export default function FullscreenThrobber({
  throbberAlignment = "center",
  message = "Loading...",
}) {
  return (
    <div className={`fullscreen-throbber align-${throbberAlignment}`}>
      <div
        className="fullscreen-throbber-card"
        role="status"
        aria-live="polite"
      >
        <span className="throbber-spinner lg" aria-hidden="true" />
        {message && <p className="throbber-message">{message}</p>}
      </div>
    </div>
  );
}
