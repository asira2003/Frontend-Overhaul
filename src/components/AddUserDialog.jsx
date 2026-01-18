import React, { useEffect } from "react";
import { Form, useNavigation } from "react-router-dom";
import { X, User, Mail, Shield, Lock, UserPlus } from "lucide-react";
import { validateInputTextNoUpperCase } from "../utils/StringUtils";

export default function AddUserDialog({
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
            <h2 className="app-dialog__title">Add New User</h2>
            <p className="app-dialog__subtitle">
              Create a new user account in the system
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
          <Form id="addUsersForm" method="post" className="app-form">
            {/* Full Name */}
            <div className="app-field">
              <label htmlFor="addfullName" className="app-label">
                <User size={16} />
                <span>Full Name</span>
              </label>
              <input
                type="text"
                id="addfullName"
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
              {errors?.add?.addFullNameError?.length > 0 && (
                <div className="app-error">
                  {errors.add.addFullNameError[0].message}
                </div>
              )}
            </div>

            {/* Email */}
            <div className="app-field">
              <label htmlFor="addemail" className="app-label">
                <Mail size={16} />
                <span>Email</span>
              </label>
              <input
                type="text"
                id="addemail"
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
              {errors?.add?.adduserEmailError?.length > 0 && (
                <div className="app-error">
                  {errors.add.adduserEmailError[0].message}
                </div>
              )}
            </div>

            {/* User Group */}
            <div className="app-field">
              <label htmlFor="adduserGroup" className="app-label">
                <Shield size={16} />
                <span>User Group</span>
              </label>
              <select
                id="adduserGroup"
                name="userGroupId"
                className="app-select"
                value={modal.userGroupId || ""}
                disabled={submitting}
                onChange={(event) => {
                  setModal((prev) => ({
                    ...prev,
                    userGroupId: event.target.value,
                  }));
                }}
              >
                <option disabled value=""></option>
                {userGroupOptions}
              </select>
              {errors?.add?.adduserGroupIdError?.length > 0 && (
                <div className="app-error">
                  {errors.add.adduserGroupIdError[0].message}
                </div>
              )}
            </div>

            {/* Password */}
            <div className="app-field">
              <label htmlFor="addPassword" className="app-label">
                <Lock size={16} />
                <span>Account Password</span>
              </label>
              <input
                type="password"
                autoComplete="off"
                id="addPassword"
                name="password"
                className="app-input"
                disabled={submitting}
                value={modal.hidden?.password || ""}
                onChange={(event) => {
                  setModal((prev) => ({
                    ...prev,
                    hidden: {
                      ...prev.hidden,
                      password: validateInputTextNoUpperCase(
                        event.target.value,
                      ),
                    },
                  }));
                }}
                placeholder="Enter secure password"
              />
              {errors?.add?.addPasswordError?.length > 0 && (
                <div className="app-error">
                  {errors.add.addPasswordError[0].message}
                </div>
              )}
              <div className="app-helper">
                The account password can only be administratively set{" "}
                <strong>during account creation</strong>.
              </div>
            </div>

            <input
              type="hidden"
              name="formType"
              value="addUser"
              readOnly={true}
            />

            <div className="app-actions">
              <button
                type="button"
                className="app-dialog__close-btn"
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
                <UserPlus size={16} style={{ marginRight: 6 }} />
                {submitting ? "Submitting..." : "Add New User"}
              </button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}
