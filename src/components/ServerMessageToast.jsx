// ServerMessageToast.jsx
import React, { useEffect, useState } from "react";
import { CheckCircle, XCircle, X } from "lucide-react";

const ServerMessageToast = ({ message, id, onRemove, index }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    setTimeout(() => setIsVisible(true), 10);

    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      handleClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      if (onRemove) onRemove(id);
    }, 300);
  };

  // Skip rendering when message is missing to avoid empty notifications
  if (!message) {
    return null;
  }

  // Determine toast type and styling
  const getToastConfig = () => {
    const messageText = message.text || message.message || message;
    const success = message.success !== undefined ? message.success : false;

    if (success) {
      return {
        type: "success",
        icon: CheckCircle,
        message: messageText,
      };
    } else {
      return {
        type: "error",
        icon: XCircle,
        message: messageText,
      };
    }
  };

  const config = getToastConfig();
  const Icon = config.icon;

  return (
    <div
      className={`toast-container ${isVisible && !isLeaving ? "toast-visible" : "toast-hidden"}`}
      style={{ top: `${1 + index * 5.5}rem` }}
    >
      <div className={`toast-content toast-${config.type}`}>
        <div className="toast-body">
          {/* Icon */}
          <div className="toast-icon">
            <Icon size={20} />
          </div>

          {/* Message Content */}
          <div className="toast-message">
            <p>{config.message}</p>
          </div>

          {/* Close Button */}
          <button
            onClick={handleClose}
            className="toast-close"
            aria-label="Close notification"
          >
            <X size={16} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="toast-progress-container">
          <div className="toast-progress-bar" />
        </div>
      </div>
    </div>
  );
};

export default ServerMessageToast;
