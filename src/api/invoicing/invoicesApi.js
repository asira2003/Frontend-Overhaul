import { API_URI } from "../apiConfig";

export async function searchTourInvoices(
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
    `${API_URI}/admin/tour-invoices/search-tour-invoices?` +
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

export async function deleteTourInvoice(tourInvoiceId, batchNo) {
  const headers = new Headers();
  headers.append("Authorization", `Bearer ${sessionStorage.getItem("token")}`);
  headers.append("Content-Type", "application/json");
  const response = await fetch(
    `${API_URI}/admin/tour-invoices/delete-tour-invoice`,
    {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        tourInvoiceId: tourInvoiceId,
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
export async function addTourInvoice(
  tourInvoiceTitle,
  tourInvoiceDescription,
  items,
  customerId
) {
  const headers = new Headers();
  headers.append("Authorization", `Bearer ${sessionStorage.getItem("token")}`);
  headers.append("Content-Type", "application/json");
  const response = await fetch(
    `${API_URI}/admin/tour-invoices/add-tour-invoice`,
    {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        tourInvoiceTitle: tourInvoiceTitle,
        tourInvoiceDescription: tourInvoiceDescription,
        items: items,
        customer: {
          customerId: customerId,
        },
      }),
    }
  );
  if (response.ok) {
    const data = await response.json();
    return data;
  }
  return null;
}

export async function editTourInvoice(
  tourInvoiceTitle,
  tourInvoiceDescription,
  tourInvoicePricing,
  tourInvoiceId,
  batchNo,
  items
) {
  const headers = new Headers();
  headers.append("Authorization", `Bearer ${sessionStorage.getItem("token")}`);
  headers.append("Content-Type", "application/json");
  const response = await fetch(
    `${API_URI}/admin/tour-invoices/edit-tour-invoice`,
    {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        tourInvoiceTitle: tourInvoiceTitle,
        tourInvoiceDescription: tourInvoiceDescription,
        tourInvoicePricing: tourInvoicePricing,
        tourInvoiceId: tourInvoiceId,
        batchNo: batchNo,
        items: items,
      }),
    }
  );
  if (response.ok) {
    const data = await response.json();
    return data;
  }
  return null;
}

export async function postTourInvoice(
  tourInvoiceTitle,
  tourInvoiceDescription,
  tourInvoicePricing,
  tourInvoiceId,
  batchNo,
  items
) {
  const headers = new Headers();
  headers.append("Authorization", `Bearer ${sessionStorage.getItem("token")}`);
  headers.append("Content-Type", "application/json");
  const response = await fetch(
    `${API_URI}/admin/tour-invoices/post-tour-invoice`,
    {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        tourInvoiceTitle: tourInvoiceTitle,
        tourInvoiceDescription: tourInvoiceDescription,
        tourInvoicePricing: tourInvoicePricing,
        tourInvoiceId: tourInvoiceId,
        batchNo: batchNo,
        items: items,
      }),
    }
  );
  if (response.ok) {
    const data = await response.json();
    return data;
  }
  return null;
}

export async function printTourInvoice(tourInvoiceNumber) {
  const headers = new Headers();
  headers.append("Authorization", `Bearer ${sessionStorage.getItem("token")}`);
  const response = await fetch(
    `${API_URI}/admin/tour-invoices/print-tour-invoice?` +
      new URLSearchParams({
        tourInvoiceNumber: tourInvoiceNumber,
      }),
    {
      headers: headers,
    }
  );
  if (response.ok) {
    const data = await response.blob();
    return data;
  }
  return null;
}

export async function cancelTourInvoice(tourInvoiceId, batchNo) {
  const headers = new Headers();
  headers.append("Authorization", `Bearer ${sessionStorage.getItem("token")}`);
  headers.append("Content-Type", "application/json");
  const response = await fetch(
    `${API_URI}/admin/tour-invoices/cancel-tour-invoice`,
    {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        tourInvoiceId: tourInvoiceId,
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

export async function directDepositTourInvoices(tourInvoiceId, batchNo) {
  const headers = new Headers();
  headers.append("Authorization", `Bearer ${sessionStorage.getItem("token")}`);
  headers.append("Content-Type", "application/json");
  const response = await fetch(
    `${API_URI}/admin/tour-invoices/direct-deposit-tour-invoice`,
    {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        tourInvoiceId: tourInvoiceId,
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
