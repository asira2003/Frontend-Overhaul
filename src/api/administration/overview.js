import { API_URI } from "../apiConfig";

export async function getOverview() {
  const headers = new Headers();
  headers.append("Authorization", `Bearer ${sessionStorage.getItem("token")}`);
  const response = await fetch(`${API_URI}/admin/overview/get-overview`, {
    headers: headers,
  });
  if (response.ok) {
    const data = await response.json();
    return data;
  }
  return null;
}
