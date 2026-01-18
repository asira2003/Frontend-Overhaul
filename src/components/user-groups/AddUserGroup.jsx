import React, { useEffect } from "react";
import { Form, useNavigation } from "react-router-dom";
import { X, Shield, Clock, Plus } from "lucide-react";
import { validateInputText } from "../../utils/StringUtils";

export default function AddUserGroup({
  isOpen,
  onClose,
  modal,
  setModal,
  modulePrivilegesChecklist,
  modulePrivileges,
  errors,
}) {
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";

  useEffect(() => {
    if (isOpen) document.body.classList.add("no-scroll");
    return () => document.body.classList.remove("no-scroll");
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="app-dialog-overlay" role="dialog" aria-modal="true">
      <div className="app-dialog app-dialog--lg">
        {/* Header */}
        <div className="app-dialog__header">
          <div>
            <h2 className="app-dialog__title">User Groups Management | Add</h2>
            <p className="app-dialog__subtitle">
              Create a new user group and assign privileges
            </p>
          </div>

          <button
            className="app-dialog__close"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="app-dialog__body">
          <Form id="addUserGroupForm" method="post" className="app-form">
            {/* User Group Name */}
            <div className="app-field">
              <label htmlFor="adduserGroupDescription" className="app-label">
                <Shield size={16} />
                <span>User Group Name</span>
              </label>

              <input
                type="text"
                id="adduserGroupDescription"
                name="userGroupDescription"
                className="app-input"
                disabled={submitting}
                value={modal.userGroupDescription || ""}
                onChange={(event) => {
                  setModal((prev) => ({
                    ...prev,
                    userGroupDescription: validateInputText(event.target.value),
                  }));
                }}
              />

              {errors?.add?.adduserGroupDescriptionError?.length > 0 && (
                <div className="app-error">
                  {errors.add.adduserGroupDescriptionError[0].message}
                </div>
              )}
            </div>

            {/* Access Duration */}
            <div className="app-field">
              <label htmlFor="adduserGroupAccessDuration" className="app-label">
                <Clock size={16} />
                <span>Access Duration (minutes)</span>
              </label>

              <div className="app-input-group">
                <input
                  type="number"
                  min="0"
                  step="1"
                  id="adduserGroupAccessDuration"
                  name="accessDuration"
                  className="app-input"
                  disabled={submitting}
                  value={modal.accessDuration || ""}
                  onChange={(event) => {
                    setModal((prev) => ({
                      ...prev,
                      accessDuration: event.target.value,
                    }));
                  }}
                />
                <span className="app-input-addon">minutes</span>
              </div>

              {errors?.add?.addAccessDurationError?.length > 0 && (
                <div className="app-error">
                  {errors.add.addAccessDurationError[0].message}
                </div>
              )}
            </div>

            {/* Module Privileges */}
            <div className="app-field">
              <label className="app-label">
                <Shield size={16} />
                <span>Module Privileges</span>
              </label>

              <div className="app-table-wrapper">
                <table className="app-table">
                  <thead>
                    <tr>
                      <th>Module</th>
                      <th>Privileges Granted</th>
                    </tr>
                  </thead>
                  <tbody>{modulePrivilegesChecklist}</tbody>
                </table>
              </div>
            </div>

            {/* Hidden fields */}
            <input type="hidden" name="formType" value="addUserGroup" />
            <input
              type="hidden"
              name="modulePrivileges"
              value={JSON.stringify(modulePrivileges)}
            />
          </Form>
        </div>

        {/* Footer */}
        <div className="app-dialog__footer">
          <button
            type="button"
            className="app-btn app-btn--secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>

          <button
            type="submit"
            form="addUserGroupForm"
            className="app-btn app-btn--primary"
            disabled={submitting}
          >
            <Plus size={16} style={{ marginRight: 6 }} />
            {submitting ? "Submitting..." : "Add New User Group"}
          </button>
        </div>
      </div>
    </div>
  );
}
