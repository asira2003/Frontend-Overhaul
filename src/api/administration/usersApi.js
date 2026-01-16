// src/api/administration/usersApi.js
import { API_URI } from "../apiConfig";

export async function searchUsers(
  searchBy,
  searchValue,
  page,
  sortType,
  sortOrder
) {
  const headers = new Headers();
  const token =
    typeof window !== "undefined" ? sessionStorage.getItem("token") : null;
  if (token) {
    headers.append("Authorization", `Bearer ${token}`);
  }

  const queryParams = new URLSearchParams({
    searchBy: searchBy || "",
    searchValue: searchValue || "",
    page: page ?? 1,
    sortType: sortType || "createdAt",
    sortOrder: sortOrder || "desc",
  });

  try {
    const response = await fetch(
      `${API_URI}/admin/users/search-users?${queryParams}`,
      {
        method: "GET",
        headers: headers,
      }
    );

    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error("API Error (searchUsers):", error);
    return null;
  }
}
