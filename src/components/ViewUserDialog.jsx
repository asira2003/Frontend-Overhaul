import React, { useEffect } from "react";
import { X, User, Mail, Shield, Calendar, UserPlus, Edit } from "lucide-react";

function groupClassName(groupKey) {
  const key = (groupKey || "USER").toUpperCase();
  if (key.includes("ADMIN")) return "user-group-chip user-group--admin";
  if (key.includes("MANAGER")) return "user-group-chip user-group--manager";
  if (key.includes("MODERATOR")) return "user-group-chip user-group--moderator";
  return "user-group-chip user-group--user";
}

export default function ViewUserDialog({ isOpen, onClose, user }) {
  // lock background scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("no-scroll");
    }
    return () => {
      document.body.classList.remove("no-scroll");
    };
  }, [isOpen]);

  if (!isOpen || !user) return null;

  const createdDate = user.created || "";
  const createdBy = user.createdBy || "";
  const lastModifiedDate = user.lastModified || "";
  const lastModifiedBy = user.lastModifiedBy || "";
  const groupKey = (user.userGroup || "USER").toUpperCase();

  const handleClose = () => {
    onClose();
  };

  return (
    <div className="user-dialog-overlay" role="dialog" aria-modal="true">
      <div className="user-dialog">
        <div className="user-dialog__header">
          <div className="user-dialog__header-left">
            <h2 className="user-dialog__title">User Details</h2>
            <p className="user-dialog__subtitle">
              Complete information about this user
            </p>
          </div>
          <button
            className="user-dialog__close"
            onClick={handleClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="user-dialog__body">
          {/* User ID */}
          <div className="user-section">
            <div className="user-section__icon icon-blue">
              <User size={18} />
            </div>
            <div className="user-section__content">
              <p className="user-section__label">User ID</p>
              <p className="user-section__value">{user.id}</p>
            </div>
          </div>

          {/* Full Name */}
          <div className="user-section">
            <div className="user-section__icon icon-purple">
              <User size={18} />
            </div>
            <div className="user-section__content">
              <p className="user-section__label">Full Name</p>
              <p className="user-section__value">{user.fullName}</p>
            </div>
          </div>

          {/* Email */}
          <div className="user-section">
            <div className="user-section__icon icon-green">
              <Mail size={18} />
            </div>
            <div className="user-section__content">
              <p className="user-section__label">Email</p>
              <p className="user-section__value user-section__value--break">
                {user.email}
              </p>
            </div>
          </div>

          {/* User Group */}
          <div className="user-section">
            <div className="user-section__icon icon-amber">
              <Shield size={18} />
            </div>
            <div className="user-section__content">
              <p className="user-section__label">User Group</p>
              <span className={groupClassName(groupKey)}>{groupKey}</span>
            </div>
          </div>

          {/* Timeline */}
          <div className="user-timeline">
            <h3 className="user-timeline__title">
              <Calendar size={16} />
              Timeline
            </h3>

            <div className="user-timeline__grid">
              <div className="timeline-card timeline-card--blue">
                <div className="timeline-card__header">
                  <UserPlus size={14} />
                  <span>Created</span>
                </div>
                <div className="timeline-card__content">
                  <div>
                    <p className="timeline-card__label">Date</p>
                    <p className="timeline-card__value">{createdDate}</p>
                  </div>
                  <div>
                    <p className="timeline-card__label">By</p>
                    <p className="timeline-card__value">{createdBy}</p>
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
                    <p className="timeline-card__value">{lastModifiedDate}</p>
                  </div>
                  <div>
                    <p className="timeline-card__label">By</p>
                    <p className="timeline-card__value">{lastModifiedBy}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="user-dialog__footer">
          <button className="user-dialog__close-btn" onClick={handleClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
