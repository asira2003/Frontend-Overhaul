import React, { useEffect, useState } from "react";
import { Form, redirect, useActionData, useNavigation } from "react-router-dom";
import logo from "../assets/images/logo/logo.png";
import bg from "../assets/images/login/back-3.jpg";
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
      <div className="login-body">
        <a href="#" className="whatsapp">
          <i className="fa-brands fa-whatsapp"></i>
        </a>
        <div className="login-container">
          {" "}
          <div className="login-wrapper">
            <div className="login-img">
              <img src="/logo.png" alt="" />
            </div>
            <div className="login-top">
              <h1>Sign In</h1>
              <h2>Admin Console</h2>
            </div>

            <Form method="post">
              <div className="input-box login-input ">
                <input
                  type="text"
                  className={`form-control input-group-control-mod-2 form-input-mod ${
                    usernameError && usernameError.length > 0
                      ? "wrong-pass"
                      : ""
                  }`}
                  id="username"
                  name="username"
                  placeholder="Email"
                  disabled={navigation.state === "submitting" ? true : false}
                  value={modal.username}
                  onChange={(event) => {
                    setModal((prevModal) => {
                      return {
                        ...prevModal,
                        username: validateInputTextNoUpperCase(
                          event.target.value
                        ),
                      };
                    });
                  }}
                  required
                />
                <i
                  className={`bx bxs-user ${
                    usernameError && usernameError.length > 0
                      ? "text-danger"
                      : ""
                  }`}
                ></i>
              </div>
              {usernameError && usernameError.length > 0 && (
                <div className="text-danger">{usernameError[0].message}</div>
              )}
              <div className="input-box login-input ">
                <input
                  type="password"
                  className={`form-control input-group-control-mod-2 form-input-mod ${
                    passwordError && passwordError.length > 0
                      ? "wrong-pass"
                      : ""
                  }`}
                  id="password"
                  name="password"
                  placeholder="Password"
                  disabled={navigation.state === "submitting" ? true : false}
                  value={modal.password}
                  onChange={(event) => {
                    setModal((prevModal) => {
                      return {
                        ...prevModal,
                        password: validateInputTextNoUpperCase(
                          event.target.value
                        ),
                      };
                    });
                  }}
                />
                <i
                  className={`bx bxs-lock-alt ${
                    passwordError && passwordError.length > 0
                      ? "text-danger"
                      : ""
                  }`}
                ></i>
              </div>
              {passwordError && passwordError.length > 0 && (
                <div className="text-danger">
                  {
                    response?.errors.filter((o) => o.name === "password")[0]
                      .message
                  }
                </div>
              )}

              <button
                type={navigation.state === "submitting" ? "button" : "submit"}
                className="btn-log"
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
      <div className="toast-container toast-positioner">{toasts}</div>
    </>
  );
}
