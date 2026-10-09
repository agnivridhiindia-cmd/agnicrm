import React from "react";
import Icon from "../../components/Icon";
import { normalizeSalesPersonName } from "../../utils/branchHelper";

export default function RequestTable({ requests = [], onView }) {
  return (
    <div className="mgr-requests-card">
      <div className="mgr-requests-scroll">
        <table className="mgr-requests-table">
          <thead>
            <tr>
              <th>REQUEST ID</th>
              <th>CLIENT NAME</th>
              <th>SALESPERSON</th>
              <th>REQUEST TYPE</th>
              <th>CREATED DATE</th>
              <th>STATUS</th>
              <th style={{ textAlign: "right" }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => {
              const statusClass = (request.status || "Pending").toLowerCase().replace(/[^a-z]/g, "");
              const clientTitle = request.clientName || request.company || request.companyName || "Client Account";
              const clientSub = request.subtitle || request.company || request.contactPerson || request.email || request.scheme || "Client Entity";
              const salesPersonName = normalizeSalesPersonName(request.salesPerson || request.owner || "Sales Executive");
              const reqType = request.requestType || "Client Approval";

              const reqTypeLower = reqType.toLowerCase();
              const isDelete = reqTypeLower.includes("delete");

              return (
                <tr key={request.id}>
                  <td>
                    <span className="mgr-req-id-pill">{request.id}</span>
                  </td>
                  <td>
                    <div className="mgr-client-cell">
                      <div className="mgr-client-meta">
                        <strong className="mgr-client-title">{clientTitle}</strong>
                        <span className="mgr-client-subtitle">{clientSub}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="mgr-salesperson-pill">
                      <Icon name="user" size={12} />
                      <span>{salesPersonName}</span>
                    </span>
                  </td>
                  <td>
                    <span className={`mgr-type-pill ${isDelete ? "delete" : ""}`}>
                      {reqType}
                    </span>
                  </td>
                  <td>
                    <span className="mgr-date-text">{request.createdAt || "Today"}</span>
                  </td>
                  <td>
                    <span className={`mgr-status-pill ${statusClass}`}>
                      <span className="mgr-status-dot" />
                      <span>{request.status}</span>
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      className="mgr-action-review-btn"
                      type="button"
                      onClick={() => onView(request)}
                    >
                      <Icon name="eye" size={13} />
                      <span>Review</span>
                    </button>
                  </td>
                </tr>
              );
            })}
            {requests.length === 0 && (
              <tr>
                <td colSpan={7} className="mgr-table-empty">
                  No requests currently available for review in this view.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
