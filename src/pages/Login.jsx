import React, { useEffect, useState } from "react";
import { Form, redirect, useActionData, useNavigation } from "react-router-dom";
import logo from "../assets/images/logo/logo.png";
import bg from "../assets/images/login/back-3.jpg";
import "../styles/admin-login.css";
import { login, requireAuth } from "../api/administration/authenticationApi";
import { validateInputTextNoUpperCase } from "../utils/StringUtils";
import ServerMessageToast from "../components/ServerMessageToast";

export async function loader() {
  const { message } = await requireAuth();
  if (message.success) {
    throw redirect("..");
  }

  return null;
}

export async function action({ request }) {
  const formData = await request.formData();
  if (formData.get("formType") === "login") {
    const username = formData.get("username");
    const password = formData.get("password");
    const error = { errors: [] };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(username) || username === null || username === "") {
      error.errors.push({
        name: "email",
        message: "Please enter a valid email.",
      });
    }
    if (password === null || password === "") {
      error.errors.push({
        name: "password",
        message: "Please enter a valid password.",
      });
    }
    if (error.errors.length !== 0) {
      return error;
    } else {
      const response = await login(username, password);
      const data = await response.json();

      if (response.ok) {
        sessionStorage.setItem("userId", data.data.userId);
        sessionStorage.setItem("userEmail", data.data.userEmail);
        sessionStorage.setItem("fullName", data.data.fullName);
        sessionStorage.setItem("token", data.data.token);
        sessionStorage.setItem("userGroupId", data.data.userGroup.userGroupId);
        sessionStorage.setItem(
          "userGroupDescription",
          data.data.userGroup.userGroupDescription
        );
        sessionStorage.setItem("modules", JSON.stringify(data.data.modules));
        sessionStorage.setItem("features", JSON.stringify(data.data.features));
        return redirect("../");
      } else {
        return data;
      }
    }
  }
  return null;
}

export default function Login() {
  const response = useActionData();
  const usernameError = response?.errors.filter((o) => o.name === "email");
  const passwordError = response?.errors.filter((o) => o.name === "password");
  const navigation = useNavigation();
  const [toasts, setToasts] = useState([]);

  const [modal, setModal] = useState({
    username: "",
    password: "",
    resetPasswordemail: "",
  });
  const [passwordVisible, setPasswordVisible] = useState(false);

  useEffect(() => {
    setToasts((prevToasts) => {
      const newToasts = prevToasts.map((x) => x);
      newToasts.unshift(
        <ServerMessageToast
          key={prevToasts.length + 1}
          message={response?.message}
          id={prevToasts.length + 1}
        />
      );
      return newToasts;
    });
  }, [response]);

  return (
    <>
      <div className="admin-login-page">
        <div className="admin-login-bg" aria-hidden="true" />
        <div className="admin-login-wrapper">
          <div
            className="admin-login-card"
            role="main"
            aria-labelledby="admin-title"
          >
            <div className="admin-login-header">
              <div className="shield-icon" aria-hidden="true">
                <i className="bx bxs-shield" />
              </div>
              <h1 id="admin-title" className="admin-title">
                Admin Console
              </h1>
              <p className="admin-sub">Sign in to access your dashboard</p>
            </div>

            <Form
              method="post"
              className="admin-form"
              aria-describedby="server-message"
            >
              <div className="field">
                <label htmlFor="username" className="field-label">
                  Email Address
                </label>
                <div
                  className={`input-with-icon ${
                    usernameError && usernameError.length > 0 ? "has-error" : ""
                  }`}
                >
                  <i className="bx bx-envelope" aria-hidden="true"></i>
                  <input
                    type="email"
                    id="username"
                    name="username"
                    className="field-input"
                    placeholder="admin@example.com"
                    disabled={navigation.state === "submitting"}
                    value={modal.username}
                    onChange={(event) => {
                      setModal((prevModal) => ({
                        ...prevModal,
                        username: validateInputTextNoUpperCase(
                          event.target.value
                        ),
                      }));
                    }}
                    aria-invalid={usernameError && usernameError.length > 0}
                    aria-describedby={
                      usernameError && usernameError.length > 0
                        ? "username-error"
                        : ""
                    }
                    required
                  />
                </div>
                {usernameError && usernameError.length > 0 && (
                  <div id="username-error" className="field-error">
                    {usernameError[0].message}
                  </div>
                )}
              </div>

              <div className="field">
                <div className="field-row">
                  <label htmlFor="password" className="field-label">
                    Password
                  </label>
                  <a href="#" className="forgot-link">
                    Forgot password?
                  </a>
                </div>
                <div
                  className={`input-with-icon ${
                    passwordError && passwordError.length > 0 ? "has-error" : ""
                  }`}
                >
                  <i className="bx bx-lock-alt" aria-hidden="true"></i>
                  <input
                    type={passwordVisible ? "text" : "password"}
                    id="password"
                    name="password"
                    className="field-input"
                    placeholder="Password"
                    disabled={navigation.state === "submitting"}
                    value={modal.password}
                    onChange={(event) => {
                      setModal((prevModal) => ({
                        ...prevModal,
                        password: validateInputTextNoUpperCase(
                          event.target.value
                        ),
                      }));
                    }}
                    aria-invalid={passwordError && passwordError.length > 0}
                    aria-describedby={
                      passwordError && passwordError.length > 0
                        ? "password-error"
                        : ""
                    }
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setPasswordVisible((v) => !v)}
                    aria-label={
                      passwordVisible ? "Hide password" : "Show password"
                    }
                  >
                    <i
                      className={passwordVisible ? "bx bx-show" : "bx bx-hide"}
                      aria-hidden="true"
                    ></i>
                  </button>
                </div>
                {passwordError && passwordError.length > 0 && (
                  <div id="password-error" className="field-error">
                    {
                      response?.errors.filter((o) => o.name === "password")[0]
                        .message
                    }
                  </div>
                )}
              </div>

              <button
                type={navigation.state === "submitting" ? "button" : "submit"}
                className="cta-button"
                disabled={
                  navigation.state === "submitting" &&
                  navigation.formData.get("formType") === "login"
                    ? true
                    : false
                }
              >
                {navigation.state === "submitting" &&
                navigation.formData.get("formType") === "login"
                  ? "Submitting..."
                  : "Sign In"}
              </button>

              <input type="hidden" name="formType" value="login" readOnly />
            </Form>

            <div className="divider">
              <span>SECURE ACCESS</span>
            </div>
            <p className="protected-note">
              Protected by enterprise-grade security
            </p>
          </div>
        </div>
      </div>
      <div className="toast-container toast-positioner" id="server-message">
        {toasts}
      </div>
    </>
  );
}
