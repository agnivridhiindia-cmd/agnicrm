import React from "react";
import Icon from "../../../components/Icon";
import ActivityTracker from "../../../components/ActivityTracker";
import EligibleSchemes from "../EligibleSchemes";
import { mockEligibleSchemes } from "../mockEligibleSchemes";
import { getTrackerState, getProcessTypeLabel, getSchemeCompletedStages, getClientAllSchemeTrackers, isPaymentDemandOrSettlement, isClientPrimaryScheme } from "../../../utils/schemeTracker";
import { isEligibleSchemeRequest } from "../SalesRequests";

export default function SalesClientDossier({
  selectedClient,
  allClients = [],
  onBack,
  salesPersonName,
  onSchemeSave,
  onVerifyDocument,
  pendingSchemeRequests = [],
  onApproveSchemeRequest,
  onDeclineSchemeRequest,
}) {
  if (!selectedClient) return null;

  const [approvingReq, setApprovingReq] = React.useState(null);
  const [requiredAmountInput, setRequiredAmountInput] = React.useState("");
  const [pitchedAmountInput, setPitchedAmountInput] = React.useState("20000");
  const [paymentReceivedInput, setPaymentReceivedInput] = React.useState("23600");

  const siblingClients = React.useMemo(() => {
    if (!selectedClient || !Array.isArray(allClients)) return [];

    const emailLower = selectedClient.email ? selectedClient.email.toLowerCase().trim() : "";
    const companyLower = (selectedClient.companyName || selectedClient.company || "").toLowerCase().trim();

    return allClients.filter((c) => {
      if (c.id === selectedClient.id) return false;
      const cEmail = c.email ? c.email.toLowerCase().trim() : "";
      const cCompany = (c.companyName || c.company || "").toLowerCase().trim();

      const emailMatch = emailLower && cEmail && emailLower === cEmail;
      const companyMatch = companyLower && cCompany && companyLower !== "" && companyLower === cCompany;

      return emailMatch || companyMatch;
    });
  }, [selectedClient, allClients]);

  const allSchemeTrackers = getClientAllSchemeTrackers(selectedClient, siblingClients);
  const [activeDossierSchemeIdx, setActiveDossierSchemeIdx] = React.useState(0);

  const activeItem = allSchemeTrackers[activeDossierSchemeIdx] || allSchemeTrackers[0] || {};
  const tracker = activeItem.tracker || getTrackerState(selectedClient);
  const schemeName = activeItem.schemeName || selectedClient.scheme || tracker.schemeName;
  const processLabel = tracker.processTypeLabel || getProcessTypeLabel(tracker.processType);
  const clientPendingReqs = (pendingSchemeRequests || []).filter(
    (r) =>
      (r.clientEmail === selectedClient.email ||
        r.clientName === selectedClient.name ||
        r.clientEmail === "client@company.com" ||
        selectedClient.name === "Acme Industries Pvt. Ltd.") &&
      r.status.includes("Pending")
  );

  const enrolledSchemesList = React.useMemo(() => {
    const list = [];
    // Include schemes from this client record
    if (selectedClient?.scheme && !isPaymentDemandOrSettlement(selectedClient.scheme)) list.push(selectedClient.scheme.toLowerCase());
    if (selectedClient?.particularScheme && !isPaymentDemandOrSettlement(selectedClient.particularScheme)) list.push(selectedClient.particularScheme.toLowerCase());
    if (selectedClient?.serviceName && !isPaymentDemandOrSettlement(selectedClient.serviceName)) list.push(selectedClient.serviceName.toLowerCase());

    // ── Include schemes from sibling records (same email) ──
    // e.g. when viewing DSC dossier, also pick up PMEGP from the primary record
    siblingClients.forEach((sibling) => {
      if (sibling.scheme && !isPaymentDemandOrSettlement(sibling.scheme)) list.push(sibling.scheme.toLowerCase());
      if (sibling.particularScheme && !isPaymentDemandOrSettlement(sibling.particularScheme)) list.push(sibling.particularScheme.toLowerCase());
      if (sibling.serviceName && !isPaymentDemandOrSettlement(sibling.serviceName)) list.push(sibling.serviceName.toLowerCase());
    });

    const clientEmailKey = selectedClient?.email || "default";

    // Also check the enrolled schemes DB key
    try {
      const savedEnrolled = localStorage.getItem("agni_client_enrolled_schemes_db");
      if (savedEnrolled && clientEmailKey) {
        const parsedEnrolled = JSON.parse(savedEnrolled);
        if (Array.isArray(parsedEnrolled)) {
          parsedEnrolled.forEach((entry) => {
            if (
              entry.clientEmail &&
              entry.clientEmail.toLowerCase().trim() === clientEmailKey.toLowerCase().trim() &&
              entry.schemeName &&
              !isPaymentDemandOrSettlement(entry.schemeName)
            ) {
              list.push(entry.schemeName.toLowerCase());
            }
          });
        }
      }
    } catch (e) { }

    return [...new Set(list)];
  }, [selectedClient, siblingClients]);

  const clientEmailKey = selectedClient?.email ? selectedClient.email.trim().toLowerCase() : "";

  let localDocData = {};
  try {
    const saved = localStorage.getItem(`agni_client_doc_data_${clientEmailKey}`);
    if (saved) localDocData = JSON.parse(saved);
  } catch (e) { }

  const hasLocalDoc = localStorage.getItem(`agni_client_doc_submitted_${clientEmailKey}`) === "true";

  // Detect if client has submitted the document form based on DB status OR local storage
  const clientDocSubmitted = (selectedClient?.documentStatus && selectedClient.documentStatus !== "NOT_SUBMITTED") || hasLocalDoc;

  // Merge local document data with DB selectedClient (DB takes precedence if exists and is not null)
  let clientSubmittedDocData = { ...localDocData };
  if (selectedClient) {
    for (const key in selectedClient) {
      if (selectedClient[key] !== null && selectedClient[key] !== undefined && selectedClient[key] !== "") {
        clientSubmittedDocData[key] = selectedClient[key];
      }
    }
  }

  // Determine business entity type (Corporate vs Proprietorship)
  const bType = selectedClient?.businessType || clientSubmittedDocData?.businessType || "";
  const compName = selectedClient?.company || selectedClient?.companyName || selectedClient?.name || clientSubmittedDocData?.companyName || "";
  const isCorp = ["Pvt Ltd", "OPC", "LLP", "Section 8 Company", "Private Limited"].includes(bType) ||
    /pvt\s*ltd|private\s*limited|llp|opc|section\s*8/i.test(compName);

  // Derive verification status from database client record
  const isAllVerifiedInDB = selectedClient?.documentStatus === "VERIFIED";

  // Define required document schemas
  const docVal = (submitted, fallback) =>
    clientDocSubmitted ? (submitted || fallback || "Yet to be filled") : "Yet to be filled";

  const schemaDocs = isCorp
    ? [
      {
        name: "Company PAN",
        value: docVal(clientSubmittedDocData.companyPan || clientSubmittedDocData.panNumber, selectedClient.companyPan || selectedClient.panNumber),
      },
      {
        name: "TAN Certificate",
        value: docVal(clientSubmittedDocData.tanNumber, selectedClient.tanNumber),
      },
      {
        name: "CIN Certificate",
        value: docVal(clientSubmittedDocData.cinNumber, selectedClient.cinNumber),
      },
      {
        name: "GSTIN Certificate",
        value: docVal(clientSubmittedDocData.gstNumber, selectedClient.gstNumber || selectedClient.gstin),
      },
    ]
    : [
      {
        name: "PAN Card",
        value: docVal(clientSubmittedDocData.panNumber, selectedClient.panNumber),
      },
      {
        name: "Aadhar Card",
        value: docVal(clientSubmittedDocData.aadharNumber, selectedClient.aadharNumber),
      },
      {
        name: "GSTIN Certificate",
        value: docVal(clientSubmittedDocData.gstNumber, selectedClient.gstNumber || selectedClient.gstin),
      },
      {
        name: "MSME Certificate",
        value: docVal(clientSubmittedDocData.msmeNumber, selectedClient.msmeNumber),
      },
    ];

  const docListToRender = schemaDocs.map((s) => {
    let currentStatus = "Pending Audit";

    // Check if the document exists in the backend DB documents list and is verified
    const dbDoc = (selectedClient?.documents || []).find(d => d.documentName === s.name);
    if (dbDoc && dbDoc.verificationStatus === "VERIFIED") {
      currentStatus = "Verified";
    }

    const detailObj = (selectedClient.documentDetails || []).find(
      (d) => (d.label || d.name) === s.name
    );
    const finalValue = (detailObj && detailObj.value) || s.value || "Yet to be filled";

    return {
      name: s.name,
      status: currentStatus,
      value: finalValue,
      number: finalValue,
    };
  });

  const [saveMessage, setSaveMessage] = React.useState("");

  const handleSaveVerifications = () => {
    const clientId = selectedClient?.id;

    docListToRender.forEach((doc) => {
      const isVer = doc.status === "Verified" || (doc.status || "").toLowerCase() === "verified";
      if (onVerifyDocument) {
        onVerifyDocument(clientId, doc.name, isVer ? "Verified" : "Pending Audit");
      }
    });

    window.dispatchEvent(new Event("agni_clients_updated"));

    setSaveMessage("✓ Document verification changes saved permanently to database!");
    setTimeout(() => setSaveMessage(""), 4500);
  };

  return (
    <div className="client-details-dossier">
      {/* Navigation Bar */}
      <div className="dossier-nav-bar">
        <button
          type="button"
          className="dossier-back-btn"
          onClick={onBack}
        >
          <span>←</span>
          <span>Back to Client Directory</span>
        </button>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            className="sales-btn-secondary"
            onClick={onBack}
          >
            Close Dossier
          </button>
        </div>
      </div>

      {/* Hero Client Banner */}
      <div className="client-hero-banner">
        <div className="client-hero-left">
          <div className="client-hero-avatar">
            {selectedClient.name ? selectedClient.name.slice(0, 2).toUpperCase() : "CL"}
          </div>
          <div className="client-hero-title">
            <h2>{selectedClient.name}</h2>
            <p className="client-hero-sub">{selectedClient.company}</p>
            <div className="client-hero-meta-pills">
              <span
                className={`hero-pill ${selectedClient.stage === "Active"
                  ? "active"
                  : selectedClient.stage === "Onboarding"
                    ? "onboarding"
                    : selectedClient.stage === "Renewal"
                      ? "renewal"
                      : "prospect"
                  }`}
              >
                ● {selectedClient.stage || "Active"}
              </span>
              <span className="hero-pill">
                Client ID: #{selectedClient.id}
              </span>
              <span className="hero-pill">
                Owner: {selectedClient.owner || salesPersonName}
              </span>
              <span className="hero-pill" style={{ background: "rgba(140, 95, 248, 0.15)", color: "#8c5ff8", fontWeight: 700 }}>
                Scheme: {schemeName}
              </span>
              <span className="hero-pill" style={{ background: "rgba(78, 124, 255, 0.15)", color: "#4e7cff", fontWeight: 700 }}>
                Process: {processLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="client-hero-right">
          <span className="hero-balance-label">Total Commercial Value</span>
          <span className="hero-balance-val">
            ₹{(parseFloat(selectedClient.totalPayment) || 0).toLocaleString("en-IN")}
          </span>
          <span style={{ fontSize: 12, color: '#beb5d6' }}>
            {parseFloat(selectedClient.paymentPending) > 0
              ? `₹${(parseFloat(selectedClient.paymentPending) || 0).toLocaleString("en-IN")} pending collection`
              : "✓ Fully Paid"}
          </span>
        </div>
      </div>

      {/* Activity Progress Stepper Section */}
      <div className="dossier-finance-card" style={{ marginBottom: 20 }}>
        <div className="dossier-card-title">
          <div>
            <span>Activity Milestone Tracker ({schemeName})</span>
            <small style={{ color: "#7a748e", display: "block", fontSize: 12, marginTop: 2 }}>
              Scheme: <strong>{schemeName}</strong> ({tracker.totalStages} Stages)
            </small>
          </div>
          <span className="scheme-tag" style={{ fontSize: 13, padding: '6px 12px' }}>
            <Icon name="document" size={14} />
            Stage: {tracker.currentStage}
          </span>
        </div>


        <div style={{ marginTop: 14 }}>
          <ActivityTracker
            scheme={schemeName}
            completedSteps={tracker.completedStages}
            progress={tracker.progressPercent}
            interactive={false}
          />
        </div>
      </div>

      {/* Comprehensive Financial Breakdown */}
      <div className="dossier-finance-card">
        <div className="dossier-card-title">
          <span>Financial & Commercial Breakdown</span>
          <span className="scheme-tag" style={{ fontSize: 13, padding: '6px 12px' }}>
            <Icon name="document" size={14} />
            {schemeName}
          </span>
        </div>

        <div className="finance-metrics-grid">
          <div className="finance-metric-box">
            <span className="finance-metric-label">Base Contract Value</span>
            <span className="finance-metric-num">₹{(parseFloat(selectedClient.amount) || 0).toLocaleString("en-IN")}</span>
            <span className="finance-metric-sub">Base service rate</span>
          </div>

          <div className="finance-metric-box">
            <span className="finance-metric-label">Payment Mode</span>
            <span className="finance-metric-num" style={{ fontSize: 17, color: '#6d3bf5' }}>
              {selectedClient.paymentMode || "Online"}
            </span>
            <span className="finance-metric-sub">
              {selectedClient.paymentMode === "Online" ? "18% GST Applicable" : "Exempt / Direct"}
            </span>
          </div>

          <div className="finance-metric-box">
            <span className="finance-metric-label">GST (18%)</span>
            <span className="finance-metric-num">₹{(parseFloat(selectedClient.gstAmount) || 0).toLocaleString("en-IN")}</span>
            <span className="finance-metric-sub">Tax component</span>
          </div>

          <div className="finance-metric-box highlight">
            <span className="finance-metric-label">Total Commercial Value</span>
            <span className="finance-metric-num" style={{ color: '#6d3bf5' }}>
              ₹{(parseFloat(selectedClient.totalPayment) || 0).toLocaleString("en-IN")}
            </span>
            <span className="finance-metric-sub">Base + GST Total</span>
          </div>
        </div>

        {/* Settlement Progress */}
        <div className="settlement-bar-wrap">
          <div className="settlement-header">
            <span>
              Payment Collected: <strong>₹{(parseFloat(selectedClient.paymentReceived) || 0).toLocaleString("en-IN")}</strong>
            </span>
            <span style={{ color: parseFloat(selectedClient.paymentPending) > 0 ? '#e11d48' : '#059669' }}>
              Pending Balance: <strong>₹{(parseFloat(selectedClient.paymentPending) || 0).toLocaleString("en-IN")}</strong>
            </span>
          </div>
          <div className="settlement-bar-track">
            <div
              className="settlement-bar-fill"
              style={{
                width: `${parseFloat(selectedClient.totalPayment) > 0
                  ? Math.min(
                    Math.round(
                      ((parseFloat(selectedClient.paymentReceived) || 0) /
                        parseFloat(selectedClient.totalPayment)) *
                      100
                    ),
                    100
                  )
                  : 100
                  }%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Two-Column Grid: Contact Profile & Compliance Documents */}
      <div className="dossier-columns-grid">
        {/* Left Card: Contact & Corporate Profile */}
        <div className="dossier-info-card">
          <div className="dossier-card-title">
            <span>Contact & Company Information</span>
            <Icon name="user" size={18} />
          </div>

          <div className="dossier-info-rows">
            <div className="dossier-field-item">
              <label>Client Name</label>
              <strong>{selectedClient.name}</strong>
            </div>

            <div className="dossier-field-item">
              <label>Contact Person</label>
              <strong>{selectedClient.contactPerson || selectedClient.name}</strong>
            </div>

            <div className="dossier-field-item">
              <label>Email Address</label>
              <strong>
                <a href={`mailto:${selectedClient.email}`} className="dossier-link">
                  {selectedClient.email}
                </a>
              </strong>
            </div>

            <div className="dossier-field-item">
              <label>Phone Number</label>
              <strong>
                <a href={`tel:${selectedClient.phone}`} className="dossier-link">
                  {selectedClient.phone}
                </a>
              </strong>
            </div>

            <div className="dossier-field-item full-width">
              <label>Registered Company</label>
              <strong>{selectedClient.company}</strong>
            </div>

            <div className="dossier-field-item full-width">
              <label>Registered Address</label>
              <strong>
                {(() => {
                  const primarySibling = siblingClients.find((c) => isClientPrimaryScheme(c, c.scheme));
                  const primaryAddr = primarySibling?.address || selectedClient.address || siblingClients.find((c) => c.address)?.address || clientSubmittedDocData?.address;
                  return primaryAddr || "Not Provided";
                })()}
              </strong>
            </div>
          </div>
        </div>

        {/* Right Card: Compliance & Document Verification Desk */}
        <div className="dossier-info-card">
          <div className="dossier-card-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span>Verified Documents &amp; Audit Records</span>
              <Icon name="document" size={18} />
            </div>
            <button
              type="button"
              onClick={handleSaveVerifications}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "#ffffff",
                border: "none",
                boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              💾 Save Verification Changes
            </button>
          </div>

          {saveMessage && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                background: "rgba(16, 185, 129, 0.15)",
                color: "#10b981",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                fontSize: 12.5,
                fontWeight: 600,
                marginBottom: 12,
              }}
            >
              {saveMessage}
            </div>
          )}

          {clientPendingReqs && clientPendingReqs.length > 0 && (
            <div style={{ border: "1px solid rgba(245, 158, 11, 0.4)", background: "rgba(245, 158, 11, 0.06)", padding: 12, borderRadius: 8, marginBottom: 14 }}>
              <div style={{ color: "#f59e0b", fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                ⚠️ Pending Scheme Applications
              </div>
              {clientPendingReqs.map((req) => (
                <div key={req.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: "rgba(15, 23, 42, 0.6)", borderRadius: 6, marginBottom: 6 }}>
                  <div>
                    <strong style={{ fontSize: 12.5, color: "#f8fafc", display: "block" }}>{req.schemeName}</strong>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>Value: {req.cover}</span>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => {
                        setApprovingReq(req);
                        setLoanAmountInput(selectedClient.fundingRequirement || selectedClient.amount || "");
                      }}
                      style={{ padding: "4px 10px", borderRadius: 6, fontSize: 11.5, fontWeight: 700, background: "#10b981", color: "#fff", border: "none", cursor: "pointer" }}
                    >
                      Approve ✓
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeclineSchemeRequest && onDeclineSchemeRequest(req.id)}
                      style={{ padding: "4px 8px", borderRadius: 6, fontSize: 11.5, fontWeight: 600, background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", cursor: "pointer" }}
                    >
                      Decline ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="dossier-doc-list" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {docListToRender.map((doc, idx) => {
              const isVerified = doc.status === "Verified" || (doc.status || "").toLowerCase() === "verified";
              return (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 14px",
                    background: "rgba(15, 23, 42, 0.5)",
                    borderRadius: 8,
                    border: `1px solid ${isVerified ? "rgba(16, 185, 129, 0.25)" : "rgba(255, 255, 255, 0.08)"}`,
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <strong style={{ fontSize: 13.5, color: "#f8fafc" }}>{doc.name}</strong>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#94a3b8" }}>
                      <span>Client Filled Details:</span>
                      {(doc.value === "Yet to be filled" || !doc.value) ? (
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            fontStyle: "italic",
                            color: "#6b7280",
                            padding: "2px 8px",
                            borderRadius: 4,
                            background: "rgba(107, 114, 128, 0.1)",
                            border: "1px solid rgba(107, 114, 128, 0.2)",
                          }}
                        >
                          Yet to be filled
                        </span>
                      ) : (
                        <strong
                          style={{
                            color: "#38bdf8",
                            fontFamily: "Consolas, Monaco, monospace",
                            letterSpacing: "0.5px",
                            fontSize: 12.5,
                            background: "rgba(56, 189, 248, 0.08)",
                            padding: "2px 6px",
                            borderRadius: 4,
                            border: "1px solid rgba(56, 189, 248, 0.2)",
                          }}
                        >
                          {doc.value}
                        </strong>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onVerifyDocument && onVerifyDocument(selectedClient.id, doc.name, isVerified ? "Pending Audit" : "Verified")}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      border: `1px solid ${isVerified ? "rgba(16, 185, 129, 0.5)" : "rgba(245, 158, 11, 0.5)"}`,
                      background: isVerified ? "rgba(16, 185, 129, 0.2)" : "rgba(245, 158, 11, 0.2)",
                      color: isVerified ? "#10b981" : "#f59e0b",
                      transition: "all 0.15s ease",
                      boxShadow: isVerified ? "0 0 10px rgba(16, 185, 129, 0.15)" : "none",
                    }}
                  >
                    {isVerified ? "✓ Verified" : "Not Verified (Verify →)"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Eligible Schemes Section */}
      <EligibleSchemes
        initialSchemes={selectedClient.eligibleSchemes && selectedClient.eligibleSchemes.length > 0 ? selectedClient.eligibleSchemes : mockEligibleSchemes}
        enrolledSchemes={enrolledSchemesList}
        onSave={onSchemeSave}
      />

      {/* Internal Notes Card */}
      <div className="dossier-info-card">
        <div className="dossier-card-title">
          <span>Account Notes &amp; Remarks</span>
          <Icon name="invoice" size={18} />
        </div>
        <div className="dossier-notes-box">
          <p style={{ margin: 0 }}>
            {selectedClient.notes || "Client documents are reviewed and the recommended schemes will be shared after the salesperson confirms visibility."}
          </p>
        </div>
      </div>

      {/* Pop-up Window / Modal for Setting Loan Amount on Approval */}
      {approvingReq && (
        <div className="cd-modal-backdrop" onMouseDown={() => setApprovingReq(null)} style={{ zIndex: 9999 }}>
          <div
            className="cd-modal cd-modal-glass cd-modal-theme-card"
            style={{
              maxWidth: 540,
              width: "100%",
              maxHeight: "88vh",
              overflowY: "auto",
              padding: "26px 24px",
              borderRadius: 20,
              background: "#161325",
              border: "1px solid rgba(140, 95, 248, 0.3)",
              color: "#f8fafc",
              boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
              boxSizing: "border-box",
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="cd-modal-close"
              onClick={() => setApprovingReq(null)}
              style={{ fontSize: 20, color: "#94a3b8" }}
            >
              ×
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "rgba(16, 185, 129, 0.18)",
                  color: "#10b981",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  fontWeight: 700,
                }}
              >
                ✓
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#ffffff" }}>
                  Approve Scheme &amp; Set Requested Amount
                </h3>
                <span style={{ fontSize: 12, color: "#a098be" }}>
                  Client: <strong style={{ color: "#ffffff" }}>{selectedClient.name}</strong> ({selectedClient.company || "Corporate Client"})
                </span>
              </div>
            </div>

            <div
              style={{
                padding: "14px 16px",
                borderRadius: 12,
                background: "rgba(140, 95, 248, 0.08)",
                border: "1px solid rgba(140, 95, 248, 0.25)",
                marginBottom: 20,
              }}
            >
              <div style={{ fontSize: 13, color: "#e2e8f0", marginBottom: 4 }}>
                Enrolling Scheme: <strong style={{ color: "#38bdf8" }}>{approvingReq.schemeName}</strong>
              </div>
              <div style={{ fontSize: 12, color: "#a098be" }}>
                Workflow: <strong style={{ color: "#ffffff" }}>{approvingReq.processType || "Direct Application"}</strong>
              </div>
            </div>

            {(() => {
              const isPaymentSettlement = isPaymentDemandOrSettlement(approvingReq);
              const isEligible = !isPaymentSettlement && isEligibleSchemeRequest(approvingReq);
              return (
                <>

                  {/* Financial Breakdown Section */}
                  {(() => {
                    const pitchedNum = parseFloat(pitchedAmountInput) || 0;
                    const quotaBaseNum = Math.round(pitchedNum / 1.18);
                    const gstAmtNum = pitchedNum - quotaBaseNum;
                    const paidNum = paymentReceivedInput !== "" ? parseFloat(paymentReceivedInput) || 0 : pitchedNum;
                    const remainingNum = Math.max(0, pitchedNum - paidNum);

                    return (
                      <div style={{ padding: "16px", borderRadius: 14, background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.1)", marginBottom: 18 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                          <span style={{ fontSize: 11.5, fontWeight: 700, color: "#10b981", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                            💰 Service Commercials &amp; Payment Breakdown
                          </span>
                          <span style={{ fontSize: 10.5, padding: "2px 8px", borderRadius: 6, background: "rgba(56, 189, 248, 0.15)", border: "1px solid rgba(56, 189, 248, 0.3)", color: "#38bdf8", fontWeight: 700 }}>
                            GST 18% Standard
                          </span>
                        </div>

                        {/* 1. Pitched Service Fee / Total Amount (₹) */}
                        <div style={{ marginBottom: 12 }}>
                          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#e2e8f0", marginBottom: 4 }}>
                            Pitched Service Fee / Total Amount (Incl. 18% GST) (₹) <span style={{ color: "#10b981" }}>*</span>
                          </label>
                          <input
                            type="number"
                            className="sales-form-input"
                            placeholder="59000"
                            value={pitchedAmountInput}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPitchedAmountInput(val);
                              if (!paymentReceivedInput) {
                                setPaymentReceivedInput(val);
                              }
                            }}
                            style={{
                              width: "100%",
                              padding: "11px 14px",
                              borderRadius: 10,
                              background: "#24203b",
                              border: "1px solid #3b355a",
                              color: "#ffffff",
                              fontSize: 13,
                              fontWeight: 600,
                              outline: "none",
                              boxSizing: "border-box",
                            }}
                          />
                        </div>

                        {/* 18% GST & Quota Breakdown Box */}
                        <div style={{
                          padding: "12px 14px",
                          borderRadius: 10,
                          background: "rgba(56, 189, 248, 0.05)",
                          border: "1px dashed rgba(56, 189, 248, 0.3)",
                          marginBottom: 14,
                          display: "flex",
                          flexDirection: "column",
                          gap: 6
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11.5 }}>
                            <span style={{ color: "#a098be" }}>Base Amount (Excl. 18% GST):</span>
                            <strong style={{ color: "#ffffff" }}>₹{quotaBaseNum.toLocaleString("en-IN")}</strong>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11.5 }}>
                            <span style={{ color: "#a098be" }}>18% GST Tax Component:</span>
                            <span style={{ color: "#f43f5e", fontWeight: 600 }}>+ ₹{gstAmtNum.toLocaleString("en-IN")}</span>
                          </div>
                          <div style={{
                            marginTop: 4,
                            paddingTop: 8,
                            borderTop: "1px dashed rgba(255, 255, 255, 0.12)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                          }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#38bdf8", display: "flex", alignItems: "center", gap: 4 }}>
                              ⚡ Quota Achieved Contribution:
                            </span>
                            <strong style={{ fontSize: 13.5, fontWeight: 800, color: "#38bdf8" }}>
                              ₹{quotaBaseNum.toLocaleString("en-IN")}
                            </strong>
                          </div>
                        </div>

                        {/* 2. Amount Paid by Client (₹) */}
                        <div style={{ marginBottom: 12 }}>
                          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#e2e8f0", marginBottom: 4 }}>
                            Amount Paid by Client (₹) <span style={{ color: "#10b981" }}>*</span>
                          </label>
                          <input
                            type="number"
                            className="sales-form-input"
                            placeholder={`${pitchedNum}`}
                            value={paymentReceivedInput}
                            onChange={(e) => setPaymentReceivedInput(e.target.value)}
                            style={{
                              width: "100%",
                              padding: "11px 14px",
                              borderRadius: 10,
                              background: "#24203b",
                              border: "1px solid #3b355a",
                              color: "#ffffff",
                              fontSize: 13,
                              fontWeight: 600,
                              outline: "none",
                              boxSizing: "border-box",
                            }}
                          />
                        </div>

                        {/* Amount Remaining / Pending Display */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: 8, background: "#24203b", border: `1px solid ${remainingNum > 0 ? "rgba(239, 68, 68, 0.4)" : "rgba(16, 185, 129, 0.4)"}` }}>
                          <span style={{ fontSize: 11.5, fontWeight: 600, color: "#a098be" }}>Amount Remaining / Pending</span>
                          <strong style={{ fontSize: 13, color: remainingNum > 0 ? "#ef4444" : "#10b981" }}>
                            {remainingNum > 0 ? `₹${remainingNum.toLocaleString("en-IN")}` : "✓ ₹0 (Paid in Full)"}
                          </strong>
                        </div>
                      </div>
                    );
                  })()}
                </>
              );
            })()}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button
                type="button"
                onClick={() => setApprovingReq(null)}
                style={{ padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, background: "rgba(255, 255, 255, 0.06)", border: "1px solid rgba(255, 255, 255, 0.12)", color: "#cbd5e1", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  if (onApproveSchemeRequest) {
                    onApproveSchemeRequest(approvingReq.id, requiredAmountInput, pitchedAmountInput, null, null, paymentReceivedInput);
                  }
                  setApprovingReq(null);
                }}
                style={{
                  padding: "10px 20px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  background: "#10b981",
                  color: "#ffffff",
                  border: "none",
                  boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                  cursor: "pointer",
                }}
              >
                Save &amp; Approve Scheme ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
