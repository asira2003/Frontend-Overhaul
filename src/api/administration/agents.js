import { API_URI } from "../apiConfig";

export async function searchAgents(
  searchBy,
  searchValue,
  page,
  sortType,
  sortOrder,
  filterValue
) {
  const headers = new Headers();
  headers.append("Authorization", `Bearer ${sessionStorage.getItem("token")}`);
  const response = await fetch(
    `${API_URI}/admin/agents/search-agents?` +
      new URLSearchParams({
        searchBy: searchBy,
        searchValue: searchValue,
        page: page,
        sortType: sortType,
        sortOrder: sortOrder,
        filterValue: filterValue,
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
export async function addAgent(dto, file) {
  try {
    const formData = new FormData();
    formData.append("agentDtoString", JSON.stringify(dto));
    if (file) formData.append("agentBusinessRegistrationFile", file);

    const headers = new Headers();
    headers.append(
      "Authorization",
      `Bearer ${sessionStorage.getItem("token")}`
    );

    const response = await fetch(`${API_URI}/admin/agents/add-agent`, {
      method: "POST",
      headers: headers,
      body: formData,
    });

    if (!response.ok) throw new Error("Server error");
    return await response.json();
  } catch (err) {
    console.error("Add Agent API error:", err);
    return { message: { success: false, text: "Failed to Add Agent" } };
  }
}

export async function editAgent(dto, file) {
  try {
    const formData = new FormData();
    formData.append("agentDtoString", JSON.stringify(dto));

    if (file) {
      // If a file was uploaded, include it
      formData.append("agentBusinessRegistrationFile", file);
    } else {
      // If no file was uploaded, append an empty Blob
      formData.append("agentBusinessRegistrationFile", new Blob([]), "");
    }

    const headers = new Headers();
    headers.append("Authorization", `Bearer ${sessionStorage.getItem("token")}`);

    const response = await fetch(`${API_URI}/admin/agents/edit-agent`, {
      method: "POST",
      headers: headers,
      body: formData,
    });

    if (!response.ok) throw new Error("Server error");
    return await response.json();
  } catch (err) {
    console.error("Edit Agent API error:", err);
    return { message: { success: false, text: "Failed to Edit Agent" } };
  }
}




export async function deleteAgent(agentId, batchNo) {
  const headers = new Headers();
  headers.append("Authorization", `Bearer ${sessionStorage.getItem("token")}`);
  headers.append("Content-Type", "application/json");
  const response = await fetch(`${API_URI}/admin/agents/delete-agent`, {
    method: "POST",
    headers: headers,
    body: JSON.stringify({
      agentId: agentId,
      batchNo: batchNo,
    }),
  });
  if (response.ok) {
    const data = await response.json();
    return data;
  }
  return null;
}

export async function agentsLoadBusinessRegistrationFile(agentId) {
  const headers = new Headers();
  headers.append("Authorization", `Bearer ${sessionStorage.getItem("token")}`);

  const response = await fetch(
    `${API_URI}/admin/agents/load-agent-business-registration-file?` +
      new URLSearchParams({ agentId }),
    { headers }
  );

  if (!response.ok) return null;

  // Return as blob (since it's image/pdf)
  const blob = await response.blob();

  // Detect file type (optional)
  const contentType = response.headers.get("Content-Type");

  // Create an object URL
  const fileUrl = URL.createObjectURL(blob);
  console.log(fileUrl, contentType);
  return { fileUrl, contentType };
}
