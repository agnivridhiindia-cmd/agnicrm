import React, { useState } from "react";
import Icon from "../../../components/Icon";
import {
  agreementService,
  agreementStatusBadgeColors,
  AGREEMENT_STATUSES,
  TEMPLATE_TYPES,
  TEMPLATE_NAMES,
  normalizeAgreementData,
} from "../../../services/agreementService";
import {
  getAgreementDynamicFields,
  downloadDocxFile,
} from "../docxService";
import { getCanonicalSchemeName } from "../../../utils/schemeTracker";
import "../../Admin/AdminDashboard.css";

export default function AgreementDocumentViewer({
  agreement,
  onClose,
  onSendAgreement,
  isHistoryView = false,
  showToast,
}) {
  const [downloadingDocx, setDownloadingDocx] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [sending, setSending] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  if (!agreement) return null;

  const agr = normalizeAgreementData(agreement);
  const fields = getAgreementDynamicFields(agr);
  const isPrivate = fields.isPrivate;
  const isSent = agr.agreement?.status === AGREEMENT_STATUSES.SENT;
  const statusStyle =
    agreementStatusBadgeColors[agr.agreement?.status] || agreementStatusBadgeColors.Ready;
  const templateTitle =
    agr.agreement?.templateName ||
    (isPrivate ? TEMPLATE_NAMES.PRIVATE_FUNDING : TEMPLATE_NAMES.SCHEME);

  const handleDownloadDocx = async () => {
    setDownloadingDocx(true);
    setFeedbackMsg(null);
    try {
      downloadDocxFile(agr);
      if (showToast) {
        showToast(`✓ Downloaded ${templateTitle} (.docx) for ${fields.company}`);
      }
    } catch (err) {
      console.error("Error downloading DOCX:", err);
      setFeedbackMsg({ type: "error", text: "Failed to download DOCX document." });
    } finally {
      setDownloadingDocx(false);
    }
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    setFeedbackMsg(null);
    try {
      const result = await agreementService.downloadAgreementPdf(agr.id, `${fields.company} Agreement.pdf`);
      if (result.success) {
        if (showToast) {
          showToast(`✓ Opened PDF document for ${fields.company}`);
        }
      } else {
        setFeedbackMsg({
          type: "info",
          text: result.message || "PDF generation will be provided by the backend API.",
        });
      }
    } catch (err) {
      console.error("Error downloading PDF:", err);
      setFeedbackMsg({ type: "error", text: "Failed to download PDF document." });
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSend = async () => {
    if (isSent) return;
    setSending(true);
    setFeedbackMsg(null);
    try {
      if (onSendAgreement) {
        await onSendAgreement(agr);
      } else {
        await agreementService.sendAgreement(agr.id, agr.client?.email);
      }
      if (showToast) {
        showToast(`✓ Agreement ${agr.id} dispatched to ${agr.client?.email || "client"}`);
      }
      onClose();
    } catch (err) {
      console.error("Error sending agreement:", err);
      setFeedbackMsg({ type: "error", text: `Failed to send agreement: ${err.message}` });
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.78)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px 16px",
        animation: "fadeIn 0.2s ease-out",
      }}
      onClick={onClose}
    >
      <div
        className="admin-panel-card hide-scrollbar"
        style={{
          width: "100%",
          maxWidth: 820,
          maxHeight: "92vh",
          overflowY: "auto",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          padding: 0,
          borderRadius: 22,
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.45), 0 0 32px rgba(78, 124, 255, 0.15)",
          border: "1px solid rgba(154, 116, 233, 0.25)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div
          style={{
            padding: "22px 26px 18px",
            borderBottom: "1px solid rgba(154, 116, 233, 0.15)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
              <span
                className="admin-badge"
                style={{
                  background: isPrivate
                    ? "linear-gradient(135deg, #ec4899 0%, #db2777 100%)"
                    : "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                  color: "#ffffff",
                  fontSize: 11,
                  padding: "3px 10px",
                }}
              >
                {isPrivate ? "PRIVATE FUNDING CONTRACT" : "SCHEME AGREEMENT"}
              </span>
              <span
                className="admin-badge"
                style={{
                  background: "rgba(78, 124, 255, 0.12)",
                  color: "#4e7cff",
                  fontWeight: 750,
                  fontSize: 11,
                }}
              >
                ID: {agr.id}
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "3px 10px",
                  borderRadius: 999,
                  background: statusStyle.bg,
                  color: statusStyle.color,
                  border: `1px solid ${statusStyle.border}`,
                  fontSize: 11,
                  fontWeight: 750,
                }}
              >
                <span style={{ fontSize: 8 }}>●</span>
                <span>{agr.agreement?.status}</span>
              </span>
            </div>
            <h3 style={{ margin: "2px 0 4px", fontSize: 20, fontWeight: 800, color: "inherit", letterSpacing: -0.3 }}>
              {agr.client?.companyName || agr.client?.clientName}
            </h3>
            <p className="admin-desc" style={{ fontSize: 13 }}>
              Contact: <strong>{agr.client?.clientName}</strong> • Created: {agr.createdAt}
              {agr.sentAt && (
                <span style={{ marginLeft: 10, color: "#10b981", fontWeight: 700 }}>
                  • Dispatched: {agr.sentAt} ({agr.sentTo})
                </span>
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "rgba(241, 245, 249, 0.6)",
              border: "1px solid rgba(154, 116, 233, 0.15)",
              borderRadius: "50%",
              width: 34,
              height: 34,
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              color: "#64748b",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(239, 68, 68, 0.12)";
              e.currentTarget.style.color = "#ef4444";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(241, 245, 249, 0.6)";
              e.currentTarget.style.color = "#64748b";
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "22px 26px 26px", display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Feedback Alert if applicable */}
          {feedbackMsg && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: feedbackMsg.type === "error" ? "rgba(239, 68, 68, 0.12)" : "rgba(59, 130, 246, 0.12)",
                color: feedbackMsg.type === "error" ? "#ef4444" : "#3b82f6",
                border: `1px solid ${feedbackMsg.type === "error" ? "rgba(239, 68, 68, 0.3)" : "rgba(59, 130, 246, 0.3)"}`,
              }}
            >
              <span>{feedbackMsg.text}</span>
              <button
                type="button"
                onClick={() => setFeedbackMsg(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontWeight: "bold" }}
              >
                ✕
              </button>
            </div>
          )}

          {/* ── 1. Commercial Summary Strip ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
            <div className="admin-subcard" style={{ padding: "10px 14px" }}>
              <span className="admin-kicker" style={{ fontSize: 10.5, color: "#6366f1" }}>Pitched Commercial</span>
              <strong style={{ display: "block", fontSize: 14, color: "#6366f1" }}>
                {typeof agr.agreement?.pricing?.pitched === "number"
                  ? `₹${agr.agreement.pricing.pitched.toLocaleString("en-IN")}`
                  : agr.agreement?.pricing?.pitched || "—"}
              </strong>
              <small style={{ color: "#64748b", fontSize: 11 }}>Total Agreement Fee</small>
            </div>
            <div className="admin-subcard" style={{ padding: "10px 14px" }}>
              <span className="admin-kicker" style={{ fontSize: 10.5, color: "#10b981" }}>Token Received</span>
              <strong style={{ display: "block", fontSize: 14, color: "#10b981" }}>
                {typeof agr.agreement?.pricing?.received === "number"
                  ? `₹${agr.agreement.pricing.received.toLocaleString("en-IN")}`
                  : agr.agreement?.pricing?.received || "—"}
              </strong>
              <small style={{ color: "#64748b", fontSize: 11 }}>Upfront Paid</small>
            </div>
            <div className="admin-subcard" style={{ padding: "10px 14px" }}>
              <span className="admin-kicker" style={{ fontSize: 10.5, color: "#f59e0b" }}>Balance Pending</span>
              <strong style={{ display: "block", fontSize: 14, color: "#f59e0b" }}>
                {typeof agr.agreement?.pricing?.left === "number"
                  ? `₹${agr.agreement.pricing.left.toLocaleString("en-IN")}`
                  : agr.agreement?.pricing?.left || "—"}
              </strong>
              <small style={{ color: "#64748b", fontSize: 11 }}>Payable on Milestone</small>
            </div>
            <div className="admin-subcard" style={{ padding: "10px 14px" }}>
              <span className="admin-kicker" style={{ fontSize: 10.5, color: "#ec4899" }}>Success Fee</span>
              <strong style={{ display: "block", fontSize: 14, color: "#ec4899" }}>
                {typeof agr.agreement?.pricing?.successRate === "number"
                  ? `${agr.agreement.pricing.successRate}%`
                  : agr.agreement?.pricing?.successRate || "5%"}
              </strong>
              <small style={{ color: "#64748b", fontSize: 11 }}>On Disbursement</small>
            </div>
          </div>

          {/* ── 2. Official Simulated Legal Paper Presentation ── */}
          <div
            className="admin-subcard"
            style={{
              padding: 0,
              overflow: "hidden",
              border: "1px solid rgba(154, 116, 233, 0.2)",
            }}
          >
            <div
              style={{
                padding: "12px 18px",
                borderBottom: "1px solid rgba(154, 116, 233, 0.15)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 8,
                background: "rgba(154, 116, 233, 0.05)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14 }}>📄</span>
                <strong style={{ fontSize: 13 }}>Official Legal Contract Document Preview</strong>
              </div>
              <span style={{ fontSize: 11.5, color: "#64748b" }}>
                Template: <code>{isPrivate ? "private_funding_template.docx" : "common_scheme_agreement.docx"}</code>
              </span>
            </div>

            {/* Document Paper Container */}
            <div
              style={{
                padding: "32px 36px",
                background: "#ffffff",
                color: "#1e293b",
                display: "flex",
                flexDirection: "column",
                gap: 16,
                fontFamily: "'Calibri', 'Arial', sans-serif",
                fontSize: 13,
                lineHeight: 1.6,
                maxHeight: "550px",
                overflowY: "auto",
                border: "1px solid #e2e8f0",
                boxShadow: "inset 0 2px 4px rgba(0,0,0,0.03)",
              }}
            >
              {/* Header Title */}
              <div style={{ textAlign: "center", borderBottom: "2px solid #0f172a", paddingBottom: 12, marginBottom: 8 }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#0f172a", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  CONSULTANCY SERVICE AGREEMENT
                </h2>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                  Ref No: <strong>{fields.id}</strong> • CRM App ID: <strong>{fields.appId}</strong>
                </div>
              </div>

              {/* Introduction */}
              <p style={{ margin: 0, textAlign: "justify" }}>
                This <strong>CONSULTANCY SERVICE AGREEMENT</strong> (the “Agreement”) is entered into on this{" "}
                <strong style={{ color: "#000000" }}>
                  {fields.date}
                </strong>
                , by and between:
              </p>

              <ul style={{ margin: "4px 0 8px 20px", padding: 0 }}>
                <li style={{ marginBottom: 6 }}>
                  <strong>Agnivridhi India</strong>, hereinafter referred to as the <em>Service Provider</em>, having its principal place of business at{" "}
                  <strong>Lg-02, H-165, Sector 63, Noida, Gautam Buddha Nagar, Noida, Uttar Pradesh, India, 201301</strong>;
                </li>
              </ul>
              <p style={{ margin: "2px 0", fontWeight: 600 }}>and</p>
              <ul style={{ margin: "4px 0 8px 20px", padding: 0 }}>
                <li style={{ marginBottom: 6 }}>
                  <strong>
                    <span style={{ color: "#000000", fontWeight: 700 }}>
                      {fields.company}
                    </span>
                  </strong>{" "}
                  hereinafter referred to as the <em>Service Receiver</em>, having its principal place of business at{" "}
                  <strong>
                    <span style={{ color: "#000000", fontWeight: 700 }}>
                      {fields.address}
                    </span>
                  </strong>
                  .
                </li>
              </ul>

              {/* WHEREAS */}
              <p style={{ margin: "8px 0", textAlign: "justify", background: "#f8fafc", padding: "10px 14px", borderRadius: 8, borderLeft: "4px solid #334155" }}>
                <strong>WHEREAS</strong>, the Service Provider agrees to provide consultancy services for assisting the Service Receiver in{" "}
                {isPrivate ? (
                  "raising Private Funding by facilitating investor outreach, investor introductions, investor meeting coordination, pitch presentation support, and related consultancy services."
                ) : (
                  <>
                    availing benefits under the{" "}
                    <strong>
                      <span style={{ color: "#000000", fontWeight: 700 }}>
                        {fields.schemeName}
                      </span>
                    </strong>{" "}
                    CONSULTANCY SERVICE including assistance in form filling and completion of the necessary documentation as required under the scheme.
                  </>
                )}
              </p>

              {/* 1) Definitions */}
              <h4 style={{ margin: "10px 0 4px", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>1) Definitions</h4>
              <p style={{ margin: "0 0 4px" }}>a) <strong>Agreement</strong>: Refers to this Agreement and all annexures or amendments made in writing and mutually agreed upon by both parties.</p>
              <p style={{ margin: "0 0 4px" }}>b) <strong>Service Provider</strong>: The party providing the consultancy services in exchange for payment.</p>
              <p style={{ margin: "0 0 4px" }}>c) <strong>Service Receiver</strong>: The party receiving and availing the consultancy services.</p>

              {/* 2) Covenants of the Service Provider */}
              <h4 style={{ margin: "10px 0 4px", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>2) Covenants of the Service Provider</h4>
              <p style={{ margin: "0 0 4px" }}>
                a) {isPrivate
                  ? "Review and assist in preparation of Pitch Deck, Business Profile, Financial Projections, Investor Memorandum, and other documents required for investor discussions under the CONSULTANCY SERVICE based on the information and data received from the Service Receiver. Upon request, the Service Provider may also submit the application on behalf of the Service Receiver."
                  : "The Service Provider shall prepare all the necessary documents for filing the application under the CONSULTANCY SERVICE based on the information and data received from the Service Receiver. Upon request, the Service Provider may also submit the application on behalf of the Service Receiver."}
              </p>
              <p style={{ margin: "0 0 4px" }}>
                b) The Service Provider agrees to maintain strict confidentiality of all information and documents provided by the Service Receiver and shall not disclose them to any third party except authorized personnel.
              </p>

              {/* 3) Covenants of the Service Receiver */}
              <h4 style={{ margin: "10px 0 4px", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>3) Covenants of the Service Receiver</h4>
              <p style={{ margin: "0 0 4px" }}>
                a) The Service Receiver acknowledges that the registration and application process is subject to change as per applicable norms and has no objection if delays arise due to such changes.
              </p>
              <p style={{ margin: "0 0 4px" }}>
                b) The Service Receiver agrees to pay a Consultancy fee of{" "}
                <strong>
                  ₹
                  <span style={{ color: "#000000", fontWeight: 700 }}>
                    {fields.pitched}
                  </span>
                </strong>{" "}
                as per the following structure:
              </p>
              <ul style={{ margin: "4px 0 8px 20px", padding: 0 }}>
                <li>
                  Stage 1: ₹
                  <span style={{ color: "#000000", fontWeight: 700 }}>
                    {fields.received}
                  </span>{" "}
                  as token money, payable at the time of signing this Agreement.
                </li>
                <li>
                  Stage 2: ₹
                  <span style={{ color: "#000000", fontWeight: 700 }}>
                    {fields.left}
                  </span>{" "}
                  {isPrivate ? "At the time of Interview" : "to initiate the preparation of reports and commence the work."}
                </li>
                <li>
                  Stage 3:{" "}
                  <span style={{ color: "#000000", fontWeight: 700 }}>
                    {fields.rate}
                  </span>{" "}
                  as success fee of the funded amount, payable after the disbursement.
                </li>
              </ul>
              <p style={{ margin: "0 0 4px" }}>
                c) The Service Receiver shall provide all required documents requested by the Service Provider for processing the application.
              </p>
              <p style={{ margin: "0 0 4px" }}>
                d) <strong>Refund Clause</strong>: All payments made to Agnivridhi India are strictly non-refundable once services have commenced. Refunds shall be made only if the Service Provider fails to initiate or deliver consultancy work.
              </p>
              <p style={{ margin: "0 0 4px" }}>
                e) All payments must be made only to Agnivridhi India’s official bank account.
              </p>

              {/* 4) Process & Details */}
              <h4 style={{ margin: "10px 0 4px", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                4) {isPrivate ? "Funding Process" : "Scheme Details & Process"}
              </h4>
              <p style={{ margin: "0 0 4px" }}>
                {isPrivate ? (
                  "The funding process includes: Business Profile Review → Pitch Deck & Financial Review → Investor Identification & Outreach → Coordination with prospective Investors → Scheduling Investor Meetings → Facilitation of Investor Discussions → Follow-up regarding Investor Feedback."
                ) : (
                  `Application preparation under the selected Government Scheme (${fields.schemeName}) → Submission to Bank / Financial Institution / Body → Coordination for approval & disbursement.`
                )}
              </p>

              {/* 5) Eligibility Criteria */}
              <h4 style={{ margin: "10px 0 4px", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                5) {isPrivate ? "Funding Eligibility" : "Eligibility Criteria"}
              </h4>
              <p style={{ margin: "0 0 4px" }}>
                {isPrivate
                  ? "Funding eligibility shall depend upon business viability, revenue model, management capability, financial performance, market opportunity, and investor preferences."
                  : "Eligibility will depend on the documents and project details provided by the Client. Agnivridhi India will not be responsible for rejection due to incorrect or incomplete documents."}
              </p>

              {/* 6 to 13 Remaining Clauses */}
              <h4 style={{ margin: "10px 0 4px", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                6) {isPrivate ? "Investor Evaluation" : "Waiver Benefits & Interest Subsidy"}
              </h4>
              <p style={{ margin: "0 0 4px" }}>
                {isPrivate
                  ? "The Service Receiver acknowledges that investors may independently conduct due diligence, financial review, management assessment, and market evaluation before making any investment decision."
                  : "Any interest waiver, moratorium, or subsidy under the chosen scheme shall be governed by official scheme guidelines."}
              </p>

              <h4 style={{ margin: "10px 0 4px", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>7) Duration & Processing Timeline</h4>
              <p style={{ margin: "0 0 4px" }}>
                {isPrivate
                  ? "Investor funding timelines depend entirely upon investor evaluation and internal decision-making processes."
                  : "The loan/grant duration or approval timeline depends solely on the concerned Bank / Financial Institution / Government Authority. Estimated duration 30 to 180 working days."}
              </p>

              <h4 style={{ margin: "10px 0 4px", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>8) Documentation & Procedures</h4>
              <p style={{ margin: "0 0 4px" }}>
                {isPrivate
                  ? "The Service Receiver shall provide Pitch Deck, Financial Statements, Company Profile, Business Plan, and Incorporation Documents."
                  : "All required documents (KYC, financials, collateral details) must be submitted by Client within requested time frame. Project Report & Financial Projections prepared by Agnivridhi India."}
              </p>

              <h4 style={{ margin: "10px 0 4px", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>9) Company Duties & Responsibilities</h4>
              <p style={{ margin: "0 0 4px" }}>
                {isPrivate
                  ? "Agnivridhi India shall review funding documents, approach suitable investors, coordinate communications, and schedule a maximum of Two (2) Investor Meetings."
                  : "Agnivridhi India shall guide Client in documentation, coordinate between Client and authorities, submit application, and follow up until loan sanction/disbursement."}
              </p>

              <h4 style={{ margin: "10px 0 4px", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>10) Client Duties & Responsibilities</h4>
              <p style={{ margin: "0 0 4px" }}>
                The Client must provide accurate information and documents, respond promptly to communications, and bear all government, bank, and third-party fees directly.
              </p>

              <h4 style={{ margin: "10px 0 4px", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                11) {isPrivate ? "Investor Decision Process" : "Department & Sanction Process"}
              </h4>
              <p style={{ margin: "0 0 4px" }}>
                {isPrivate
                  ? "The final funding decision shall rest solely with the Investor. Upon scheduling and coordinating up to Two (2) Investor Meetings, the Service Provider's obligations shall be deemed fulfilled."
                  : "The sanctioning authority will be the concerned Bank / NBFC / Government Department as per the selected scheme. Agnivridhi India's role ends upon submission, coordination, and approval assistance."}
              </p>

              <h4 style={{ margin: "10px 0 4px", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>12) Time Limitation & Workflow</h4>
              <p style={{ margin: "0 0 4px" }}>
                The estimated duration for outreach, submission, and sanction may vary from 30 to 180 working days depending on authority or investor response time.
              </p>

              <h4 style={{ margin: "10px 0 4px", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>13) Liability Disclaimer</h4>
              <p style={{ margin: "0 0 4px" }}>
                The Company shall not be liable for delay, rejection, policy changes, investor decisions, or financial loss incurred by the Client.
              </p>

              <h4 style={{ margin: "10px 0 4px", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>14 to 20) General Contractual Terms</h4>
              <p style={{ margin: "0 0 4px" }}>
                Agreement automatically expires if required documents are not provided within 30 days. Agreement valid for 3 months from execution date. Each party is an independent contractor. Modifications must be in writing.
              </p>

              <h4 style={{ margin: "10px 0 4px", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>21) Effective Date</h4>
              <p style={{ margin: "0 0 4px" }}>
                The effective date of this Agreement shall be{" "}
                <span style={{ color: "#000000", fontWeight: 700 }}>
                  {fields.date}
                </span>
                , regardless of the actual date of signature.
              </p>

              <h4 style={{ margin: "10px 0 4px", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>22 to 25) Governing Law & Dispute Resolution</h4>
              <p style={{ margin: "0 0 4px" }}>
                Disputes shall be referred to a sole arbitrator appointed mutually under the Arbitration and Conciliation Act, 1996 in Delhi. All notices sent via registered post or email.
              </p>

              <h4 style={{ margin: "10px 0 4px", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>26) Acceptance & Acknowledgment</h4>
              <p style={{ margin: "0 0 8px" }}>
                Both parties confirm that they have read and understood all the terms and conditions of this Agreement and voluntarily agree to be bound by it.
              </p>

              {/* Witness & Signature Box */}
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: "2px solid #0f172a" }}>
                <p style={{ fontSize: 12, fontWeight: 700, margin: "0 0 10px", color: "#0f172a" }}>
                  IN WITNESS WHEREOF, the undersigned have executed this Agreement on the day and year first written above.
                </p>

                <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #cbd5e1", fontSize: 12 }}>
                  <tbody>
                    <tr>
                      <td style={{ width: "50%", padding: 10, border: "1px solid #cbd5e1", verticalAlign: "top" }}>
                        <strong>Signed and delivered for and on behalf of:</strong>
                        <br /><br />
                        <strong>Name: Agnivridhi India Private Limited</strong>
                        <br />
                        Title: Director
                        <br />
                        Date:{" "}
                        <span style={{ color: "#000000", fontWeight: 700 }}>{fields.date}</span>
                        <br /><br />
                        <strong>Signature:</strong>
                        <div style={{ fontSize: 20, fontFamily: "cursive", color: "#1e3a8a", marginTop: 4 }}>Rahul.</div>
                      </td>
                      <td style={{ width: "50%", padding: 10, border: "1px solid #cbd5e1", verticalAlign: "top" }}>
                        <strong>I have read and understood the provisions of this Agreement &amp; hereby accept the same.</strong>
                        <br /><br />
                        <strong>
                          Name:{" "}
                          <span style={{ color: "#000000", fontWeight: 700 }}>{fields.company}</span>
                        </strong>
                        <br />
                        Title: Director
                        <br />
                        Date:{" "}
                        <span style={{ color: "#000000", fontWeight: 700 }}>{fields.date}</span>
                        <br /><br />
                        <strong>Signature:</strong> ________________________
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Undertaking Section */}
              <div style={{ marginTop: 14, background: "#f8fafc", padding: "14px 16px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                <h4 style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 800, color: "#0f172a", textTransform: "uppercase" }}>
                  UNDERTAKING
                </h4>
                <p style={{ margin: "0 0 6px", fontSize: 12 }}>
                  I, the Director/Partner of{" "}
                  <strong>
                    <span style={{ color: "#000000", fontWeight: 700 }}>{fields.company}</span>
                  </strong>{" "}
                  do hereby undertake as follows:
                </p>
                <ol style={{ margin: 0, paddingLeft: 18, fontSize: 11.5, color: "#334155" }}>
                  <li style={{ marginBottom: 3 }}>
                    That I shall fully comply with all the sub-clauses stated under Clause (3) of the Consultancy Service Agreement.
                  </li>
                  <li style={{ marginBottom: 3 }}>
                    All official communications shall be through company registered email domain (<strong>Legal@agnivridhiindia.com</strong>).
                  </li>
                  <li style={{ marginBottom: 3 }}>
                    Providing false, misleading, or incomplete information will render this Agreement voidable at sole discretion of Service Provider.
                  </li>
                  <li>
                    I hereby confirm that I have read, understood, and accepted all terms on official website <strong>www.agnivridhiindia.com</strong>.
                  </li>
                </ol>
              </div>
            </div>
          </div>

          {/* ── 3. Bottom Action Toolbar ── */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
              paddingTop: 12,
              borderTop: "1px solid rgba(154, 116, 233, 0.15)",
            }}
          >
            {/* Export Actions */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                className="admin-btn-secondary"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "rgba(16, 185, 129, 0.12)",
                  color: "#10b981",
                  borderColor: "rgba(16, 185, 129, 0.3)",
                  fontWeight: 700,
                }}
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                title="Generate & Download official PDF document"
              >
                <Icon name="document" size={15} />
                <span>{downloadingPdf ? "Generating PDF..." : "Download PDF"}</span>
              </button>

              <button
                type="button"
                className="admin-btn-secondary"
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                onClick={handlePrint}
                title="Print agreement details"
              >
                <span>🖨️ Print</span>
              </button>
            </div>

            {/* Send / Close Actions */}
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button type="button" className="admin-btn-secondary" onClick={onClose} style={{ padding: "10px 20px" }}>
                Close
              </button>

              {!isHistoryView && !isSent && (
                <button
                  type="button"
                  className="admin-btn-primary"
                  style={{
                    padding: "10px 24px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  }}
                  onClick={handleSend}
                  disabled={sending}
                  title={`Send agreement to ${agr.client?.email || "client"}`}
                >
                  <Icon name="mail" size={15} />
                  <span>{sending ? "Dispatching..." : "Send to Client Email"}</span>
                </button>
              )}

              {isSent && (
                <span
                  className="admin-badge"
                  style={{
                    fontSize: 12,
                    padding: "8px 14px",
                    background: "rgba(16, 185, 129, 0.15)",
                    color: "#10b981",
                    fontWeight: 800,
                  }}
                >
                  ✓ Dispatched to Client
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
