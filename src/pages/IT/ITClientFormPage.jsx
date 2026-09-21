import React, { useState, useEffect } from "react";
import Icon from "../../components/Icon";
import { companyITServices, branchOptions } from "./mockITData";
import "./ITDashboard.css";

export default function ITClientFormPage({
  preselectedService,
  onClearPreselectedService,
  onClientCreated,
  onNavigateToDetails,
}) {
  const initialService = typeof preselectedService === "object" && preselectedService !== null
    ? preselectedService
    : companyITServices.find((s) => s.name === preselectedService) || companyITServices[0];

  const [formData, setFormData] = useState({
    company: "",
    name: "",
    email: "",
    phone: "",
    address: "",
    branch: "East",
    serviceName: initialService?.name || companyITServices[0]?.name || "",
    slaTier: initialService?.tag?.includes("24/7") ? "Urgent 24h" : "Standard Retainer",
    amount: String(initialService?.baseAmount || 18000),
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
    const found = companyITServices.find((s) => s.name === sName || s.id === preselectedService?.id);
    if (found) {
      setFormData((prev) => ({
        ...prev,
        serviceName: found.name,
        amount: String(found.baseAmount || 25000),
        slaTier: found.tag?.includes("24/7") ? "Urgent 24h" : found.tag?.includes("Security") ? "High Priority" : "Standard Retainer",
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
        const found = companyITServices.find((s) => s.name === value);
        if (found) {
          next.amount = String(found.baseAmount || 25000);
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
      salesPerson: "IT Administrator",
      serviceType: "IT",
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
      notes: formData.notes || `Onboarded directly via IT Portal for ${formData.serviceName}.`,
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
      serviceName: companyITServices[0]?.name || "",
      slaTier: "Standard Retainer",
      amount: String(companyITServices[0]?.baseAmount || 18000),
      paymentMode: "Online",
      paymentReceived: "",
      gstNumber: "",
      panNumber: "",
      notes: "",
      stage: "Active",
    });
  };

  const selectedServiceObj = companyITServices.find((s) => s.name === formData.serviceName) || companyITServices[0];

  return (
    <div className="it-page-container it-client-page">
      {/* Header Banner */}
      <div className="it-header-banner">
        <div>
          <span className="it-kicker">IT CLIENT MANAGEMENT &amp; ONBOARDING</span>
          <h2 className="it-title">Create New IT Client</h2>
          <p className="it-desc">
            Register new corporate client profiles for enterprise IT infrastructure, cybersecurity, and maintenance solutions.
          </p>
        </div>

        <button
          type="button"
          className="it-btn-secondary"
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
                Service scope, SLA priority ({formData.slaTier}), and base estimate (₹{Number(formData.amount).toLocaleString("en-IN")}) pre-populated.
              </div>
            </div>
          </div>
          {onClearPreselectedService && (
            <button
              type="button"
              className="it-btn-secondary"
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
                fontWeight: 700,
              }}
            >
              ✓
            </div>
            <div>
              <strong style={{ color: "#10b981", fontSize: 15 }}>
                Client "{submittedClient.company}" successfully created!
              </strong>
              <div style={{ fontSize: 13, marginTop: 2, color: "#64748b" }}>
                Assigned to <strong>{submittedClient.branch} Branch</strong> for <strong>{submittedClient.serviceName}</strong> (₹{Number(submittedClient.totalPayment).toLocaleString("en-IN")}).
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              className="it-btn-primary"
              onClick={onNavigateToDetails}
              style={{ padding: "7px 14px", fontSize: 12 }}
            >
              View in Details Table →
            </button>
            <button
              type="button"
              onClick={() => setSubmittedClient(null)}
              style={{
                background: "transparent",
                border: "none",
                color: "#64748b",
                fontSize: 18,
                cursor: "pointer",
                padding: "0 6px",
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr", gap: 24 }}>
        {/* Left Column: Client Creation Form */}
        <section className="it-panel-card">
          <div style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: 14, marginBottom: 20 }}>
            <h3 className="it-panel-header-title">Client Registration Form</h3>
            <p className="it-desc" style={{ marginTop: 4 }}>
              Enter enterprise company details, primary technical contact, and IT service parameters.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Row 1: Company Name & Contact Person */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label className="it-form-label">
                  Company Name <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  name="company"
                  className="it-form-input"
                  value={formData.company}
                  onChange={handleInputChange}
                  placeholder="e.g. Apex Cybernetics Pvt Ltd"
                />
                {formErrors.company && (
                  <span style={{ color: "#ef4444", fontSize: 11, marginTop: 4, display: "block" }}>
                    {formErrors.company}
                  </span>
                )}
              </div>

              <div>
                <label className="it-form-label">
                  Contact Person <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  className="it-form-input"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Rohan Varma"
                />
                {formErrors.name && (
                  <span style={{ color: "#ef4444", fontSize: 11, marginTop: 4, display: "block" }}>
                    {formErrors.name}
                  </span>
                )}
              </div>
            </div>

            {/* Row 2: Email & Phone */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label className="it-form-label">
                  Work Email <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  className="it-form-input"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="e.g. contact@apexcyber.com"
                />
                {formErrors.email && (
                  <span style={{ color: "#ef4444", fontSize: 11, marginTop: 4, display: "block" }}>
                    {formErrors.email}
                  </span>
                )}
              </div>

              <div>
                <label className="it-form-label">
                  Phone Number <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  className="it-form-input"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="e.g. +91 98765 43210"
                />
                {formErrors.phone && (
                  <span style={{ color: "#ef4444", fontSize: 11, marginTop: 4, display: "block" }}>
                    {formErrors.phone}
                  </span>
                )}
              </div>
            </div>

            {/* Row 3: Branch Selection & IT Service Request */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label className="it-form-label">
                  Branch Location <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <select
                  name="branch"
                  className="it-form-select"
                  value={formData.branch}
                  onChange={handleInputChange}
                >
                  {branchOptions.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="it-form-label">
                  IT Service Request <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <select
                  name="serviceName"
                  className="it-form-select"
                  value={formData.serviceName}
                  onChange={handleInputChange}
                >
                  {companyITServices.map((srv) => (
                    <option key={srv.id} value={srv.name}>
                      {srv.name} ({srv.estimate})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 4: SLA Priority Tier & Lifecycle Stage */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label className="it-form-label">
                  SLA Priority Tier
                </label>
                <select
                  name="slaTier"
                  className="it-form-select"
                  value={formData.slaTier}
                  onChange={handleInputChange}
                >
                  <option value="Urgent 24h">Urgent 24h Expedited SLA</option>
                  <option value="High Priority">High Priority (48h Resolution)</option>
                  <option value="Standard Retainer">Standard Monthly Retainer</option>
                  <option value="Enterprise Dedicated">Enterprise Dedicated Cluster</option>
                </select>
              </div>

              <div>
                <label className="it-form-label">
                  Initial Stage
                </label>
                <select
                  name="stage"
                  className="it-form-select"
                  value={formData.stage}
                  onChange={handleInputChange}
                >
                  <option value="Active">Active / In Production</option>
                  <option value="In Progress">In Progress / Technical Audit</option>
                  <option value="Agreement">Agreement Execution</option>
                  <option value="Proposal Sent">Proposal Sent / Review</option>
                </select>
              </div>
            </div>

            {/* Financial Parameters Box */}
            <div className="it-subcard" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>
                Financial &amp; Billing Terms
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                <div>
                  <label className="it-form-label">
                    Base Service Rate (₹) <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="number"
                    name="amount"
                    className="it-form-input"
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="18000"
                  />
                  {formErrors.amount && (
                    <span style={{ color: "#ef4444", fontSize: 10, marginTop: 2, display: "block" }}>
                      {formErrors.amount}
                    </span>
                  )}
                </div>

                <div>
                  <label className="it-form-label">
                    Payment Mode
                  </label>
                  <select
                    name="paymentMode"
                    className="it-form-select"
                    value={formData.paymentMode}
                    onChange={handleInputChange}
                  >
                    <option value="Online">Online / Bank Wire (18% GST)</option>
                    <option value="Cheque">Corporate Cheque</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>

                <div>
                  <label className="it-form-label">
                    Advance Received (₹)
                  </label>
                  <input
                    type="number"
                    name="paymentReceived"
                    className="it-form-input"
                    value={formData.paymentReceived}
                    onChange={handleInputChange}
                    placeholder="e.g. 18000"
                  />
                </div>
              </div>

              {/* Calculated Summary Pill */}
              <div
                className="it-subcard"
                style={{
                  marginTop: 12,
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12,
                }}
              >
                <span>
                  Base: <strong>₹{amountNum.toLocaleString("en-IN")}</strong> + GST (18%):{" "}
                  <strong>₹{gstAmount.toLocaleString("en-IN")}</strong>
                </span>
                <span>
                  Total: <strong style={{ color: "#4e7cff", fontSize: 13 }}>₹{totalPayment.toLocaleString("en-IN")}</strong> | Pending:{" "}
                  <strong style={{ color: paymentPending > 0 ? "#f59e0b" : "#10b981" }}>
                    ₹{paymentPending.toLocaleString("en-IN")}
                  </strong>
                </span>
              </div>
            </div>

            {/* Address & Technical Scope Notes */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <div>
                <label className="it-form-label">
                  Office Address
                </label>
                <input
                  type="text"
                  name="address"
                  className="it-form-input"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="e.g. Plot 12, Salt Lake Sector V, Kolkata"
                />
              </div>

              <div>
                <label className="it-form-label">
                  Technical Scope &amp; Notes
                </label>
                <input
                  type="text"
                  name="notes"
                  className="it-form-input"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="e.g. Requires 24/7 DB replication monitoring & 2FA setup"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                type="reset"
                className="it-btn-secondary"
                onClick={() =>
                  setFormData({
                    company: "",
                    name: "",
                    email: "",
                    phone: "",
                    address: "",
                    branch: "East",
                    serviceName: companyITServices[0]?.name || "",
                    slaTier: "Standard Retainer",
                    amount: String(companyITServices[0]?.baseAmount || 18000),
                    paymentMode: "Online",
                    paymentReceived: "",
                    gstNumber: "",
                    panNumber: "",
                    notes: "",
                    stage: "Active",
                  })
                }
              >
                Clear Form
              </button>

              <button
                type="submit"
                className="it-btn-primary"
              >
                <Icon name="plus" size={16} />
                <span>Create IT Client</span>
              </button>
            </div>
          </form>
        </section>

        {/* Right Column: Selected IT Service Preview & Specs Card */}
        <aside>
          <div className="it-panel-card" style={{ position: "sticky", top: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span
                className="it-badge"
                style={{
                  background: "rgba(78, 124, 255, 0.15)",
                  color: "#4e7cff",
                }}
              >
                {selectedServiceObj.tag}
              </span>
              <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>
                {selectedServiceObj.turnaround}
              </span>
            </div>

            <h4 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700 }}>
              {selectedServiceObj.name}
            </h4>

            <p className="it-desc" style={{ marginBottom: 16 }}>
              {selectedServiceObj.description}
            </p>

            <div className="it-subcard" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: "#64748b" }}>Standard Pricing Estimate</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#4e7cff", marginTop: 2 }}>
                {selectedServiceObj.estimate}
              </div>
            </div>

            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
              Deliverables &amp; SLA Inclusions:
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {selectedServiceObj.features.map((feat, idx) => (
                <div key={idx} className="it-service-feature-row">
                  <span style={{ color: "#10b981", fontWeight: 700 }}>✓</span>
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: 18,
                paddingTop: 14,
                borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                fontSize: 11,
                color: "#64748b",
                lineHeight: 1.4,
              }}
            >
              🔒 All IT clients created will appear automatically in the <strong>Details</strong> table under the selected branch.
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
