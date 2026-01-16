import { API_URI } from "../apiConfig";

export async function searchTourInquiries(
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
    `${API_URI}/admin/tour-inquiries/search-tour-inquiries?` +
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

export async function declineTourInquiry(tourInquiryId, batchNo) {
  const headers = new Headers();
  headers.append("Authorization", `Bearer ${sessionStorage.getItem("token")}`);
  headers.append("Content-Type", "application/json");
  const response = await fetch(
    `${API_URI}/admin/tour-inquiries/decline-tour-inquiry`,
    {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        tourInquiryId: tourInquiryId,
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

export async function approveTourInquiry(tourInquiryId, batchNo) {
  const headers = new Headers();
  headers.append("Authorization", `Bearer ${sessionStorage.getItem("token")}`);
  headers.append("Content-Type", "application/json");
  const response = await fetch(
    `${API_URI}/admin/tour-inquiries/approve-tour-inquiry`,
    {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        tourInquiryId: tourInquiryId,
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

export async function invoiceTourInquiry(
  tourInquiryId,
  batchNo,
  tourInvoiceTitle,
  tourInvoiceDescription,
  items
) {
  const headers = new Headers();
  headers.append("Authorization", `Bearer ${sessionStorage.getItem("token")}`);
  headers.append("Content-Type", "application/json");
  const response = await fetch(
    `${API_URI}/admin/tour-inquiries/invoice-tour-inquiry`,
    {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        tourInquiryId: tourInquiryId,
        batchNo: batchNo,
        tourInvoice: {
          tourInvoiceTitle: tourInvoiceTitle,
          tourInvoiceDescription: tourInvoiceDescription,
          items: items,
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
