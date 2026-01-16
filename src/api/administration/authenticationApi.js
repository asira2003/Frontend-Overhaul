import { API_URI } from "../apiConfig";

export async function requireAuth() {
  const headers = new Headers();
  headers.append("Authorization", `Bearer ${sessionStorage.getItem("token")}`);
  const response = await fetch(`${API_URI}/admin/authentication/require-auth`, {
    headers: headers,
  });

  const data = await response.json();
  return data;

  // return { loggedIn: false };
}

export async function login(username, password) {
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
  return navigate("/login");
}
