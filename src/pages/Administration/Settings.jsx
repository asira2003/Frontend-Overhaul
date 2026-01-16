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
          batchNo
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
                              (o) => o.name === "oldPassword"
                            ),
                            newPasswordError: response?.errors?.filter(
                              (o) => o.name === "newPassword"
                            ),
                            newPasswordRepeatError: response?.errors?.filter(
                              (o) => o.name === "newPasswordRepeat"
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
                          document.getElementById("resetModalClose").click();
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
                          />
                        );
                        return newTosts;
                      });
                    }, [response]);
                    return (
                      <>
                        {/* Main sction */}
                        <section>
                          <div className="content">
                            <div className="container  settings-page">
                              <div className="col title-grn">
                                <h4 className="page-header user-heading">
                                  Settings
                                </h4>
                              </div>
                              <div className="settings-container">
                                <div className="detail-table">
                                  <div className="email detail">
                                    <div className="label">User</div>
                                    <div className="value">
                                      {data.user.fullName}&nbsp;(
                                      {data.user.userId})
                                    </div>
                                  </div>
                                  <div className="fullName detail">
                                    <div className="label">User Group</div>
                                    <div className="value">
                                      {data.user.userGroup.userGroupDescription}
                                      &nbsp;(
                                      {data.user.userGroup.userGroupId})
                                    </div>
                                  </div>
                                  <div className="fullName detail">
                                    <div className="label">User Email</div>
                                    <div className="value">
                                      {data.user.userEmail}
                                    </div>
                                  </div>

                                  <div className="buttons">
                                    <button
                                      type="button"
                                      className="setting-btn"
                                      data-bs-toggle="modal"
                                      data-bs-target="#resetPasswordModal"
                                    >
                                      <i className="fa-solid fa-key"></i>
                                      &nbsp;Reset&nbsp;Password
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </section>
                        {/* Reset Password Modal */}
                        <div
                          className="modal modal-adjuster fade"
                          id="resetPasswordModal"
                          data-bs-backdrop="static"
                          data-bs-keyboard="false"
                          tabIndex="-1"
                          aria-hidden="true"
                        >
                          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                            <div className="modal-content">
                              <div className="modal-header align-items-start">
                                <div>
                                  <h4 className="page-header">
                                    Account Settings | Password Reset
                                  </h4>
                                  <div className="mt-4 callback-text">
                                    <span className="fw-bold">User: </span>
                                    {data.user.fullName} ({data.user.userId})
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  id="resetModalClose"
                                  className="btn-close"
                                  data-bs-dismiss="modal"
                                  aria-label="Close"
                                  onClick={clearResetPasswordModal}
                                  disabled={navigation.state === "submitting"}
                                ></button>
                              </div>
                              <div className="modal-body">
                                <Form id="resetPasswordForm" method="POST">
                                  <div className="mb-3">
                                    <label
                                      htmlFor="oldPassword"
                                      className="form-label fw-bold"
                                    >
                                      Current Password
                                    </label>
                                    <input
                                      type="password"
                                      className="form-control form-input-mod"
                                      id="oldPassword"
                                      name="oldPassword"
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
                                                  event.target.value
                                                ),
                                            };
                                          }
                                        );
                                      }}
                                    />
                                    {errors.resetPassword.oldPasswordError &&
                                      errors.resetPassword.oldPasswordError
                                        .length > 0 && (
                                        <div className="text-danger">
                                          {
                                            errors.resetPassword
                                              .oldPasswordError[0].message
                                          }
                                        </div>
                                      )}
                                  </div>
                                  <div className="mb-3">
                                    <label
                                      htmlFor="newPassword"
                                      className="form-label fw-bold"
                                    >
                                      New Password
                                    </label>
                                    <input
                                      type="password"
                                      className="form-control form-input-mod"
                                      id="newPassword"
                                      name="newPassword"
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
                                                  event.target.value
                                                ),
                                            };
                                          }
                                        );
                                      }}
                                    />
                                    {errors.resetPassword.newPasswordError &&
                                      errors.resetPassword.newPasswordError
                                        .length > 0 && (
                                        <div className="text-danger">
                                          {
                                            errors.resetPassword
                                              .newPasswordError[0].message
                                          }
                                        </div>
                                      )}
                                  </div>
                                  <div className="mb-3">
                                    <label
                                      htmlFor="newPasswordRepeat"
                                      className="form-label fw-bold"
                                    >
                                      Re-enter New Password
                                    </label>
                                    <input
                                      type="password"
                                      className="form-control form-input-mod"
                                      id="newPasswordRepeat"
                                      name="newPasswordRepeat"
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
                                                  event.target.value
                                                ),
                                            };
                                          }
                                        );
                                      }}
                                    />
                                    {errors.resetPassword
                                      .newPasswordRepeatError &&
                                      errors.resetPassword
                                        .newPasswordRepeatError.length > 0 && (
                                        <div className="text-danger">
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
                                </Form>
                              </div>
                              <div className="modal-footer">
                                <div className="col text-end add-btn pe-2">
                                  <button
                                    type="submit"
                                    className="btn btn-theme btn-sm"
                                    form="resetPasswordForm"
                                    disabled={navigation.state === "submitting"}
                                  >
                                    &nbsp;
                                    <i className="fa-sharp fa-solid fa-key"></i>
                                    &nbsp;&nbsp;{" "}
                                    {navigation.state === "submitting"
                                      ? "Submitting..."
                                      : "Reset Password"}
                                    &nbsp;&nbsp;&nbsp;
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
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
