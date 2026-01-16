import { API_URI } from "../apiConfig";

export async function searchAgentInvoices(
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
    `${API_URI}/admin/agent-tour-invoices/search-agent-tour-invoices?` +
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

export async function deleteAgentInvoice(agentTourInvoiceId, batchNo) {
  const headers = new Headers();
  headers.append("Authorization", `Bearer ${sessionStorage.getItem("token")}`);
  headers.append("Content-Type", "application/json");
  const response = await fetch(
    `${API_URI}/admin/agent-tour-invoices/delete-agent-tour-invoice`,
    {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        agentTourInvoiceId: agentTourInvoiceId,
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
export async function addAgentInvoice(
  agentTourInvoiceTitle,
  agentTourInvoiceDescription,
  items,
  agentId
) {
  const headers = new Headers();
  headers.append("Authorization", `Bearer ${sessionStorage.getItem("token")}`);
  headers.append("Content-Type", "application/json");
  const response = await fetch(
    `${API_URI}/admin/agent-tour-invoices/add-agent-tour-invoice`,
    {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        agentTourInvoiceTitle: agentTourInvoiceTitle,
        agentTourInvoiceDescription: agentTourInvoiceDescription,
        items: items,
        agent: {
          agentId: agentId,
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

export async function editAgentInvoice(
  agentTourInvoiceTitle,
  agentTourInvoiceDescription,
  agentTourInvoiceId,
  batchNo,
  items
) {
  const headers = new Headers();
  headers.append("Authorization", `Bearer ${sessionStorage.getItem("token")}`);
  headers.append("Content-Type", "application/json");
  const response = await fetch(
    `${API_URI}/admin/agent-tour-invoices/edit-agent-tour-invoice`,
    {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        agentTourInvoiceTitle: agentTourInvoiceTitle,
        agentTourInvoiceDescription: agentTourInvoiceDescription,
        agentTourInvoiceId: agentTourInvoiceId,
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

export async function postAgentInvoice(
  agentTourInvoiceTitle,
  agentTourInvoiceDescription,
  agentTourInvoiceId,
  batchNo,
  items
) {
  const headers = new Headers();
  headers.append("Authorization", `Bearer ${sessionStorage.getItem("token")}`);
  headers.append("Content-Type", "application/json");
  const response = await fetch(
    `${API_URI}/admin/agent-tour-invoices/post-agent-tour-invoice`,
    {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        agentTourInvoiceTitle: agentTourInvoiceTitle,
        agentTourInvoiceDescription: agentTourInvoiceDescription,
        agentTourInvoiceId: agentTourInvoiceId,
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

export async function printAgentInvoice(agentTourInvoiceNumber) {
  const headers = new Headers();
  headers.append("Authorization", `Bearer ${sessionStorage.getItem("token")}`);
  const response = await fetch(
    `${API_URI}/admin/agent-tour-invoices/print-agent-tour-invoice?` +
      new URLSearchParams({
        agentTourInvoiceNumber: agentTourInvoiceNumber,
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

export async function cancelAgentInvoice(agentTourInvoiceId, batchNo) {
  const headers = new Headers();
  headers.append("Authorization", `Bearer ${sessionStorage.getItem("token")}`);
  headers.append("Content-Type", "application/json");
  const response = await fetch(
    `${API_URI}/admin/agent-tour-invoices/cancel-agent-tour-invoice`,
    {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        agentTourInvoiceId: agentTourInvoiceId,
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

export async function directDepositAgentInvoices(agentTourInvoiceId, batchNo) {
  const headers = new Headers();
  headers.append("Authorization", `Bearer ${sessionStorage.getItem("token")}`);
  headers.append("Content-Type", "application/json");
  const response = await fetch(
    `${API_URI}/admin/agent-tour-invoices/direct-deposit-agent-tour-invoice`,
    {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        agentTourInvoiceId: agentTourInvoiceId,
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
