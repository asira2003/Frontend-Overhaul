import { API_URI } from "../apiConfig";

export async function searchAgentInquiries(
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
    `${API_URI}/admin/agent-tour-inquiries/search-agent-tour-inquiries?` +
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

export async function declineAgentInquiry(agentTourInquiryId, batchNo) {
  const headers = new Headers();
  headers.append("Authorization", `Bearer ${sessionStorage.getItem("token")}`);
  headers.append("Content-Type", "application/json");
  const response = await fetch(
    `${API_URI}/admin/agent-tour-inquiries/decline-agent-tour-inquiry`,
    {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        agentTourInquiryId: agentTourInquiryId,
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

export async function approveAgentrInquiry(agentTourInquiryId, batchNo) {
  const headers = new Headers();
  headers.append("Authorization", `Bearer ${sessionStorage.getItem("token")}`);
  headers.append("Content-Type", "application/json");
  const response = await fetch(
    `${API_URI}/admin/agent-tour-inquiries/approve-agent-tour-inquiry`,
    {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        agentTourInquiryId: agentTourInquiryId,
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

export async function invoiceAgentInquiry(
  agentTourInquiryId,
  batchNo,
  agentTourInvoiceTitle,
  agentTourInvoiceDescription,
  items
) {
  const headers = new Headers();
  headers.append("Authorization", `Bearer ${sessionStorage.getItem("token")}`);
  headers.append("Content-Type", "application/json");
  const response = await fetch(
    `${API_URI}/admin/agent-tour-inquiries/invoice-agent-tour-inquiry`,
    {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        agentTourInquiryId: agentTourInquiryId,
        batchNo: batchNo,
        agentTourInvoice: {
          agentTourInvoiceTitle: agentTourInvoiceTitle,
          agentTourInvoiceDescription: agentTourInvoiceDescription,
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
