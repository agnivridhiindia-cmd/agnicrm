import React, { useState, useEffect } from "react";
import Icon from "../../components/Icon";
import { companyMarketingServices, branchOptions } from "./mockMarketingData";
import "./MarketingDashboard.css";

export default function MarketingClientFormPage({
  preselectedService,
  onClearPreselectedService,
  onClientCreated,
  onNavigateToDetails,
}) {
  const initialService = typeof preselectedService === "object" && preselectedService !== null
    ? preselectedService
    : companyMarketingServices.find((s) => s.name === preselectedService) || companyMarketingServices[0];

  const [formData, setFormData] = useState({
    company: "",
    name: "",
    email: "",
    phone: "",
    address: "",
    branch: "East",
    serviceName: initialService?.name || companyMarketingServices[0]?.name || "",
    slaTier: initialService?.tag?.includes("Conversion") ? "Urgent 24h" : "Standard Retainer",
    amount: String(initialService?.baseAmount || 25000),
    paymentMode: "Online",
    paymentReceived: "",
    gstNumber: "",
    panNumber: "",
    notes: initialService?.scopeDetails || initialService?.description || "",
    stage: "Active",
  });

  useEffect(() => {
    if (!preselectedService) return;
    const sName = typeof preselectedService === "string" ? preselectedService : preselectedService?.name;
    const found = companyMarketingServices.find((s) => s.name === sName || s.id === preselectedService?.id);
    if (found) {
      setFormData((prev) => ({
        ...prev,
        serviceName: found.name,
        amount: String(found.baseAmount || 25000),
        slaTier: found.tag?.includes("Conversion") || found.tag?.includes("Launch") ? "Urgent 24h" : "Standard Retainer",
        notes: found.scopeDetails || found.description || "",
      }));
    }
  }, [preselectedService]);

  const [submittedClient, setSubmittedClient] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const pitchedAmt = parseFloat(formData.amount) || 0;
  const isOnline = formData.paymentMode === "Online";
  const gstAmount = isOnline ? Math.round(pitchedAmt * 0.18) : 0;
  const totalPayment = isOnline ? Math.round(pitchedAmt * 1.18) : pitchedAmt;
  const receivedNum = parseFloat(formData.paymentReceived) || 0;
  const paymentPending = Math.max(totalPayment - receivedNum, 0);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "serviceName") {
        const found = companyMarketingServices.find((s) => s.name === value);
        if (found) {
          next.amount = String(found.baseAmount || 25000);
          next.notes = found.scopeDetails || found.description || "";
        }
      }
      return next;
    });

    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.company.trim()) errors.company = "Company name is required";
    if (!formData.name.trim()) errors.name = "Contact person name is required";
    if (!formData.email.trim()) errors.email = "Email address is required";
    if (!formData.phone.trim()) errors.phone = "Phone number is required";
    if (!formData.amount || Number(formData.amount) <= 0) errors.amount = "Valid service amount is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const newClient = {
      id: Date.now(),
      name: formData.name.trim(),
      company: formData.company.trim(),
      contactPerson: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      address: formData.address.trim() || `${formData.branch} Zone Corporate Office`,
      branch: formData.branch,
      salesPerson: "Marketing Lead",
      serviceType: "Marketing",
      serviceName: formData.serviceName,
      amount: String(amountNum),
      paymentMode: formData.paymentMode,
      gstAmount,
      totalPayment,
      paymentReceived: String(receivedNum),
      paymentPending,
      stage: formData.stage || "Active",
      applicationStatus: "Final Approval",
      slaTier: formData.slaTier,
      progress: 100,
      createdDate: new Date().toISOString().split("T")[0],
      notes: formData.notes || `Onboarded directly via Marketing Portal for ${formData.serviceName}.`,
      isDirectCreated: true,
    };

    onClientCreated(newClient);
    setSubmittedClient(newClient);

    setFormData({
      company: "",
      name: "",
      email: "",
      phone: "",
      address: "",
      branch: "East",
      serviceName: companyMarketingServices[0]?.name || "",
      slaTier: "Standard Retainer",
      amount: String(companyMarketingServices[0]?.baseAmount || 25000),
      paymentMode: "Online",
      paymentReceived: "",
      gstNumber: "",
      panNumber: "",
      notes: "",
      stage: "Active",
    });
  };

  const selectedServiceObj = companyMarketingServices.find((s) => s.name === formData.serviceName) || companyMarketingServices[0];

  return (
    <div className="mkt-page-container mkt-client-page">
      {/* Header Banner */}
      <div className="mkt-header-banner">
        <div>
          <span className="mkt-kicker">MARKETING CLIENT ONBOARDING &amp; ACQUISITION</span>
          <h2 className="mkt-title">Create New Marketing Client</h2>
          <p className="mkt-desc">
            Register corporate marketing client profiles, configure campaign channels, and generate automated GST retainer estimates.
          </p>
        </div>

        <button
          type="button"
          className="mkt-btn-secondary"
          onClick={onNavigateToDetails}
        >
          <Icon name="overview" size={16} />
          <span>View All Clients (Details)</span>
        </button>
      </div>

      {/* Pre-filled Service Preset Notification */}
      {preselectedService && (
        <div
          style={{
            background: "linear-gradient(135deg, rgba(78, 124, 255, 0.15) 0%, rgba(78, 124, 255, 0.05) 100%)",
            border: "1px solid rgba(78, 124, 255, 0.35)",
            borderRadius: 14,
            padding: "14px 18px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "#4e7cff",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: 14,
              }}
            >
              ★
            </span>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700 }}>
                Auto-Configured for: <span style={{ color: "#4e7cff" }}>{formData.serviceName}</span>
              </div>
              <div style={{ fontSize: 12, color: "#64748b" }}>
                Deliverables, SLA priority ({formData.slaTier}), and base estimate (₹{Number(formData.amount).toLocaleString("en-IN")}) pre-populated.
              </div>
            </div>
          </div>
          {onClearPreselectedService && (
            <button
              type="button"
              className="mkt-btn-secondary"
              style={{ padding: "5px 12px", fontSize: 11.5 }}
              onClick={onClearPreselectedService}
            >
              Reset to Default
            </button>
          )}
        </div>
      )}

      {/* Success Notification Alert */}
      {submittedClient && (
        <div
          style={{
            background: "linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)",
            border: "1px solid rgba(16, 185, 129, 0.35)",
            borderRadius: 12,
            padding: "16px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "#10b981",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
              }}
            >
              ✓
            </div>
            <div>
              <strong style={{ fontSize: 14, color: "#10b981" }}>
                Client Successfully Created!
              </strong>
              <p style={{ margin: 0, fontSize: 12.5, color: "#64748b" }}>
                <strong>{submittedClient.company}</strong> has been onboarded under {submittedClient.branch} Branch with ID #{submittedClient.id}.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="mkt-btn-secondary"
            onClick={() => setSubmittedClient(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr", gap: 24 }}>
        {/* Left Form Panel */}
        <section className="mkt-panel-card">
          <form onSubmit={handleSubmit}>
            {/* Section 1: Company Profile */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <span className="mkt-badge" style={{ background: "#4e7cff", color: "#fff" }}>
                  Step 1
                </span>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                  Corporate &amp; Contact Coordinates
                </h3>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div style={{ gridColumn: "span 2" }}>
                  <label className="mkt-form-label">
                    Company / Organization Name <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="company"
                    className="mkt-form-input"
                    placeholder="e.g. Horizon D2C Brands Pvt Ltd"
                    value={formData.company}
                    onChange={handleInputChange}
                  />
                  {formErrors.company && (
                    <span style={{ fontSize: 11, color: "#ef4444", marginTop: 3, display: "block" }}>
                      {formErrors.company}
                    </span>
                  )}
                </div>

                <div>
                  <label className="mkt-form-label">
                    Primary Contact Person <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    className="mkt-form-input"
                    placeholder="e.g. Rohan Varma (CMO)"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                  {formErrors.name && (
                    <span style={{ fontSize: 11, color: "#ef4444", marginTop: 3, display: "block" }}>
                      {formErrors.name}
                    </span>
                  )}
                </div>

                <div>
                  <label className="mkt-form-label">
                    Branch Assignment <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <select
                    name="branch"
                    className="mkt-form-select"
                    value={formData.branch}
                    onChange={handleInputChange}
                  >
                    {branchOptions.map((b) => (
                      <option key={b} value={b}>
                        {b} Branch
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mkt-form-label">
                    Official Email <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    className="mkt-form-input"
                    placeholder="marketing@horizond2c.com"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                  {formErrors.email && (
                    <span style={{ fontSize: 11, color: "#ef4444", marginTop: 3, display: "block" }}>
                      {formErrors.email}
                    </span>
                  )}
                </div>

                <div>
                  <label className="mkt-form-label">
                    Contact Phone Number <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    className="mkt-form-input"
                    placeholder="+91 98300 12345"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                  {formErrors.phone && (
                    <span style={{ fontSize: 11, color: "#ef4444", marginTop: 3, display: "block" }}>
                      {formErrors.phone}
                    </span>
                  )}
                </div>

                <div style={{ gridColumn: "span 2" }}>
                  <label className="mkt-form-label">Office / Billing Address</label>
                  <input
                    type="text"
                    name="address"
                    className="mkt-form-input"
                    placeholder="e.g. Plot 24, Salt Lake Sector V, Kolkata"
                    value={formData.address}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Marketing Service Selection */}
            <div style={{ marginBottom: 24, paddingTop: 16, borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <span className="mkt-badge" style={{ background: "#10b981", color: "#fff" }}>
                  Step 2
                </span>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                  Marketing Service Line &amp; SLA
                </h3>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div style={{ gridColumn: "span 2" }}>
                  <label className="mkt-form-label">
                    Selected Marketing Service Request <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <select
                    name="serviceName"
                    className="mkt-form-select"
                    value={formData.serviceName}
                    onChange={handleInputChange}
                  >
                    {companyMarketingServices.map((srv) => (
                      <option key={srv.id} value={srv.name}>
                        {srv.name} — {srv.estimate} ({srv.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mkt-form-label">SLA Turnaround Tier</label>
                  <select
                    name="slaTier"
                    className="mkt-form-select"
                    value={formData.slaTier}
                    onChange={handleInputChange}
                  >
                    <option value="Urgent 24h">Urgent 24h (Priority Launch)</option>
                    <option value="High Priority">High Priority (48h Turnaround)</option>
                    <option value="Standard Retainer">Standard Monthly Retainer</option>
                  </select>
                </div>

                <div>
                  <label className="mkt-form-label">Initial Client Stage</label>
                  <select
                    name="stage"
                    className="mkt-form-select"
                    value={formData.stage}
                    onChange={handleInputChange}
                  >
                    <option value="Active">Active / Live Campaign</option>
                    <option value="In Progress">In Progress (Creative Prep)</option>
                    <option value="Agreement">Agreement Sent</option>
                  </select>
                </div>

                <div style={{ gridColumn: "span 2" }}>
                  <label className="mkt-form-label">Custom Scope Notes &amp; Campaign Objectives</label>
                  <textarea
                    name="notes"
                    rows="3"
                    className="mkt-form-textarea"
                    placeholder="Specific target audience, monthly ad spend budget, keyword themes, or creative preferences..."
                    value={formData.notes}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Billing & Financials */}
            <div style={{ marginBottom: 24, paddingTop: 16, borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <span className="mkt-badge" style={{ background: "#9a74e9", color: "#fff" }}>
                  Step 3
                </span>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                  Billing, GST &amp; Payment Ledger
                </h3>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label className="mkt-form-label">
                    Base Retainer Fee (₹) <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="number"
                    name="amount"
                    className="mkt-form-input"
                    placeholder="25000"
                    value={formData.amount}
                    onChange={handleInputChange}
                  />
                  {formErrors.amount && (
                    <span style={{ fontSize: 11, color: "#ef4444", marginTop: 3, display: "block" }}>
                      {formErrors.amount}
                    </span>
                  )}
                </div>

                <div>
                  <label className="mkt-form-label">Payment Channel</label>
                  <select
                    name="paymentMode"
                    className="mkt-form-select"
                    value={formData.paymentMode}
                    onChange={handleInputChange}
                  >
                    <option value="Online">Online / NEFT (18% GST Applied)</option>
                    <option value="Cheque">Corporate Cheque (18% GST)</option>
                    <option value="Cash">Cash (Direct Entry)</option>
                  </select>
                </div>

                <div>
                  <label className="mkt-form-label">Advance / Amount Received (₹)</label>
                  <input
                    type="number"
                    name="paymentReceived"
                    className="mkt-form-input"
                    placeholder="e.g. 20000"
                    value={formData.paymentReceived}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label className="mkt-form-label">GSTIN / Tax ID (Optional)</label>
                  <input
                    type="text"
                    name="gstNumber"
                    className="mkt-form-input"
                    placeholder="19ABCDE1234F1Z5"
                    value={formData.gstNumber}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, paddingTop: 16, borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
              <button
                type="button"
                className="mkt-btn-secondary"
                onClick={() => onNavigateToDetails && onNavigateToDetails()}
              >
                Cancel
              </button>
              <button type="submit" className="mkt-btn-primary">
                <Icon name="plus" size={16} />
                <span>Onboard Marketing Client</span>
              </button>
            </div>
          </form>
        </section>

        {/* Right Sidebar: Real-time Invoice & Service Preview */}
        <aside style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Live Financial Breakdown Card */}
          <div className="mkt-panel-card">
            <div className="mkt-panel-header">
              <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>
                Invoice &amp; Tax Computation
              </h4>
              <span className="mkt-badge" style={{ background: "rgba(78, 124, 255, 0.15)", color: "#4e7cff" }}>
                Auto-Calc
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "#64748b" }}>Base Retainer Amount</span>
                <strong>₹{amountNum.toLocaleString("en-IN")}</strong>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "#64748b" }}>18% GST (CGST+SGST)</span>
                <strong>₹{gstAmount.toLocaleString("en-IN")}</strong>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 16,
                  fontWeight: 800,
                  paddingTop: 10,
                  borderTop: "1px dashed rgba(255, 255, 255, 0.12)",
                }}
              >
                <span>Total Invoiced</span>
                <span style={{ color: "#4e7cff" }}>₹{totalPayment.toLocaleString("en-IN")}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, paddingTop: 4 }}>
                <span style={{ color: "#10b981", fontWeight: 600 }}>Amount Received</span>
                <span style={{ color: "#10b981", fontWeight: 700 }}>₹{receivedNum.toLocaleString("en-IN")}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: paymentPending > 0 ? "#ef4444" : "#10b981", fontWeight: 600 }}>
                  Balance Pending
                </span>
                <span style={{ color: paymentPending > 0 ? "#ef4444" : "#10b981", fontWeight: 700 }}>
                  ₹{paymentPending.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          {/* Service Line Details Box */}
          {selectedServiceObj && (
            <div className="mkt-panel-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <span
                    className="mkt-badge"
                    style={{
                      background: `${selectedServiceObj.tone}22`,
                      color: selectedServiceObj.tone,
                      fontSize: 10.5,
                      marginBottom: 4,
                    }}
                  >
                    {selectedServiceObj.category}
                  </span>
                  <h4 style={{ margin: "4px 0 0", fontSize: 15, fontWeight: 700 }}>
                    {selectedServiceObj.name}
                  </h4>
                </div>
              </div>

              <p style={{ fontSize: 12.5, color: "#64748b", lineHeight: 1.5, margin: "0 0 14px" }}>
                {selectedServiceObj.description}
              </p>

              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
                Standard Deliverables:
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {selectedServiceObj.features.slice(0, 4).map((f, i) => (
                  <div key={i} style={{ fontSize: 12, color: "#94a3b8", display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: "#10b981" }}>✓</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
