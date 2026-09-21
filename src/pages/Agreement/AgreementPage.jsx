import React, { useState, useEffect, useCallback, useMemo } from "react";
import Icon from "../../components/Icon";
import {
  agreementService,
  AGREEMENT_STATUSES,
  normalizeAgreementData,
} from "../../services/agreementService";
import { isPaymentDemandOrSettlement } from "../../utils/schemeTracker";
import CurrentAgreementsTable from "./components/CurrentAgreementsTable";
import AgreementHistoryTable from "./components/AgreementHistoryTable";
import ClientAgreementFormModal from "./components/ClientAgreementFormModal";
import AgreementDocumentViewer from "./components/AgreementDocumentViewer";
import AdminClientDossierModal from "../Admin/AdminClientDossierModal";
import "../Admin/AdminDashboard.css";

export default function AgreementPage({
  clients = [],
  onClientTrackerAdvance,
  showToast,
  selectedBranch,
}) {
  // Filter out any Payment Demand items - payment demands are NOT schemes!
  const validAgreementClients = useMemo(() => {
    return clients.filter((c) => {
      if (!c) return false;
      if (isPaymentDemandOrSettlement(c)) return false;
      const sName = c.scheme || c.serviceName || c.particularScheme;
      if (isPaymentDemandOrSettlement(sName)) return false;
      return true;
    });
  }, [clients]);

  // State
  const [agreements, setAgreements] = useState([]);
  const [loadingAgreements, setLoadingAgreements] = useState(true);
  const [viewMode, setViewMode] = useState("current"); // "current" | "history"
  const [searchTerm, setSearchTerm] = useState("");

  // Modals state
  const [creatingClient, setCreatingClient] = useState(null);
  const [reviewingAgreement, setReviewingAgreement] = useState(null);
  const [viewingDetailsClient, setViewingDetailsClient] = useState(null);

  // Load agreements via agreementService abstraction
  const loadAgreements = useCallback(async () => {
    try {
      setLoadingAgreements(true);
      const list = await agreementService.getAgreements();
      setAgreements(list);
    } catch (err) {
      console.error("Failed to load agreements:", err);
      if (showToast) {
        showToast("⚠️ Could not load agreements");
      }
    } finally {
      setLoadingAgreements(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadAgreements();
  }, [loadAgreements]);

  // Handle Form Submission (after 7 fields entered & agreement generation requested)
  const handleSubmitAgreement = (newAgreement, client) => {
    const normalized = normalizeAgreementData(newAgreement);

    setAgreements((prev) => {
      const filtered = prev.filter(
        (a) => a.clientId !== normalized.clientId && a.id !== normalized.id
      );
      return [normalized, ...filtered];
    });

    setCreatingClient(null);

    if (showToast) {
      showToast(
        `✓ Generated ${normalized.agreement?.templateName || "Agreement"} for ${normalized.client?.companyName || "Client"} (${normalized.id})`
      );
    }

    // Advance client's tracker in the CRM if applicable
    if (onClientTrackerAdvance && client) {
      onClientTrackerAdvance(client, "Agreement", false);
    }
  };

  // Handle Send Action
  const handleSendAgreement = async (agr) => {
    const normalized = normalizeAgreementData(agr);
    const clientRecord = validAgreementClients.find(
      (c) =>
        c.id === normalized.clientId ||
        c.appId === normalized.applicationId ||
        c.id === normalized.crmId
    );
    const recipientEmail =
      clientRecord?.email || normalized.client?.email || "client@company.com";

    try {
      const updated = await agreementService.sendAgreement(normalized.id, recipientEmail);
      const normalizedUpdated = normalizeAgreementData(updated);

      setAgreements((prev) =>
        prev.map((item) => (item.id === normalized.id ? normalizedUpdated : item))
      );

      try {
        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(new Event("agni_agreements_updated"));

        const notif = {
          id: `notif-agr-${Date.now()}`,
          type: "alerts",
          tone: "#10b981",
          title: "Legal Agreement Dispatched",
          detail: `Admin has sent representation contract (${normalized.id}) to ${recipientEmail}. You can review and download it in your Agreement workspace.`,
          time: "Just now",
          createdAt: new Date().toISOString(),
          clientEmail: recipientEmail,
        };
        const savedNotifs = localStorage.getItem("agni_client_notifications");
        let list = savedNotifs ? JSON.parse(savedNotifs) : [];
        if (!Array.isArray(list)) list = [];
        list.unshift(notif);
        localStorage.setItem("agni_client_notifications", JSON.stringify(list));
      } catch (e) { }

      if (showToast) {
        showToast(`✓ Contract dispatched to ${recipientEmail}`);
      }

      // Complete the Agreement milestone in the CRM tracker
      if (onClientTrackerAdvance && clientRecord) {
        onClientTrackerAdvance(clientRecord, "Agreement", true);
      }
    } catch (err) {
      console.error("Failed to send agreement:", err);
      if (showToast) {
        showToast(`⚠️ Send failed: ${err.message}`);
      }
    }
  };

  // Handle Retry Action
  const handleRetryAgreement = async (agr) => {
    const normalized = normalizeAgreementData(agr);
    const clientRecord = validAgreementClients.find(
      (c) =>
        c.id === normalized.clientId ||
        c.appId === normalized.applicationId ||
        c.id === normalized.crmId
    );

    try {
      const retried = await agreementService.createAgreement({
        clientId: normalized.clientId || clientRecord?.id,
        crmId: normalized.crmId || clientRecord?.id,
        appId: normalized.applicationId || clientRecord?.appId,
        templateName: normalized.agreement?.templateName || "SCHEME_AGREEMENT",
        pitchedAmount: normalized.agreement?.pitchedAmount || 100000,
        receivedAmount: normalized.agreement?.receivedAmount || 50000,
        leftAmount: normalized.agreement?.leftAmount || 50000,
        successRate: normalized.agreement?.successRate || "95.0%",
        clientName: clientRecord?.name || normalized.client?.companyName,
        companyName: clientRecord?.company || normalized.client?.companyName,
        email: clientRecord?.email || normalized.client?.email,
      });

      const normalizedRetried = normalizeAgreementData(retried);
      setAgreements((prev) =>
        prev.map((item) => (item.id === normalized.id ? normalizedRetried : item))
      );
      if (showToast) showToast(`✓ Agreement generation successful for ${normalized.id}`);
    } catch (err) {
      console.error("Retry generation failed:", err);
      if (showToast) showToast(`⚠️ Retry failed: ${err.message}`);
    }
  };

  // Metrics computation
  const metrics = useMemo(() => {
    const totalClients = validAgreementClients.length;
    const sentCount = agreements.filter((a) => {
      const s = a.status || a.agreement?.status;
      return s === AGREEMENT_STATUSES.SENT || s === "Sent" || a.sentAt;
    }).length;

    // Active queue: clients whose agreements are yet to be sent
    const pendingQueueCount = validAgreementClients.filter((c) => {
      const agr = agreements.find(
        (a) =>
          a.clientId === c.id ||
          a.crmId === c.id ||
          a.applicationId === c.appId ||
          a.appId === c.appId ||
          String(a.id) === String(c.id)
      );
      const status = agr ? (agr.agreement?.status || agr.status) : AGREEMENT_STATUSES.PENDING;
      return status !== AGREEMENT_STATUSES.SENT && status !== "Sent";
    }).length;

    const readyCount = agreements.filter((a) => {
      const s = a.status || a.agreement?.status;
      return s === AGREEMENT_STATUSES.READY || s === "Ready";
    }).length;

    return {
      totalClients,
      sentCount,
      readyCount,
      pendingCount: pendingQueueCount,
      totalAgreements: agreements.length,
    };
  }, [validAgreementClients, agreements]);

  return (
    <section className="admin-page-container">
      {/* ── Frosted Glass Header Banner ── */}
      <div className="admin-header-banner">
        <div>
          <span className="admin-kicker">LEGAL &amp; COMMERCIAL CONTRACTS</span>
          <h2 className="admin-title">Legal Agreements &amp; Contracts</h2>
          <p className="admin-desc">
            Generate official scheme and private funding contracts, review clauses, and dispatch documents with automated milestone tracking.
          </p>
        </div>

        {/* View Mode Toggle Switch */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            className={viewMode === "current" ? "admin-btn-primary" : "admin-btn-secondary"}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 18px",
              fontSize: 13,
            }}
            onClick={() => setViewMode("current")}
          >
            <span>Active Queue (Yet to Send)</span>
            <span
              style={{
                fontSize: 11,
                padding: "1px 6px",
                borderRadius: 999,
                background: viewMode === "current" ? "rgba(255, 255, 255, 0.25)" : "rgba(154, 116, 233, 0.2)",
              }}
            >
              {metrics.pendingCount}
            </span>
          </button>

          <button
            type="button"
            className={viewMode === "history" ? "admin-btn-primary" : "admin-btn-secondary"}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 18px",
              fontSize: 13,
            }}
            onClick={() => setViewMode("history")}
          >
            <Icon name="requests" size={15} />
            <span>History Archive (Dispatched)</span>
            <span
              style={{
                fontSize: 11,
                padding: "1px 6px",
                borderRadius: 999,
                background: viewMode === "history" ? "rgba(255, 255, 255, 0.25)" : "rgba(154, 116, 233, 0.2)",
              }}
            >
              {metrics.sentCount}
            </span>
          </button>
        </div>
      </div>

      {/* ── KPI Stat Cards Strip ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
        <div className="admin-subcard" style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span className="admin-kicker" style={{ fontSize: 11 }}>Client Roster</span>
            <strong style={{ display: "block", fontSize: 22, color: "inherit", margin: "2px 0 0" }}>
              {metrics.totalClients}
            </strong>
            <small style={{ color: "#64748b", fontSize: 11.5 }}>Total Registered Clients</small>
          </div>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: "rgba(78, 124, 255, 0.12)",
              color: "#4e7cff",
              display: "grid",
              placeItems: "center",
              fontSize: 18,
            }}
          >
            👥
          </div>
        </div>

        <div className="admin-subcard" style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span className="admin-kicker" style={{ fontSize: 11, color: "#10b981" }}>Dispatched &amp; Live</span>
            <strong style={{ display: "block", fontSize: 22, color: "#10b981", margin: "2px 0 0" }}>
              {metrics.sentCount}
            </strong>
            <small style={{ color: "#64748b", fontSize: 11.5 }}>Sent to Client Email</small>
          </div>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: "rgba(16, 185, 129, 0.12)",
              color: "#10b981",
              display: "grid",
              placeItems: "center",
              fontSize: 18,
            }}
          >
            ✉️
          </div>
        </div>

        <div className="admin-subcard" style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span className="admin-kicker" style={{ fontSize: 11, color: "#9a74e9" }}>Ready &amp; Generated</span>
            <strong style={{ display: "block", fontSize: 22, color: "#9a74e9", margin: "2px 0 0" }}>
              {metrics.readyCount}
            </strong>
            <small style={{ color: "#64748b", fontSize: 11.5 }}>Docx / PDF Available</small>
          </div>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: "rgba(154, 116, 233, 0.12)",
              color: "#9a74e9",
              display: "grid",
              placeItems: "center",
              fontSize: 18,
            }}
          >
            📄
          </div>
        </div>

        <div className="admin-subcard" style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span className="admin-kicker" style={{ fontSize: 11, color: "#f59e0b" }}>Pending Contract Creation</span>
            <strong style={{ display: "block", fontSize: 22, color: "#f59e0b", margin: "2px 0 0" }}>
              {metrics.pendingCount}
            </strong>
            <small style={{ color: "#64748b", fontSize: 11.5 }}>Requires 7-field form fill</small>
          </div>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: "rgba(245, 158, 11, 0.12)",
              color: "#f59e0b",
              display: "grid",
              placeItems: "center",
              fontSize: 18,
            }}
          >
            ⏳
          </div>
        </div>
      </div>

      {/* ── Main View: Current Table vs History Table ── */}
      {viewMode === "history" ? (
        <AgreementHistoryTable
          agreements={agreements}
          onReview={(agr) => setReviewingAgreement(agr)}
        />
      ) : (
        <CurrentAgreementsTable
          clients={validAgreementClients}
          agreements={agreements}
          onViewDetails={setViewingDetailsClient}
          onCreateAgreement={setCreatingClient}
          onReviewAgreement={(agr) => setReviewingAgreement(agr)}
          onSendAgreement={handleSendAgreement}
          onRetryAgreement={handleRetryAgreement}
        />
      )}

      {/* ── Modal 1: 7-Field Creation Form ── */}
      <ClientAgreementFormModal
        isOpen={Boolean(creatingClient)}
        onClose={() => setCreatingClient(null)}
        client={creatingClient}
        onSubmitAgreement={handleSubmitAgreement}
        existingAgreementsCount={agreements.length}
      />

      {/* ── Modal 2: Document Review with DOCX/PDF Download & Preview ── */}
      <AgreementDocumentViewer
        agreement={reviewingAgreement}
        onClose={() => setReviewingAgreement(null)}
        onSendAgreement={handleSendAgreement}
        isHistoryView={viewMode === "history"}
        showToast={showToast}
      />

      {/* ── Modal 3: View Details (Existing Client Dossier) ── */}
      <AdminClientDossierModal
        selectedClientForDossier={viewingDetailsClient}
        onClose={() => setViewingDetailsClient(null)}
      />
    </section>
  );
}
