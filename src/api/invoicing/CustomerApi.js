import { API_URI } from "../apiConfig";

export async function searchCustomers(
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
    `${API_URI}/admin/customers/search-customers?` +
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

export async function deleteCustomer(customerId, batchNo) {
  const headers = new Headers();
  headers.append("Authorization", `Bearer ${sessionStorage.getItem("token")}`);
  headers.append("Content-Type", "application/json");
  const response = await fetch(`${API_URI}/admin/customers/delete-customer`, {
    method: "POST",
    headers: headers,
    body: JSON.stringify({
      customerId: customerId,
      batchNo: batchNo,
    }),
  });
  if (response.ok) {
    const data = await response.json();
    return data;
  }
  return null;
}

export async function addCustomer(customerName, customerEmail, customerPhone) {
  const headers = new Headers();
  headers.append("Authorization", `Bearer ${sessionStorage.getItem("token")}`);
  headers.append("Content-Type", "application/json");
  const response = await fetch(`${API_URI}/admin/customers/add-customer`, {
    method: "POST",
    headers: headers,
    body: JSON.stringify({
      customerName: customerName,
      customerEmail: customerEmail,
      customerPhone: customerPhone,
    }),
  });
  if (response.ok) {
    const data = await response.json();
    return data;
  }
  return null;
}

export async function editCustomer(
  customerName,
  customerEmail,
  customerPhone,
  active,
  customerId,
  batchNo
) {
  const headers = new Headers();
  headers.append("Authorization", `Bearer ${sessionStorage.getItem("token")}`);
  headers.append("Content-Type", "application/json");
  const response = await fetch(`${API_URI}/admin/customers/edit-customer`, {
    method: "POST",
    headers: headers,
    body: JSON.stringify({
      customerName: customerName,
      customerEmail: customerEmail,
      customerPhone: customerPhone,
      active: active,
      customerId: customerId,
      batchNo: batchNo,
    }),
  });
  if (response.ok) {
    const data = await response.json();
    return data;
  }
  return null;
}
