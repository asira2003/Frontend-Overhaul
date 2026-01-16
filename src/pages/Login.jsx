import React, { useEffect, useState } from "react";
import { Form, redirect, useActionData, useNavigation } from "react-router-dom";
import logo from "../assets/images/logo/logo.png";
import bg from "../assets/images/login/back-3.jpg";
import { login, requireAuth } from "../api/administration/authenticationApi";
import { validateInputTextNoUpperCase } from "../utils/StringUtils";
import ServerMessageToast from "../components/ServerMessageToast";
import { Lock, Mail, Eye, EyeOff } from "lucide-react";

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
  const navigation = useNavigation();
  const [validationErrors, setValidationErrors] = useState([]);

  const usernameError = validationErrors.filter((o) => o.name === "email");
  const passwordError = validationErrors.filter((o) => o.name === "password");

  const [showPassword, setShowPassword] = useState(false);
  const [toasts, setToasts] = useState([]);

  const [modal, setModal] = useState({
    username: "",
    password: "",
    resetPasswordemail: "",
  });
  useEffect(() => {
    if (response?.errors) {
      setValidationErrors(response.errors);
    }

    setToasts((prevToasts) => {
      const newToasts = prevToasts.map((x) => x);
      if (response?.message) {
        newToasts.unshift(
          <ServerMessageToast
            key={prevToasts.length + 1}
            message={response?.message}
            id={prevToasts.length + 1}
          />
        );
      }
      return newToasts;
    });
  }, [response]);

  // Helper to clear specific error
  const clearError = (fieldName) => {
    setValidationErrors((prev) => prev.filter((err) => err.name !== fieldName));
  };

  return (
    <>
      <div className="login-container">
        <div className="login-left"></div>
        <div className="login-right">
          <div className="login-form-container">
            <div className="login-form-header">
              <h2>Welcome Back</h2>
              <p>Enter your credentials to access the admin console</p>
            </div>
            <div className="login-form-wrapper">
              <Form className="login-form" method="post">
                <div className="login-form-input-container">
                  <label htmlFor="username">Email Address</label>
                  <div
                    className={`login-form-input-box ${
                      usernameError && usernameError.length > 0
                        ? "has-error"
                        : ""
                    }`}
                  >
                    <Mail className="input-icon" />
                    <input
                      id="username"
                      name="username"
                      placeholder="admin@example.com"
                      disabled={
                        navigation.state === "submitting" ? true : false
                      }
                      value={modal.username}
                      onChange={(event) => {
                        if (usernameError.length > 0) clearError("email");

                        setModal((prevModal) => {
                          return {
                            ...prevModal,
                            username: validateInputTextNoUpperCase(
                              event.target.value
                            ),
                          };
                        });
                      }}
                      className={`login-form-input-box-input ${
                        usernameError && usernameError.length > 0
                          ? "input-error"
                          : ""
                      }`}
                      required
                    />
                  </div>
                  <div className="error-text-form">
                    {usernameError?.[0]?.message || ""}
                  </div>
                </div>

                <div className="login-form-input-container">
                  <label htmlFor="password">Password</label>
                  <div
                    className={`login-form-input-box ${
                      passwordError && passwordError.length > 0
                        ? "has-error"
                        : ""
                    }`}
                  >
                    <Lock className="input-icon" />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      disabled={
                        navigation.state === "submitting" ? true : false
                      }
                      value={modal.password}
                      onChange={(event) => {
                        if (passwordError.length > 0) clearError("password");

                        setModal((prevModal) => {
                          return {
                            ...prevModal,
                            password: validateInputTextNoUpperCase(
                              event.target.value
                            ),
                          };
                        });
                      }}
                      className={`login-form-input-box-input ${
                        passwordError && passwordError.length > 0
                          ? "input-error"
                          : ""
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="eye-icon"
                    >
                      {showPassword ? (
                        <EyeOff className="size-5" />
                      ) : (
                        <Eye className="size-5" />
                      )}
                    </button>
                  </div>
                  <div className="error-text-form">
                    {passwordError?.[0]?.message || ""}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="login-form-submit">
                  <button
                    type={
                      navigation.state === "submitting" ? "button" : "submit"
                    }
                    className="login-form-submit-button"
                    disabled={
                      navigation.state === "submitting" &&
                      navigation.formData.get("formType") === "login"
                    }
                  >
                    {navigation.state === "submitting" &&
                    navigation.formData.get("formType") === "login" ? (
                      <span className="button-loading">
                        <span className="spinner"></span>
                        <span>Signing in...</span>
                      </span>
                    ) : (
                      "Sign In"
                    )}
                  </button>
                </div>
                <input
                  type="hidden"
                  name="formType"
                  value="login"
                  readOnly={true}
                />
              </Form>
            </div>
          </div>
        </div>
      </div>
      <div className="toast-wrapper">{toasts}</div>
    </>
  );
}
