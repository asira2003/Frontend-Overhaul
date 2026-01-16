import { defer, redirect, useLoaderData } from "react-router-dom";

import { requireAuth } from "../api/administration/authenticationApi";
import { getOverview } from "../api/administration/overview";

export async function loader() {
  const { message } = await requireAuth();
  if (!message.success) {
    throw redirect("login");
  }
  const overviewDataApi = await getOverview();
  if (!overviewDataApi.message.success) {
    throw redirect("error");
  }
  return overviewDataApi;
}

export default function Overview() {
  const { data } = useLoaderData();
  return (
    <section className="admin-overview">
      <div className="content">
        <div className="container"></div>
      </div>
    </section>
  );
}
