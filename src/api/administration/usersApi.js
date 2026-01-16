import { API_URI } from "../apiConfig";

export async function searchUsers(
  searchBy,
  searchValue,
  page,
  sortType,
  sortOrder
) {
  const headers = new Headers();
  headers.append("Authorization", `Bearer ${sessionStorage.getItem("token")}`);
  const response = await fetch(
    `${API_URI}/admin/users/search-users?` +
      new URLSearchParams({
        searchBy: searchBy,
        searchValue: searchValue,
        page: page,
        sortType: sortType,
        sortOrder: sortOrder,
      }),
    {
      headers: headers,
    }
  );
  if (response.ok) {
    const data = await response.json();
    return data;
  }
  return null;
}

export async function addUser(fullName, userEmail, userGroupId, password) {
  const headers = new Headers();
  headers.append("Authorization", `Bearer ${sessionStorage.getItem("token")}`);
  headers.append("Content-Type", "application/json");
  const response = await fetch(`${API_URI}/admin/users/add-user`, {
    method: "POST",
    headers: headers,
    body: JSON.stringify({
      userEmail: userEmail,
      fullName: fullName,
      token: password,
      userGroup: {
        userGroupId: userGroupId,
      },
    }),
  });
  if (response.ok) {
    const data = await response.json();
    return data;
  }
  return null;
}

export async function deleteUser(userId, batchNo) {
  const headers = new Headers();
  headers.append("Authorization", `Bearer ${sessionStorage.getItem("token")}`);
  headers.append("Content-Type", "application/json");
  const response = await fetch(
    `${API_URI}/admin/users/delete-user
`,
    {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        userId: userId,
        batchNo: batchNo,
      }),
    }
  );
  if (response.ok) {
    const data = await response.json();
    return data;
  }
  return null;
}

export async function editUser(
  fullName,
  userEmail,
  userGroup,

  userId,
  batchNo
) {
  const headers = new Headers();
  headers.append("Authorization", `Bearer ${sessionStorage.getItem("token")}`);
  headers.append("Content-Type", "application/json");
  const response = await fetch(`${API_URI}/admin/users/edit-user`, {
    method: "POST",
    headers: headers,
    body: JSON.stringify({
      userId: userId,
      batchNo: batchNo,
      userEmail: userEmail,
      fullName: fullName,
      userGroup: {
        userGroupId: userGroup,
      },
    }),
  });
  if (response.ok) {
    const data = await response.json();
    return data;
  }
  return null;
}
