import React from "react";
import { defer, redirect, useLoaderData } from "react-router-dom";

import { requireAuth } from "../api/administration/authenticationApi";
import { getOverview } from "../api/administration/overview";
import CustomProgressBar from "../components/charts/CustomProgressBar";

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
        <div className="container">
          <div className="row mt-5">
            <div className="col col-6">
              <div className="row">
                <div className="col">
                  <div className="card px-3 pt-3 card-min-width mb-3">
                    <div className="total-items">
                      {data.tourInvoicesCount.total}
                    </div>
                    <h5 className="card-title">Customer Tour Invoices</h5>
                    <CustomProgressBar
                      completePercentage={
                        data.tourInvoicesCount.completePercentage
                      }
                    />
                    <table className="table min-width-remover">
                      <tbody>
                        <tr>
                          <td className="lead">Pro Forma</td>
                          <td className="lead text-end">
                            {data.tourInvoicesCount.draft}
                          </td>
                        </tr>
                        <tr>
                          <td className="lead">Payment Pending</td>
                          <td className="lead text-end">
                            {data.tourInvoicesCount.paymentPending}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="col">
                  <div className="card px-3 pt-3 card-min-width mb-3">
                    <div className="total-items">
                      {data.tourInquiryCount.total}
                    </div>
                    <h5 className="card-title">Customer Tour Inquiries</h5>
                    <CustomProgressBar
                      completePercentage={
                        data.tourInquiryCount.completePercentage
                      }
                    />
                    <table className="table min-width-remover">
                      <tbody>
                        <tr>
                          <td className="lead">Pending</td>
                          <td className="lead text-end">
                            {data.tourInquiryCount.pending}
                          </td>
                        </tr>
                        <tr>
                          <td className="lead">Approved</td>
                          <td className="lead text-end">
                            {data.tourInquiryCount.approved}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            <div className="col col-6">
              <div className="row">
                <div className="col">
                  <div className="card px-3 pt-3 card-min-width mb-3">
                    <div className="total-items">
                      {data.agentTourInvoicesCount.total}
                    </div>
                    <h5 className="card-title">Agent Tour Invoices</h5>
                    <CustomProgressBar
                      completePercentage={
                        data.agentTourInvoicesCount.completePercentage
                      }
                    />
                    <table className="table min-width-remover">
                      <tbody>
                        <tr>
                          <td className="lead">Pro Forma</td>
                          <td className="lead text-end">
                            {data.agentTourInvoicesCount.draft}
                          </td>
                        </tr>
                        <tr>
                          <td className="lead">Payment Pending</td>
                          <td className="lead text-end">
                            {data.agentTourInvoicesCount.paymentPending}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="col">
                  <div className="card px-3 pt-3 card-min-width mb-3">
                    <div className="total-items">
                      {data.agentTourInquiryCount.total}
                    </div>
                    <h5 className="card-title">Agent Tour Inquiries</h5>
                    <CustomProgressBar
                      completePercentage={
                        data.agentTourInquiryCount.completePercentage
                      }
                    />
                    <table className="table min-width-remover">
                      <tbody>
                        <tr>
                          <td className="lead">Pending</td>
                          <td className="lead text-end">
                            {data.agentTourInquiryCount.pending}
                          </td>
                        </tr>
                        <tr>
                          <td className="lead">Approved</td>
                          <td className="lead text-end">
                            {data.agentTourInquiryCount.approved}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
