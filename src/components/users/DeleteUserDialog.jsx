import React, { useEffect } from "react";
import {
  X,
  User,
  Mail,
  Shield,
  Calendar,
  UserPlus,
  Edit,
  Trash2,
} from "lucide-react";
import { Form } from "react-router-dom";

function groupClassName(groupKey) {
  const key = (groupKey || "USER").toUpperCase();
  if (key.includes("ADMIN")) return "app-group-chip app-group--admin";
  if (key.includes("MANAGER")) return "app-group-chip app-group--manager";
  if (key.includes("MODERATOR")) return "app-group-chip app-group--moderator";
  return "app-group-chip app-group--user";
}

export default function DeleteUserDialog({
  isOpen,
  onClose,
  user,
  isSubmitting,
}) {
  useEffect(() => {
    if (isOpen) document.body.classList.add("no-scroll");
    return () => document.body.classList.remove("no-scroll");
  }, [isOpen]);

  if (!isOpen || !user) return null;

  const createdDate = user.created || "";
  const createdBy = user.createdBy || "";
  const lastModifiedDate = user.lastModified || "";
  const lastModifiedBy = user.lastModifiedBy || "";
  const groupKey = (user.userGroup || "USER").toUpperCase();

  return (
    <div className="app-dialog-overlay" role="dialog" aria-modal="true">
      <div className="app-dialog">
        <div className="app-dialog__header">
          <div>
            <h2 className="app-dialog__title">Confirm Delete</h2>
            <p className="app-dialog__subtitle">
              Please review the details before deleting
            </p>
          </div>
          <button
            className="app-dialog__close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="app-dialog__body">
          {/* Danger banner */}
          <div
            className="app-section"
            style={{ borderColor: "#fecaca", background: "#fee2e2" }}
          >
            <div
              className="app-section__icon"
              style={{ background: "#fecaca", color: "#dc2626" }}
            >
              <Trash2 size={18} />
            </div>
            <div className="user-section__content">
              <p className="app-section__label">This action is irreversible</p>
              <p className="app-section__value">
                Deleting this user will permanently remove their account.
              </p>
            </div>
          </div>

          {/* User summary */}
          <div className="app-section">
            <div className="app-section__icon icon-blue">
              <User size={18} />
            </div>
            <div className="user-section__content">
              <p className="app-section__label">User ID</p>
              <p className="app-section__value">{user.id}</p>
            </div>
          </div>

          <div className="app-section">
            <div className="app-section__icon icon-purple">
              <User size={18} />
            </div>
            <div className="user-section__content">
              <p className="app-section__label">Full Name</p>
              <p className="app-section__value">{user.fullName}</p>
            </div>
          </div>

          <div className="app-section">
            <div className="app-section__icon icon-green">
              <Mail size={18} />
            </div>
            <div className="user-section__content">
              <p className="app-section__label">Email</p>
              <p className="app-section__value app-section__value--break">
                {user.email}
              </p>
            </div>
          </div>

          <div className="app-section">
            <div className="app-section__icon icon-amber">
              <Shield size={18} />
            </div>
            <div className="user-section__content">
              <p className="app-section__label">User Group</p>
              <span className={groupClassName(groupKey)}>{groupKey}</span>
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

        <div className="app-dialog__footer" style={{ gap: "8px" }}>
          <button
            className="app-dialog__close-btn"
            type="button"
            onClick={onClose}
          >
            Cancel
          </button>
          <Form method="post">
            <input
              type="hidden"
              name="userId"
              value={user.id}
              readOnly={true}
            />
            <input
              type="hidden"
              name="batchNo"
              value={user.batchNo || ""}
              readOnly={true}
            />
            <input
              type="hidden"
              name="formType"
              value="deleteUser"
              readOnly={true}
            />
            <button
              type="submit"
              className="app-dialog__delete-btn"
              disabled={isSubmitting}
            >
              <Trash2 size={16} style={{ marginRight: 6 }} />
              {isSubmitting ? "Submitting..." : "Delete User"}
            </button>
          </Form>
        </div>
      </div>
    </div>
  );
}
