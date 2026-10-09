import React, { useState, useEffect, useMemo } from "react";
import Modal from "../../../components/Modal";
import Icon from "../../../components/Icon";
import { AGREEMENT_TYPES, AGREEMENT_STATUSES } from "../mockAgreementData";

export default function AgreementFormModal({
  isOpen,
  onClose,
  agreementType,
  clients = [],
  onSubmitAgreement,
  existingAgreements = [],
}) {
  const isScheme = agreementType === AGREEMENT_TYPES.SCHEME;

  // Selected client ID
  const [selectedClientId, setSelectedClientId] = useState("");

  // 7 Form Fields matching PDF bracketed placeholders
  const [agreementDate, setAgreementDate] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [pitchedMoney, setPitchedMoney] = useState("");
  const [paymentReceived, setPaymentReceived] = useState("");
  const [paymentLeft, setPaymentLeft] = useState("");
  const [disbursementRate, setDisbursementRate] = useState("5%");

  // Errors
  const [errors, setErrors] = useState({});

  // Auto-select first client if available on open
  useEffect(() => {
    if (clients.length > 0 && !selectedClientId) {
      setSelectedClientId(clients[0].id.toString());
    }
  }, [clients, selectedClientId]);

  // Selected client object
  const activeClient = useMemo(() => {
    return clients.find((c) => c.id.toString() === selectedClientId.toString()) || null;
  }, [clients, selectedClientId]);

  // Auto-populate 7 fields whenever active client changes
  useEffect(() => {
    if (!activeClient) return;
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    setAgreementDate(`${dd}/${mm}/${yyyy}`);
    setCompanyName(activeClient.company || activeClient.name || "");
    setCompanyAddress(activeClient.address || "Corporate Business District, Registered Office");
    setPitchedMoney(
      activeClient.totalPayment
        ? `₹${activeClient.totalPayment.toLocaleString("en-IN")}`
        : "₹50,000"
    );
    setPaymentReceived(
      activeClient.paymentReceived
        ? `₹${activeClient.paymentReceived.toLocaleString("en-IN")}`
        : "₹20,000"
    );
    setPaymentLeft(
      activeClient.totalPayment && activeClient.paymentReceived
        ? `₹${(activeClient.totalPayment - activeClient.paymentReceived).toLocaleString("en-IN")}`
        : "₹30,000"
    );
    setDisbursementRate("5%");
    setErrors({});
  }, [activeClient]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!activeClient) newErrors.client = "Please select an existing CRM client.";
    if (!agreementDate.trim()) newErrors.agreementDate = "Agreement Execution Date is required.";
    if (!companyName.trim()) newErrors.companyName = "Company Name is required.";
    if (!companyAddress.trim()) newErrors.companyAddress = "Company Address is required.";
    if (!pitchedMoney.trim()) newErrors.pitchedMoney = "Total Pitched Fee is required.";
    if (!paymentReceived.trim()) newErrors.paymentReceived = "Payment Received is required.";
    if (!paymentLeft.trim()) newErrors.paymentLeft = "Payment Left is required.";
    if (!disbursementRate.trim()) newErrors.disbursementRate = "Disbursement Success Fee % is required.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const nextNumber = 500 + existingAgreements.length + 1;
    const now = new Date();
    const yyyymmdd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    const agreementId = `AGR-${yyyymmdd}-${nextNumber}`;
    const nowStr = new Date().toISOString().replace("T", " ").substring(0, 16);

    const agreementRecord = {
      id: agreementId,
      crmId: activeClient.id,
      clientId: activeClient.id,
      appId: activeClient.appId || `CRM-${activeClient.id}`,
      clientName: activeClient.name,
      companyName: companyName.trim(),
      companyAddress: companyAddress.trim(),
      email: activeClient.email,
      phone: activeClient.phone,
      address: companyAddress.trim(),
      branch: activeClient.branch || "West Zone (Mumbai)",
      templateType: agreementType,
      scheme: isScheme ? activeClient.scheme || "PMEGP" : "Private Funding",
      status: AGREEMENT_STATUSES.READY,
      createdAt: nowStr,
      agreementDate: agreementDate.trim(),
      pitchedMoney: pitchedMoney.trim(),
      paymentReceived: paymentReceived.trim(),
      paymentLeft: paymentLeft.trim(),
      disbursementRate: disbursementRate.trim(),
      agreement: {
        templateName: isScheme ? "Common Scheme Agreement" : "Private Funding Agreement",
        status: AGREEMENT_STATUSES.READY,
        date: agreementDate.trim(),
        pricing: {
          pitched: pitchedMoney.trim(),
          received: paymentReceived.trim(),
          left: paymentLeft.trim(),
          successRate: disbursementRate.trim(),
        },
      },
    };

    onSubmitAgreement(agreementRecord, activeClient);
  };

  return (
    <Modal
      title={`Create ${isScheme ? "Scheme" : "Private Funding"} Agreement`}
      onClose={onClose}
      closeLabel="Cancel"
    >
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 18, minWidth: 320, maxWidth: 680 }}>
        {/* Step 1: Select CRM Client */}
        <div>
          <label className="field-label" style={{ display: "block", marginBottom: 6 }}>
            Select Existing CRM Client <span style={{ color: "#e11d48" }}>*</span>
          </label>
          <select
            value={selectedClientId}
            onChange={(e) => {
              setSelectedClientId(e.target.value);
              setErrors((prev) => ({ ...prev, client: null }));
            }}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: errors.client ? "1.5px solid #e11d48" : "1px solid #dcdfe6",
              fontSize: 13.5,
              background: "#fff",
              outline: "none",
            }}
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.company}) — App ID: {c.appId} [{c.scheme || "General"}]
              </option>
            ))}
          </select>
          {errors.client && <span style={{ color: "#e11d48", fontSize: 12, marginTop: 4, display: "block" }}>{errors.client}</span>}
        </div>

        {/* Auto-populated Client Information Card */}
        {activeClient && (
          <div
            style={{
              background: "#fbfbfe",
              padding: 14,
              borderRadius: 12,
              border: "1px solid #e7e7f5",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 10,
            }}
          >
            <div>
              <p className="eyebrow" style={{ margin: "0 0 2px" }}>Client &amp; Company</p>
              <strong style={{ fontSize: 13.5 }}>{activeClient.name}</strong>
              <div style={{ fontSize: 12, color: "#7a748e" }}>{activeClient.company}</div>
            </div>
            <div>
              <p className="eyebrow" style={{ margin: "0 0 2px" }}>Application &amp; Scheme</p>
              <strong style={{ fontSize: 13.5, color: isScheme ? "#4f46e5" : "#db2777" }}>
                {activeClient.scheme || "Standard"}
              </strong>
              <div style={{ fontSize: 11.5, color: "#7a748e" }}>ID: <code>{activeClient.appId}</code></div>
            </div>
            <div>
              <p className="eyebrow" style={{ margin: "0 0 2px" }}>Email &amp; Phone</p>
              <strong style={{ fontSize: 12.5 }}>{activeClient.email}</strong>
              <div style={{ fontSize: 11.5, color: "#7a748e" }}>{activeClient.phone}</div>
            </div>
            <div>
              <p className="eyebrow" style={{ margin: "0 0 2px" }}>Contract Commercial</p>
              <strong style={{ fontSize: 13.5, color: "#059669" }}>
                ₹{(activeClient.totalPayment || activeClient.amount || 0).toLocaleString("en-IN")}
              </strong>
              <div style={{ fontSize: 11.5, color: "#7a748e" }}>Officer: {activeClient.assignedSalesPerson || "Branch"}</div>
            </div>
          </div>
        )}

        {/* Step 2: 7 Dynamic PDF Placeholder Parameters */}
        <div style={{ background: "#f8faff", padding: 14, borderRadius: 12, border: "1px solid #e0e7ff", display: "grid", gap: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.8, color: "#4f46e5" }}>
              7 Dynamic Agreement Fields (PDF Placeholders):
            </span>
            <span className="admin-badge" style={{ fontSize: 11, background: "rgba(78, 124, 255, 0.15)", color: "#4f46e5" }}>
              Auto-Populated from CRM
            </span>
          </div>

          {/* 1. Agreement Execution Date */}
          <div>
            <label className="field-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span>Agreement Execution Date <span style={{ color: "#e11d48" }}>*</span></span>
              <code style={{ fontSize: 10, color: "#4f46e5", background: "rgba(79, 70, 229, 0.1)", padding: "2px 6px", borderRadius: 4 }}>
                PDF: (FULL DATE)
              </code>
            </label>
            <input
              type="text"
              placeholder="e.g. 17/08/2026"
              value={agreementDate}
              onChange={(e) => {
                setAgreementDate(e.target.value);
                setErrors((prev) => ({ ...prev, agreementDate: null }));
              }}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 8,
                border: errors.agreementDate ? "1.5px solid #e11d48" : "1px solid #dcdfe6",
                fontSize: 13,
                boxSizing: "border-box",
              }}
            />
            {errors.agreementDate && <span style={{ color: "#e11d48", fontSize: 11.5, marginTop: 2, display: "block" }}>{errors.agreementDate}</span>}
          </div>

          {/* 2. Company Name */}
          <div>
            <label className="field-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span>Registered Company / Enterprise Name <span style={{ color: "#e11d48" }}>*</span></span>
              <code style={{ fontSize: 10, color: "#4f46e5", background: "rgba(79, 70, 229, 0.1)", padding: "2px 6px", borderRadius: 4 }}>
                PDF: (COMPANY NAME)
              </code>
            </label>
            <input
              type="text"
              placeholder="e.g. Reliance Retail Ltd"
              value={companyName}
              onChange={(e) => {
                setCompanyName(e.target.value);
                setErrors((prev) => ({ ...prev, companyName: null }));
              }}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 8,
                border: errors.companyName ? "1.5px solid #e11d48" : "1px solid #dcdfe6",
                fontSize: 13,
                boxSizing: "border-box",
              }}
            />
            {errors.companyName && <span style={{ color: "#e11d48", fontSize: 11.5, marginTop: 2, display: "block" }}>{errors.companyName}</span>}
          </div>

          {/* 3. Company Address */}
          <div>
            <label className="field-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span>Principal Place of Business / Registered Address <span style={{ color: "#e11d48" }}>*</span></span>
              <code style={{ fontSize: 10, color: "#4f46e5", background: "rgba(79, 70, 229, 0.1)", padding: "2px 6px", borderRadius: 4 }}>
                PDF: (COMPANY ADDRESS)
              </code>
            </label>
            <input
              type="text"
              placeholder="e.g. Lg-02, H-165, Sector 63, Noida, Uttar Pradesh 201301"
              value={companyAddress}
              onChange={(e) => {
                setCompanyAddress(e.target.value);
                setErrors((prev) => ({ ...prev, companyAddress: null }));
              }}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 8,
                border: errors.companyAddress ? "1.5px solid #e11d48" : "1px solid #dcdfe6",
                fontSize: 13,
                boxSizing: "border-box",
              }}
            />
            {errors.companyAddress && <span style={{ color: "#e11d48", fontSize: 11.5, marginTop: 2, display: "block" }}>{errors.companyAddress}</span>}
          </div>

          {/* 4 & 5. Pitched Fee & Token Received */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label className="field-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span>Total Pitched Commercial <span style={{ color: "#e11d48" }}>*</span></span>
                <code style={{ fontSize: 10, color: "#4f46e5", background: "rgba(79, 70, 229, 0.1)", padding: "2px 6px", borderRadius: 4 }}>
                  (PRICE PITCHED)
                </code>
              </label>
              <input
                type="text"
                placeholder="e.g. ₹50,000"
                value={pitchedMoney}
                onChange={(e) => {
                  setPitchedMoney(e.target.value);
                  setErrors((prev) => ({ ...prev, pitchedMoney: null }));
                }}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: errors.pitchedMoney ? "1.5px solid #e11d48" : "1px solid #dcdfe6",
                  fontSize: 13,
                  boxSizing: "border-box",
                }}
              />
              {errors.pitchedMoney && <span style={{ color: "#e11d48", fontSize: 11.5, marginTop: 2, display: "block" }}>{errors.pitchedMoney}</span>}
            </div>

            <div>
              <label className="field-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span>Stage 1: Token Received <span style={{ color: "#e11d48" }}>*</span></span>
                <code style={{ fontSize: 10, color: "#4f46e5", background: "rgba(79, 70, 229, 0.1)", padding: "2px 6px", borderRadius: 4 }}>
                  (TOKEN MONEY)
                </code>
              </label>
              <input
                type="text"
                placeholder="e.g. ₹20,000"
                value={paymentReceived}
                onChange={(e) => {
                  setPaymentReceived(e.target.value);
                  setErrors((prev) => ({ ...prev, paymentReceived: null }));
                }}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: errors.paymentReceived ? "1.5px solid #e11d48" : "1px solid #dcdfe6",
                  fontSize: 13,
                  boxSizing: "border-box",
                }}
              />
              {errors.paymentReceived && <span style={{ color: "#e11d48", fontSize: 11.5, marginTop: 2, display: "block" }}>{errors.paymentReceived}</span>}
            </div>
          </div>

          {/* 6 & 7. Payment Left & Success Rate */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label className="field-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span>Stage 2: Payment Left <span style={{ color: "#e11d48" }}>*</span></span>
                <code style={{ fontSize: 10, color: "#4f46e5", background: "rgba(79, 70, 229, 0.1)", padding: "2px 6px", borderRadius: 4 }}>
                  (PAYMENT LEFT)
                </code>
              </label>
              <input
                type="text"
                placeholder="e.g. ₹30,000"
                value={paymentLeft}
                onChange={(e) => {
                  setPaymentLeft(e.target.value);
                  setErrors((prev) => ({ ...prev, paymentLeft: null }));
                }}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: errors.paymentLeft ? "1.5px solid #e11d48" : "1px solid #dcdfe6",
                  fontSize: 13,
                  boxSizing: "border-box",
                }}
              />
              {errors.paymentLeft && <span style={{ color: "#e11d48", fontSize: 11.5, marginTop: 2, display: "block" }}>{errors.paymentLeft}</span>}
            </div>

            <div>
              <label className="field-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span>Stage 3: Success Fee % <span style={{ color: "#e11d48" }}>*</span></span>
                <code style={{ fontSize: 10, color: "#4f46e5", background: "rgba(79, 70, 229, 0.1)", padding: "2px 6px", borderRadius: 4 }}>
                  (DISPERSMENT RATE)
                </code>
              </label>
              <input
                type="text"
                placeholder="e.g. 5%"
                value={disbursementRate}
                onChange={(e) => {
                  setDisbursementRate(e.target.value);
                  setErrors((prev) => ({ ...prev, disbursementRate: null }));
                }}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: errors.disbursementRate ? "1.5px solid #e11d48" : "1px solid #dcdfe6",
                  fontSize: 13,
                  boxSizing: "border-box",
                }}
              />
              {errors.disbursementRate && <span style={{ color: "#e11d48", fontSize: 11.5, marginTop: 2, display: "block" }}>{errors.disbursementRate}</span>}
            </div>
          </div>
        </div>

        {/* Modal Buttons */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
          <button type="button" className="table-action" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary-button" style={{ padding: "8px 24px" }}>
            Generate &amp; Save Agreement
          </button>
        </div>
      </form>
    </Modal>
  );
}
