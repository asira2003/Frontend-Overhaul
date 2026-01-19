import React, { useEffect } from "react";
import {
  X,
  User,
  Mail,
  Shield,
  Calendar,
  UserPlus,
  Edit,
  Clock,
} from "lucide-react";

function groupClassName(groupKey) {
  const key = (groupKey || "USER").toUpperCase();
  if (key.includes("ADMIN")) return "app-group-chip app-group--admin";
  if (key.includes("MANAGER")) return "app-group-chip app-group--manager";
  if (key.includes("MODERATOR")) return "app-group-chip app-group--moderator";
  return "app-group-chip app-group--user";
}

export default function ViewUserGroup({ isOpen, onClose, data }) {
  // lock background scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("no-scroll");
    }
    return () => {
      document.body.classList.remove("no-scroll");
    };
  }, [isOpen]);

  if (!isOpen || !data) return null;

  const groupKey = (data.userGroupDescription || "USER").toUpperCase();

  const handleClose = () => {
    onClose();
  };

  return (
    <div className="app-dialog-overlay" role="dialog" aria-modal="true">
      <div className="app-dialog">
        <div className="app-dialog__header">
          <div className="user-dialog__header-left">
            <h2 className="app-dialog__title">User Group Details</h2>
            <p className="app-dialog__subtitle">
              Complete information about this user group.
            </p>
          </div>
          <button
            className="app-dialog__close"
            onClick={handleClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="app-dialog__body">
          {/* User ID */}
          <div className="app-section">
            <div className="app-section__icon icon-blue">
              <User size={18} />
            </div>
            <div className="user-section__content">
              <p className="app-section__label">User Group ID</p>
              <p className="app-section__value">{data.userGroupId}</p>
            </div>
          </div>
          {/* User Group Description */}
          <div className="app-section">
            <div className="app-section__icon icon-purple">
              <User size={18} />
            </div>
            <div className="user-section__content">
              <p className="app-section__label">User Group Description</p>
              <span className={groupClassName(groupKey)}>{groupKey}</span>
            </div>
          </div>

          {/* Access Duration */}
          <div className="app-section">
            <div className="app-section__icon icon-green">
              <Clock size={18} />
            </div>
            <div className="user-section__content">
              <p className="app-section__label">Access Duration</p>
              <p className="app-section__value app-section__value--break">
                {data.accessDuration}&#160;minutes
              </p>
            </div>
          </div>

          {/* Timeline */}
          <div className="app-timeline">
            <h3 className="app-timeline__title">
              <Calendar size={16} />
              Timeline
            </h3>

            <div className="app-timeline__grid">
              <div className="timeline-card timeline-card--blue">
                <div className="timeline-card__header">
                  <UserPlus size={14} />
                  <span>Created</span>
                </div>
                <div className="timeline-card__content">
                  <div>
                    <p className="timeline-card__label">Date</p>
                    <p className="timeline-card__value">{data.created}</p>
                  </div>
                  <div>
                    <p className="timeline-card__label">By</p>
                    <p className="timeline-card__value">{data.createdBy}</p>
                  </div>
                </div>
              </div>

              <div className="timeline-card timeline-card--purple">
                <div className="timeline-card__header">
                  <Edit size={14} />
                  <span>Last Modified</span>
                </div>
                <div className="timeline-card__content">
                  <div>
                    <p className="timeline-card__label">Date</p>
                    <p className="timeline-card__value">{data.lastModified}</p>
                  </div>
                  <div>
                    <p className="timeline-card__label">By</p>
                    <p className="timeline-card__value">
                      {data.lastModifiedBy}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="app-dialog__footer">
          <button className="app-dialog__close-btn" onClick={handleClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
