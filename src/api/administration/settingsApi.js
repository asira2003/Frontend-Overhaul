import { API_URI } from "../apiConfig";

export async function searchSettings() {
  const headers = new Headers();
  headers.append("Authorization", `Bearer ${sessionStorage.getItem("token")}`);
  const response = await fetch(`${API_URI}/admin/settings/search-settings`, {
    headers: headers,
  });
  if (response.ok) {
    const data = await response.json();
    return data;
  }
  return null;
}
export async function resetPassword(newPassword, oldPassword, batchNo) {
  const headers = new Headers();
  headers.append("Authorization", `Bearer ${sessionStorage.getItem("token")}`);
  headers.append("Content-Type", "application/json");
  const response = await fetch(`${API_URI}/admin/settings/reset-password`, {
    method: "POST",
    headers: headers,
    body: JSON.stringify({
      newPassword: newPassword,
      oldPassword: oldPassword,
      batchNo: batchNo,
    }),
  });
  if (response.ok) {
    const data = await response.json();
    return data;
  }
  return null;
}
