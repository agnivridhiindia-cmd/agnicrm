import React from "react";
import Icon from "../../components/Icon";
import "./ITDashboard.css";

export default function ITClientInfoModal({ client, onClose }) {
  if (!client) return null;

  const totalPayment = Number(client.totalPayment || 0);
  const paymentReceived = Number(client.paymentReceived || 0);
  const paymentPending = Number(client.paymentPending || 0);
  const isPaid = paymentPending <= 0 && paymentReceived > 0;

  return (
    <div
      className="modal-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(5px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        className="modal-card it-panel-card"
        style={{
          width: "100%",
          maxWidth: 680,
          maxHeight: "90vh",
          overflowY: "auto",
          padding: 0,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                className="it-badge"
                style={{
                  background: "#4e7cff",
                  color: "#ffffff",
                }}
              >
                IT CLIENT DOSSIER
              </span>
              <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
                ID: #{client.id}
              </span>
              <span
                className="it-badge"
                style={{
                  background: "rgba(16, 185, 129, 0.15)",
                  color: "#10b981",
                }}
              >
                {client.branch} Branch
              </span>
            </div>
            <h3 style={{ margin: "8px 0 2px", fontSize: 20, fontWeight: 700 }}>
              {client.company || client.name}
            </h3>
            <p className="it-desc">
              Contact: <strong>{client.contactPerson || client.name}</strong> • Registered: {client.createdDate || "2026-08-18"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 6,
              color: "#64748b",
            }}
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: 24 }}>
          {/* Key Metrics Strip */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12,
              marginBottom: 20,
            }}
          >
            <div className="it-subcard">
              <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Total Deal Value</div>
              <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>
                ₹{totalPayment.toLocaleString("en-IN")}
              </div>
              <div style={{ fontSize: 11, color: isPaid ? "#10b981" : "#f59e0b", fontWeight: 700, marginTop: 4 }}>
                {isPaid ? "✓ Fully Paid" : `₹${paymentPending.toLocaleString("en-IN")} Pending`}
              </div>
            </div>

            <div className="it-subcard">
              <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>SLA Priority Tier</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#4e7cff", marginTop: 4 }}>
                {client.slaTier || "Standard Retainer"}
              </div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                24/7 Monitoring Active
              </div>
            </div>

            <div className="it-subcard">
              <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Pitched / Created By</div>
              <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4 }}>
                {client.salesPerson || "Mia Rose"}
              </div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                {client.branch} Branch Team
              </div>
            </div>
          </div>

          {/* Section 1: IT Service Information */}
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 700 }}>
              IT Service Request Details
            </h4>
            <div
              className="it-subcard"
              style={{
                border: "1px solid rgba(78, 124, 255, 0.3)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>
                  {client.serviceName || "Enterprise IT Service"}
                </span>
                <span
                  className="it-badge"
                  style={{
                    background: "rgba(78, 124, 255, 0.15)",
                    color: "#4e7cff",
                  }}
                >
                  Service Line: IT
                </span>
              </div>
              <p className="it-desc" style={{ marginTop: 8 }}>
                {client.notes || "Technical service delivery scope and infrastructure maintenance agreement."}
              </p>
            </div>
          </div>

          {/* Section 2: Contact & Company Coordinates */}
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 700 }}>
              Contact &amp; Location Coordinates
            </h4>
            <div
              className="it-subcard"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <div>
                <span style={{ fontSize: 11, color: "#64748b", display: "block" }}>Email Address</span>
                <strong style={{ fontSize: 13 }}>{client.email || "—"}</strong>
              </div>
              <div>
                <span style={{ fontSize: 11, color: "#64748b", display: "block" }}>Phone Number</span>
                <strong style={{ fontSize: 13 }}>{client.phone || "—"}</strong>
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <span style={{ fontSize: 11, color: "#64748b", display: "block" }}>Office Address</span>
                <strong style={{ fontSize: 13 }}>{client.address || "—"}</strong>
              </div>
            </div>
          </div>

          {/* Section 3: Billing & Financial Breakdown */}
          <div>
            <h4 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 700 }}>
              Billing &amp; Payment Ledger
            </h4>
            <div className="it-subcard">
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}>
                <span style={{ color: "#64748b" }}>Base IT Service Fee</span>
                <span style={{ fontWeight: 600 }}>₹{Number(client.amount || 0).toLocaleString("en-IN")}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}>
                <span style={{ color: "#64748b" }}>GST (18% Applicable)</span>
                <span style={{ fontWeight: 600 }}>₹{Number(client.gstAmount || 0).toLocaleString("en-IN")}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}>
                <span style={{ color: "#64748b" }}>Payment Mode</span>
                <span style={{ fontWeight: 600 }}>{client.paymentMode || "Online"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0 4px", fontSize: 14, fontWeight: 700 }}>
                <span>Total Invoiced</span>
                <span style={{ color: "#4e7cff" }}>₹{totalPayment.toLocaleString("en-IN")}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 12 }}>
                <span style={{ color: "#10b981", fontWeight: 600 }}>Received: ₹{paymentReceived.toLocaleString("en-IN")}</span>
                <span style={{ color: paymentPending > 0 ? "#ef4444" : "#10b981", fontWeight: 600 }}>
                  Balance Due: ₹{paymentPending.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            type="button"
            className="it-btn-secondary"
            onClick={onClose}
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
}
