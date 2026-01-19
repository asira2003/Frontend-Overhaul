import React, { Suspense, useEffect, useState } from "react";
import {
  useLoaderData,
  Form,
  useActionData,
  defer,
  Await,
  useNavigation,
} from "react-router-dom";
import { requireAuth } from "../../api/administration/authenticationApi";
import ContentThrobber from "../../components/throbbers/ContentThrobber";
import SessionTimoutError from "../../components/SessionTimeoutError";
import {
  resetPassword,
  searchSettings,
} from "../../api/administration/settingsApi";
import ServerMessageToast from "../../components/ServerMessageToast";
import { validateInputTextNoUpperCase } from "../../utils/StringUtils";

export async function loader() {
  const authentication = requireAuth();
  const settingsDataAPI = await searchSettings();
  return defer({ authentication, settingsDataAPI });
  return null;
}

export async function action({ request }) {
  const formData = await request.formData();
  const formType = formData.get("formType");
  if (formType === "resetPassword") {
    const oldPassword = formData.get("oldPassword");
    const newPassword = formData.get("newPassword");
    const newPasswordRepeat = formData.get("newPasswordRepeat");
    const batchNo = formData.get("batchNo");
    let response = { errors: [] };
    if (oldPassword === null || oldPassword === "") {
      response.errors.push({
        name: "oldPassword",
        message: "Please enter your current password.",
      });
    }
    if (newPassword === null || newPassword === "") {
      response.errors.push({
        name: "newPassword",
        message: "Please enter your new password.",
      });
    } else if (newPasswordRepeat !== newPassword) {
      response.errors.push({
        name: "newPasswordRepeat",
        message: "Passwords did not match. Please try again.",
      });
    }
    if (response.errors.length !== 0) {
      response = { ...response, formType: formType };
      return response;
    } else {
      if (batchNo === null || batchNo === "") {
        return null;
      } else {
        let resetPasswordResponse = await resetPassword(
          newPassword,
          oldPassword,
          batchNo,
        );
        if (resetPasswordResponse !== null) {
          resetPasswordResponse = {
            ...resetPasswordResponse,
            formType: formType,
          };
          return resetPasswordResponse;
        }
        return null;
      }
    }
  }
  return null;
}

export default function Settings() {
  const { authentication, settingsDataAPI } = useLoaderData();
  const [resetPasswordModal, setResetPasswordModal] = useState({
    oldPassword: "",
    newPassword: "",
    newPasswordRepeat: "",
  });
  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
  const response = useActionData();
  const navigation = useNavigation();
  const [errors, setErrors] = useState({
    resetPassword: {
      oldPasswordError: null,
      newPasswordError: null,
      newPasswordRepeatError: null,
    },
  });

  function clearResetPasswordModal() {
    setResetPasswordModal(() => {
      return {
        oldPassword: "",
        newPassword: "",
        newPasswordRepeat: "",
      };
    });
    setErrors(() => {
      return {
        resetPassword: {
          oldPasswordError: null,
          newPasswordError: null,
          newPasswordRepeatError: null,
        },
      };
    });
  }
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    if (resetPasswordModalOpen) document.body.classList.add("no-scroll");
    return () => document.body.classList.remove("no-scroll");
  }, [resetPasswordModalOpen]);

  return (
    <>
      <Suspense fallback={<ContentThrobber />}>
        <Await resolve={authentication}>
          {({ message }) => {
            if (!message.success) {
              return <SessionTimoutError />;
            }
            return (
              <>
                <Await resolve={settingsDataAPI}>
                  {({ data }) => {
                    useEffect(() => {
                      setErrors(() => {
                        return {
                          resetPassword: {
                            oldPasswordError: response?.errors?.filter(
                              (o) => o.name === "oldPassword",
                            ),
                            newPasswordError: response?.errors?.filter(
                              (o) => o.name === "newPassword",
                            ),
                            newPasswordRepeatError: response?.errors?.filter(
                              (o) => o.name === "newPasswordRepeat",
                            ),
                          },
                        };
                      });
                      if (
                        response !== undefined &&
                        response !== null &&
                        response.message !== undefined
                      ) {
                        if (
                          response.formType === "resetPassword" &&
                          response.message.success
                        ) {
                          setResetPasswordModalOpen(false);
                          setTimeout(function () {
                            clearResetPasswordModal();
                          }, 500);
                        }
                      }
                      setToasts((prevToasts) => {
                        const newTosts = prevToasts.map((x) => x);
                        newTosts.unshift(
                          <ServerMessageToast
                            key={prevToasts.length + 1}
                            message={response?.message}
                            id={prevToasts.length + 1}
                          />,
                        );
                        return newTosts;
                      });
                    }, [response]);
                    return (
                      <>
                        {/* Main Section */}
                        <section className="secondary-page">
                          <div className="content">
                            <div className="container">
                              <div className="page-card">
                                <div className="list-header">
                                  <div>
                                    <h2 className="list-title">
                                      Account Settings
                                    </h2>
                                    <p className="list-subtitle">
                                      Manage your account information and
                                      security
                                    </p>
                                  </div>
                                </div>

                                <div className="settings-content">
                                  {/* User Information Card */}
                                  <div className="settings-card">
                                    <div className="settings-card-header">
                                      <i className="fa-solid fa-user-circle"></i>
                                      <h3>Profile Information</h3>
                                    </div>
                                    <div className="settings-card-body">
                                      <div className="settings-info-grid">
                                        <div className="settings-info-item">
                                          <label className="settings-label">
                                            <i className="fa-solid fa-user"></i>
                                            Full Name
                                          </label>
                                          <div className="settings-value">
                                            {data.user.fullName}
                                          </div>
                                        </div>
                                        <div className="settings-info-item">
                                          <label className="settings-label">
                                            <i className="fa-solid fa-id-badge"></i>
                                            User ID
                                          </label>
                                          <div className="settings-value">
                                            {data.user.userId}
                                          </div>
                                        </div>
                                        <div className="settings-info-item">
                                          <label className="settings-label">
                                            <i className="fa-solid fa-envelope"></i>
                                            Email Address
                                          </label>
                                          <div className="settings-value">
                                            {data.user.userEmail}
                                          </div>
                                        </div>
                                        <div className="settings-info-item">
                                          <label className="settings-label">
                                            <i className="fa-solid fa-users"></i>
                                            User Group
                                          </label>
                                          <div className="settings-value">
                                            {
                                              data.user.userGroup
                                                .userGroupDescription
                                            }
                                            <span className="settings-value-secondary">
                                              (ID:{" "}
                                              {data.user.userGroup.userGroupId})
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Security Settings Card */}
                                  <div className="settings-card">
                                    <div className="settings-card-header">
                                      <i className="fa-solid fa-shield-halved"></i>
                                      <h3>Security Settings</h3>
                                    </div>
                                    <div className="settings-card-body">
                                      <div className="settings-action-item">
                                        <div className="settings-action-info">
                                          <div className="settings-action-title">
                                            <i className="fa-solid fa-key"></i>
                                            Password
                                          </div>
                                          <div className="settings-action-description">
                                            Update your password to keep your
                                            account secure
                                          </div>
                                        </div>
                                        <button
                                          type="button"
                                          className="list-add-btn"
                                          onClick={() =>
                                            setResetPasswordModalOpen(true)
                                          }
                                        >
                                          <i className="fa-solid fa-key"></i>
                                          Change Password
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </section>
                        {/* Reset Password Modal */}
                        {resetPasswordModalOpen && (
                          <div
                            className="app-dialog-overlay"
                            role="dialog"
                            aria-modal="true"
                          >
                            <div className="app-dialog">
                              <div className="app-dialog__header">
                                <div>
                                  <h2 className="app-dialog__title">
                                    Change Password
                                  </h2>
                                  <p className="app-dialog__subtitle">
                                    {data.user.fullName} ({data.user.userId})
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  className="app-dialog__close"
                                  onClick={() => {
                                    setResetPasswordModalOpen(false);
                                    clearResetPasswordModal();
                                  }}
                                  disabled={navigation.state === "submitting"}
                                  aria-label="Close"
                                >
                                  <i className="fa-solid fa-xmark"></i>
                                </button>
                              </div>

                              <div className="app-dialog__body">
                                <Form
                                  id="resetPasswordForm"
                                  method="POST"
                                  className="app-form"
                                >
                                  {/* Current Password */}
                                  <div className="app-field">
                                    <label
                                      htmlFor="oldPassword"
                                      className="app-label"
                                    >
                                      <i className="fa-solid fa-lock"></i>
                                      <span>Current Password</span>
                                    </label>
                                    <input
                                      type="password"
                                      className="app-input"
                                      id="oldPassword"
                                      name="oldPassword"
                                      placeholder="Enter your current password"
                                      disabled={
                                        navigation.state === "submitting"
                                      }
                                      value={resetPasswordModal.oldPassword}
                                      onChange={(event) => {
                                        setResetPasswordModal(
                                          (prevResetPasswordModal) => {
                                            return {
                                              ...prevResetPasswordModal,
                                              oldPassword:
                                                validateInputTextNoUpperCase(
                                                  event.target.value,
                                                ),
                                            };
                                          },
                                        );
                                      }}
                                    />
                                    {errors.resetPassword.oldPasswordError &&
                                      errors.resetPassword.oldPasswordError
                                        .length > 0 && (
                                        <div className="app-error">
                                          {
                                            errors.resetPassword
                                              .oldPasswordError[0].message
                                          }
                                        </div>
                                      )}
                                  </div>

                                  {/* New Password */}
                                  <div className="app-field">
                                    <label
                                      htmlFor="newPassword"
                                      className="app-label"
                                    >
                                      <i className="fa-solid fa-lock"></i>
                                      <span>New Password</span>
                                    </label>
                                    <input
                                      type="password"
                                      className="app-input"
                                      id="newPassword"
                                      name="newPassword"
                                      placeholder="Enter your new password"
                                      disabled={
                                        navigation.state === "submitting"
                                      }
                                      value={resetPasswordModal.newPassword}
                                      onChange={(event) => {
                                        setResetPasswordModal(
                                          (prevResetPasswordModal) => {
                                            return {
                                              ...prevResetPasswordModal,
                                              newPassword:
                                                validateInputTextNoUpperCase(
                                                  event.target.value,
                                                ),
                                            };
                                          },
                                        );
                                      }}
                                    />
                                    {errors.resetPassword.newPasswordError &&
                                      errors.resetPassword.newPasswordError
                                        .length > 0 && (
                                        <div className="app-error">
                                          {
                                            errors.resetPassword
                                              .newPasswordError[0].message
                                          }
                                        </div>
                                      )}
                                  </div>

                                  {/* Confirm New Password */}
                                  <div className="app-field">
                                    <label
                                      htmlFor="newPasswordRepeat"
                                      className="app-label"
                                    >
                                      <i className="fa-solid fa-lock"></i>
                                      <span>Confirm New Password</span>
                                    </label>
                                    <input
                                      type="password"
                                      className="app-input"
                                      id="newPasswordRepeat"
                                      name="newPasswordRepeat"
                                      placeholder="Re-enter your new password"
                                      disabled={
                                        navigation.state === "submitting"
                                      }
                                      value={
                                        resetPasswordModal.newPasswordRepeat
                                      }
                                      onChange={(event) => {
                                        setResetPasswordModal(
                                          (prevResetPasswordModal) => {
                                            return {
                                              ...prevResetPasswordModal,
                                              newPasswordRepeat:
                                                validateInputTextNoUpperCase(
                                                  event.target.value,
                                                ),
                                            };
                                          },
                                        );
                                      }}
                                    />
                                    {errors.resetPassword
                                      .newPasswordRepeatError &&
                                      errors.resetPassword
                                        .newPasswordRepeatError.length > 0 && (
                                        <div className="app-error">
                                          {
                                            errors.resetPassword
                                              .newPasswordRepeatError[0].message
                                          }
                                        </div>
                                      )}
                                  </div>

                                  <input
                                    type="hidden"
                                    name="formType"
                                    value="resetPassword"
                                    readOnly={true}
                                  />
                                  <input
                                    type="hidden"
                                    name="batchNo"
                                    value={data.user.batchNo}
                                    readOnly={true}
                                  />

                                  <div className="app-actions">
                                    <button
                                      type="button"
                                      className="app-dialog__close-btn"
                                      onClick={() => {
                                        setResetPasswordModalOpen(false);
                                        clearResetPasswordModal();
                                      }}
                                      disabled={
                                        navigation.state === "submitting"
                                      }
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="submit"
                                      className="app-btn app-btn--primary"
                                      disabled={
                                        navigation.state === "submitting"
                                      }
                                    >
                                      <i
                                        className="fa-solid fa-key"
                                        style={{ marginRight: 6 }}
                                      ></i>
                                      {navigation.state === "submitting"
                                        ? "Updating..."
                                        : "Change Password"}
                                    </button>
                                  </div>
                                </Form>
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="toast-container toast-positioner">
                          {toasts}
                        </div>
                      </>
                    );
                  }}
                </Await>
              </>
            );
          }}
        </Await>
      </Suspense>
    </>
  );
}
