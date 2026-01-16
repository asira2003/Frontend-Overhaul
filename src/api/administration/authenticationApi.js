// src/api/administration/authenticationApi.js
import { API_URI } from "../apiConfig";

export async function requireAuth() {
  const headers = new Headers();
  headers.append("Authorization", `Bearer ${sessionStorage.getItem("token")}`);
  const response = await fetch(`${API_URI}/admin/authentication/require-auth`, {
    headers: headers,
  });

  try {
    const data = await response.json();
    return data;
  } catch (e) {
    return { loggedIn: false };
  }
}

export async function login(username, password) {
  // Mirror legacy: multipart/form-data with FormData
  const headers = new Headers().append("Content-Type", "multipart/form-data");
  const formData = new FormData();
  formData.append("username", username);
  formData.append("password", password);
  const response = await fetch(`${API_URI}/admin/authentication/login`, {
    method: "POST",
    headers: headers,
    body: formData,
  });
  return response;
}

export function logout(navigate) {
  sessionStorage.clear();
  if (navigate) return navigate("/login");
}
