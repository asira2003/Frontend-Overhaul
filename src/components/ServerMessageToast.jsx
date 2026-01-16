import React, { useEffect, useRef } from "react";

export default function ServerMessageToast({ message, id }) {
  useEffect(() => {
    function sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }
    sleep(5000).then(() => {
      document.getElementById(id).classList?.add("hide");
      document.getElementById(id).classList?.remove("show");
    });
  }, [id]);

  return (
    <>
      <div
        id={id}
        className={`toast ${message == null ? "hide" : "show"}`}
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        data-bs-delay="5000"
      >
        <div
          className={`toast-header toast-header-positioner ${
            message !== undefined
              ? message.success
                ? "bg-success-subtle"
                : "bg-danger-subtle"
              : ""
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="bi bi-exclamation-triangle-fill flex-shrink-0 me-2 toast-img"
            viewBox="0 0 16 16"
            role="img"
            aria-label="Warning:"
          >
            <path
              d={
                message !== undefined
                  ? message.success
                    ? "M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"
                    : "M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"
                  : ""
              }
            />
          </svg>
          <strong className="me-auto">
            {message !== undefined
              ? message.success
                ? "Success"
                : "Failed"
              : ""}
          </strong>
          <button
            type="button"
            className="btn-close"
            data-bs-dismiss="toast"
            aria-label="Close"
          ></button>
        </div>
        <div className="toast-body">
          {message !== undefined ? message.message : ""}
        </div>
      </div>
    </>
  );
}
