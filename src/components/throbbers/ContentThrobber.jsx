import React from "react";

export default function ContentThrobber({ label = "Loading...", size = "md" }) {
  return (
    <div className="content-throbber" role="status" aria-live="polite">
      <span className={`throbber-spinner ${size}`} aria-hidden="true" />
      {label && <span className="throbber-label">{label}</span>}
    </div>
  );
}
