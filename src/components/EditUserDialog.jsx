import React, { useEffect } from "react";
import { Form, useNavigation } from "react-router-dom";
import { X, User, Mail, Shield } from "lucide-react";
import { validateInputTextNoUpperCase } from "../utils/StringUtils";

export default function EditUserDialog({
  isOpen,
  onClose,
  modal,
  setModal,
  userGroupOptions,
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
      <div className="app-dialog">
        <div className="app-dialog__header">
          <div>
            <h2 className="app-dialog__title">Edit User</h2>
            <p className="app-dialog__subtitle">Update user account details</p>
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
          <Form id="editUsersForm" method="post" className="app-form">
            {/* Full Name */}
            <div className="app-field">
              <label htmlFor="editfullName" className="app-label">
                <User size={16} />
                <span>Full Name</span>
              </label>
              <input
                type="text"
                id="editfullName"
                name="fullName"
                className="app-input"
                disabled={submitting}
                value={modal.fullName || ""}
                onChange={(event) => {
                  setModal((prev) => ({
                    ...prev,
                    fullName: validateInputTextNoUpperCase(event.target.value),
                  }));
                }}
                placeholder="Enter full name"
              />
              {errors?.edit?.editFullNameError?.length > 0 && (
                <div className="app-error">
                  {errors.edit.editFullNameError[0].message}
                </div>
              )}
            </div>

            {/* Email */}
            <div className="app-field">
              <label htmlFor="editemail" className="app-label">
                <Mail size={16} />
                <span>Email</span>
              </label>
              <input
                type="text"
                id="editemail"
                name="userEmail"
                className="app-input"
                disabled={submitting}
                value={modal.userEmail || ""}
                onChange={(event) => {
                  setModal((prev) => ({
                    ...prev,
                    userEmail: validateInputTextNoUpperCase(event.target.value),
                  }));
                }}
                placeholder="Enter email address"
              />
              {errors?.edit?.edituserEmailError?.length > 0 && (
                <div className="app-error">
                  {errors.edit.edituserEmailError[0].message}
                </div>
              )}
            </div>

            {/* User Group */}
            <div className="app-field">
              <label htmlFor="edituserGroup" className="app-label">
                <Shield size={16} />
                <span>User Group</span>
              </label>
              <select
                id="edituserGroup"
                name="userGroupId"
                className="app-select"
                value={modal?.userGroup?.userGroupId || ""}
                disabled={submitting}
                onChange={(event) => {
                  setModal((prev) => ({
                    ...prev,
                    userGroup: {
                      ...prev.userGroup,
                      userGroupId: event.target.value,
                    },
                  }));
                }}
              >
                <option disabled value=""></option>
                {userGroupOptions}
              </select>
              {errors?.edit?.edituserGroupIdError?.length > 0 && (
                <div className="app-error">
                  {errors.edit.edituserGroupIdError[0].message}
                </div>
              )}
            </div>

            {/* Hidden fields */}
            <input type="hidden" name="formType" value="editUser" readOnly={true} />
            <input type="hidden" name="userId" value={modal.userId || ""} readOnly={true} />
            <input type="hidden" name="batchNo" value={modal.batchNo || ""} readOnly={true} />

            <div className="app-actions">
              <button
                type="button"
                className="app-dialog__close-btn"
                id="editUserModalClose"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="app-btn app-btn--primary"
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Save Changes"}
              </button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}
