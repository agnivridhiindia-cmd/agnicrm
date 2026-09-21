import React from "react";
import Icon from "../../../components/Icon";
import { serviceTypeSchemes, caServiceCharges } from "../mockSalesData";

export default function SalesClientForm({
  newClient,
  onNewClientChange,
  onAddClient,
  onClearForm,
  onGoToDetails,
  formSuccessMsg,
  dark,
}) {
  const baseAmt = parseFloat(newClient?.amount) || 0;
  const isOnline = newClient?.paymentMode === "Online";

  const currentServiceType = newClient?.serviceType || "Consultancy Services";
  const availableSchemes = serviceTypeSchemes[currentServiceType] || serviceTypeSchemes["Consultancy Services"] || [];

  return (
    <section className="sales-clients-form-view">
      {/* Top Title Banner */}
      <div className="sales-header-banner">
        <div>
          <p className="sales-header-eyebrow">Client Onboarding</p>
          <h1 className="sales-header-title">Register New Client</h1>
          <p className="sales-header-subtitle">
            Enter client identity, service type, scheme tier, and commercial terms. Saved profiles appear in <strong>Details</strong>.
          </p>
        </div>

        <button
          type="button"
          className="sales-btn-secondary"
          onClick={onGoToDetails}
        >
          <Icon name="eye" size={15} />
          <span>View Directory</span>
        </button>
      </div>

      {/* Form Container */}
      <div className="analytics-card sales-form-card">
        <form onSubmit={onAddClient} className="sales-form-wrapper" autoComplete="off">
          {/* Section 1: Business Identity */}
          <div className="sales-form-section">
            <div className="sales-section-title">
              <div className="sales-section-icon">
                <Icon name="building" size={15} />
              </div>
              <span>1. Business & Contact Information</span>
            </div>

            <div className="sales-form-grid-2">
              <label className="field-label">
                <span>Company Name <span style={{ color: "#f43f5e" }}>*</span></span>
                <input
                  type="text"
                  name="company"
                  placeholder="e.g. Acme Tech Solutions"
                  value={newClient?.company || ""}
                  onChange={onNewClientChange}
                  autoComplete="off"
                  required
                />
              </label>

              <label className="field-label">
                <span>Contact Person <span style={{ color: "#f43f5e" }}>*</span></span>
                <input
                  type="text"
                  name="contactPerson"
                  placeholder="e.g. Ramesh Kumar"
                  value={newClient?.contactPerson || ""}
                  onChange={onNewClientChange}
                  autoComplete="off"
                  required
                />
              </label>

              <label className="field-label">
                <span>Email Address <span style={{ color: "#f43f5e" }}>*</span></span>
                <input
                  type="email"
                  name="email"
                  placeholder="ramesh@acmetech.in"
                  value={newClient?.email || ""}
                  onChange={onNewClientChange}
                  autoComplete="off"
                  required
                />
              </label>

              <label className="field-label">
                <span>Mobile Number <span style={{ color: "#f43f5e" }}>*</span></span>
                <input
                  type="tel"
                  name="phone"
                  placeholder="+91 98765 43210"
                  value={newClient?.phone || ""}
                  onChange={onNewClientChange}
                  autoComplete="off"
                  required
                />
              </label>

              <label className="field-label">
                <span>Business Entity Type <span style={{ color: "#f43f5e" }}>*</span></span>
                <div style={{ position: "relative", width: "100%" }}>
                  <select
                    name="businessType"
                    value={newClient?.businessType || "Proprietorship"}
                    onChange={onNewClientChange}
                    required
                    style={{
                      width: "100%",
                      paddingRight: "36px",
                      appearance: "none",
                      WebkitAppearance: "none",
                      MozAppearance: "none",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    <option value="Proprietorship">Proprietorship</option>
                    <option value="Pvt Ltd">Pvt Ltd (Private Limited)</option>
                    <option value="LLP">LLP (Limited Liability Partnership)</option>
                    <option value="OPC">OPC (One Person Company)</option>
                    <option value="Partnership">Partnership Firm</option>
                    <option value="Section 8 Company">Section 8 Company</option>
                  </select>
                  <div style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                    color: "#6366f1",
                    fontSize: "14px",
                    fontWeight: "bold",
                    display: "flex",
                    alignItems: "center"
                  }}>
                    ▼
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Section 2: Engagement Tier & Scheme Options */}
          <div className="sales-form-section">
            <div className="sales-section-title">
              <div
                className="sales-section-icon"
                style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}
              >
                <Icon name="document" size={15} />
              </div>
              <span>2. Scheme & Engagement Tier</span>
            </div>

            <div className="sales-form-grid-2">
              <label className="field-label">
                <span>Service Category <span style={{ color: "#f43f5e" }}>*</span></span>
                <div style={{ position: "relative", width: "100%" }}>
                  <select
                    name="serviceType"
                    value={currentServiceType}
                    onChange={onNewClientChange}
                    required
                    style={{
                      width: "100%",
                      paddingRight: "36px",
                      appearance: "none",
                      WebkitAppearance: "none",
                      MozAppearance: "none",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    <option value="Certificate">Certificate / CA Services</option>
                    <option value="Consultancy Services">Consultancy Services</option>
                    <option value="IT">IT Services</option>
                    <option value="Marketing">Marketing Services</option>
                  </select>
                  <div style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                    color: "#6366f1",
                    fontSize: "14px",
                    fontWeight: "bold",
                    display: "flex",
                    alignItems: "center"
                  }}>
                    ▼
                  </div>
                </div>
              </label>

              <label className="field-label">
                <span>
                  Select Specific Scheme / Service ({currentServiceType}) <span style={{ color: "#f43f5e" }}>*</span>
                </span>
                <div style={{ position: "relative", width: "100%" }}>
                  <select
                    name="scheme"
                    value={newClient?.scheme || availableSchemes[0]}
                    onChange={onNewClientChange}
                    required
                    style={{
                      width: "100%",
                      paddingRight: "36px",
                      appearance: "none",
                      WebkitAppearance: "none",
                      MozAppearance: "none",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    {availableSchemes.map((scheme) => (
                      <option key={scheme} value={scheme}>
                        {scheme}
                      </option>
                    ))}
                  </select>
                  <div style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                    color: "#6366f1",
                    fontSize: "14px",
                    fontWeight: "bold",
                    display: "flex",
                    alignItems: "center"
                  }}>
                    ▼
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Section 3: Commercials & Billing */}
          <div className="sales-form-section">
            <div className="sales-section-title">
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: "rgba(140, 95, 248, 0.15)",
                  color: "#8c5ff8",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Icon name="currency" size={15} />
              </div>
              <span>3. Commercials & Payment Setup</span>
            </div>

            <div className="sales-form-grid-3">
              <label className="field-label">
                <span>Pitched Amount (₹) <span style={{ color: "#f43f5e" }}>*</span></span>
                <input
                  type="number"
                  name="amount"
                  value={newClient.amount}
                  onChange={onNewClientChange}
                  placeholder="e.g. 50000"
                  min="0"
                  required
                />
              </label>
              <label className="field-label">
                <span>Mode of Payment</span>
                <div style={{ position: "relative", width: "100%" }}>
                  <select
                    name="paymentMode"
                    value={newClient.paymentMode}
                    onChange={onNewClientChange}
                    style={{
                      width: "100%",
                      paddingRight: "36px",
                      appearance: "none",
                      WebkitAppearance: "none",
                      MozAppearance: "none",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    <option value="Online">Online (18% GST Added)</option>
                    <option value="Offline">Offline (Direct/Exempt)</option>
                  </select>
                  <div style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                    color: "#6366f1",
                    fontSize: "14px",
                    fontWeight: "bold",
                    display: "flex",
                    alignItems: "center"
                  }}>
                    ▼
                  </div>
                </div>
              </label>
              <label className="field-label">
                <span>Payment Received (₹)</span>
                <input
                  type="number"
                  name="paymentReceived"
                  value={newClient.paymentReceived}
                  onChange={onNewClientChange}
                  placeholder="0"
                  min="0"
                />
              </label>
            </div>

            {/* Live Calculation Summary Strip */}
            <div
              style={{
                marginTop: 16,
                padding: "16px 20px",
                borderRadius: 14,
                background: "linear-gradient(135deg, rgba(140, 95, 248, 0.08) 0%, rgba(109, 59, 245, 0.04) 100%)",
                border: "1px solid rgba(140, 95, 248, 0.2)",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: 16,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <span style={{ fontSize: 11.5, color: "#7a748e", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>
                  Pitched Amount
                </span>
                <strong style={{ fontSize: 18, fontWeight: 700 }}>
                  ₹{baseAmt.toLocaleString("en-IN")}
                </strong>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <span style={{ fontSize: 11.5, color: "#7a748e", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>
                  GST ({isOnline ? "18%" : "0%"})
                </span>
                <strong style={{ fontSize: 18, fontWeight: 700, color: isOnline ? "#8c5ff8" : "#7a748e" }}>
                  ₹{(newClient.gstAmount || 0).toLocaleString("en-IN")}
                </strong>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <span style={{ fontSize: 11.5, color: "#7a748e", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>
                  Total Payable
                </span>
                <strong style={{ fontSize: 18, fontWeight: 700, color: "#10b981" }}>
                  ₹{(newClient.totalPayment || 0).toLocaleString("en-IN")}
                </strong>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <span style={{ fontSize: 11.5, color: "#7a748e", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>
                  Pending Balance
                </span>
                <strong
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: (newClient.paymentPending || 0) > 0 ? "#f43f5e" : "#10b981",
                  }}
                >
                  ₹{(newClient.paymentPending || 0).toLocaleString("en-IN")}
                </strong>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="sales-form-actions">
            <button
              type="button"
              className="sales-btn-secondary"
              onClick={onClearForm}
            >
              Clear Form
            </button>
            <button
              type="submit"
              className="sales-add-btn"
            >
              <span>+ Register</span>
            </button>
          </div>

          {formSuccessMsg && (
            <div
              style={{
                marginTop: 16,
                padding: "14px 18px",
                borderRadius: 10,
                background: "linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%)",
                border: "1px solid rgba(16, 185, 129, 0.35)",
                color: "#10b981",
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: 13.5,
                fontWeight: 600,
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.1)"
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 6 9 17l-5-5"/>
              </svg>
              <span>{formSuccessMsg}</span>
            </div>
          )}
        </form>
      </div>
    </section>
  );
}


