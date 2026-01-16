import React, { useEffect, useState } from "react";
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react";

const ServerMessageToast = ({ message, id }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    setTimeout(() => setIsVisible(true), 10);

    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      setIsLeaving(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  // Determine toast type and styling
  const getToastConfig = () => {
    if (!message)
      return {
        type: "info",
        icon: Info,
        bgColor: "bg-blue-500",
        borderColor: "border-blue-400",
        message: "Notification",
      };

    const messageText = message.text || message.message || message;
    const success = message.success !== undefined ? message.success : false;

    if (success) {
      return {
        type: "success",
        icon: CheckCircle,
        bgColor: "bg-emerald-500",
        borderColor: "border-emerald-400",
        message: messageText,
      };
    } else {
      return {
        type: "error",
        icon: XCircle,
        bgColor: "bg-rose-500",
        borderColor: "border-rose-400",
        message: messageText,
      };
    }
  };

  const config = getToastConfig();
  const Icon = config.icon;

  return (
    <div
      className={`
        toast-container
        ${isVisible && !isLeaving ? "toast-visible" : "toast-hidden"}
      `}
      style={{
        position: "fixed",
        top: "1rem",
        right: "1rem",
        zIndex: 9999,
        minWidth: "320px",
        maxWidth: "28rem",
        transform:
          isVisible && !isLeaving ? "translateX(0)" : "translateX(100%)",
        opacity: isVisible && !isLeaving ? 1 : 0,
        transition: "all 0.3s ease-out",
      }}
    >
      <div
        className={`toast-content ${config.type}`}
        style={{
          backgroundColor: config.type === "success" ? "#10b981" : "#ef4444",
          borderLeft: `4px solid ${
            config.type === "success" ? "#059669" : "#dc2626"
          }`,
          borderRadius: "0.5rem",
          boxShadow:
            "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "0.75rem",
            padding: "1rem",
          }}
        >
          {/* Icon */}
          <div style={{ flexShrink: 0, marginTop: "0.125rem" }}>
            <Icon
              style={{ width: "1.25rem", height: "1.25rem", color: "white" }}
            />
          </div>

          {/* Message Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: "0.875rem",
                fontWeight: 500,
                color: "white",
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              {config.message}
            </p>
          </div>

          {/* Close Button */}
          <button
            onClick={() => setIsLeaving(true)}
            style={{
              flexShrink: 0,
              color: "white",
              background: "transparent",
              border: "none",
              borderRadius: "0.375rem",
              padding: "0.25rem",
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor =
                "rgba(255, 255, 255, 0.2)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
            aria-label="Close notification"
          >
            <X style={{ width: "1rem", height: "1rem" }} />
          </button>
        </div>

        {/* Progress Bar */}
        <div
          style={{
            height: "4px",
            backgroundColor: "rgba(0, 0, 0, 0.2)",
            overflow: "hidden",
          }}
        >
          <div
            className="toast-progress"
            style={{
              height: "100%",
              backgroundColor: "rgba(255, 255, 255, 0.4)",
              animation: "shrink 5s linear forwards",
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
};

export default ServerMessageToast;
