import React, { useMemo, useState, useEffect } from "react";
import { apiFetch } from "../../services/apiClient";
import RequestTable from "./RequestTable";
import RequestHistory from "./RequestHistory";
import CreateRequestModal from "./CreateRequestModal";
import RequestDetailsModal from "./RequestDetailsModal";
import ApproveSchemeModal from "./ApproveSchemeModal";
import Icon from "../../components/Icon";
import { mockRequests } from "./mockRequests";
import { mockClients } from "./mockClients";

const TABS = [
  { id: "Pending Requests", label: "Pending Requests", icon: "clock" },
  { id: "Request History", label: "Request History", icon: "history" },
];

export default function SalesRequests({ clients: propClients = [], userEmail, salesPersonName, userRole } = {}) {
  const [activeTab, setActiveTab] = useState("Pending Requests");
  const [requests, setRequests] = useState([]);
  const [dbClients, setDbClients] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [approvingScheme, setApprovingScheme] = useState(null);
  const [notification, setNotification] = useState("");

  const fetchClients = async () => {
    try {
      const res = await apiFetch("/clients");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setDbClients(data.data);
        }
      }
    } catch (err) {
      console.warn("Could not fetch clients in SalesRequests:", err);
    }
  };

  useEffect(() => {
    fetchClients();
    const handleClientsUpdate = () => {
      fetchClients();
    };
    window.addEventListener("agni_clients_updated", handleClientsUpdate);
    window.addEventListener("storage", handleClientsUpdate);
    return () => {
      window.removeEventListener("agni_clients_updated", handleClientsUpdate);
      window.removeEventListener("storage", handleClientsUpdate);
    };
  }, []);

  const effectiveClients = useMemo(() => {
    if (Array.isArray(propClients) && propClients.length > 0) return propClients;
    if (Array.isArray(dbClients) && dbClients.length > 0) return dbClients;
    try {
      const saved = localStorage.getItem("agni_sales_clients") || localStorage.getItem("agni_clients");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  }, [propClients, dbClients]);

  const fetchRequests = async () => {
    try {
      const res = await apiFetch("/requests");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          const mapped = data.data.map((r) => {
            const pendingData = r.requestType === "NEW_SERVICE" && r.requestedChanges ? r.requestedChanges : null;
            const isPaymentSettlement = pendingData?.isPaymentSettlement || pendingData?.category === "Payment Settlement" || String(r.reason || "").includes("Payment Settlement") || String(r.requestType).toLowerCase().includes("payment");
            const clientName = r.client?.companyName || r.client?.name || pendingData?.companyName || pendingData?.name || (r.targetEntityType === "EMPLOYEE" ? `Employee #${r.targetEntityId}` : "Client Account");
            
            if (isPaymentSettlement) {
              return {
                id: r.requestCode || r.id,
                paymentId: pendingData?.paymentId || r.targetEntityId || r.requestCode || r.id,
                clientName,
                companyName: clientName,
                clientEmail: r.client?.email || pendingData?.clientEmail || "",
                requestType: "Payment Settlement",
                status: r.status === "PENDING" ? "Pending" : r.status === "APPROVED" ? "Approved" : r.status === "REJECTED" ? "Declined" : "Pending",
                category: "Payment Settlement",
                amount: pendingData?.amount || 0,
                pitchedAmount: pendingData?.amount || 0,
                totalPayment: pendingData?.amount || 0,
                paymentMode: pendingData?.paymentMode || "Online Gateway",
                transactionRef: pendingData?.transactionRef || "",
                decisionDate: r.decisionDate ? new Date(r.decisionDate).toISOString().split("T")[0] : "",
                managerRemarks: r.managerRemarks || "",
                reason: r.reason || "",
                targetDepartment: "Sales & Accounts",
                managerName: "Sales Representative",
                createdAt: r.createdAt,
                submittedDate: r.createdAt ? new Date(r.createdAt).toISOString().split("T")[0] : "",
                raw: r,
              };
            }

            const isSecondaryScheme = Boolean(
              pendingData?.schemeName ||
              pendingData?.cover ||
              pendingData?.tag ||
              (typeof pendingData?.detail === "string" && pendingData?.detail.includes("scheme enrollment")) ||
              String(r.reason || "").toLowerCase().includes("self-enrollment") ||
              String(r.reason || "").toLowerCase().includes("secondary scheme")
            );

            if (isSecondaryScheme) {
              const statusStr = String(r.status || "").toLowerCase();
              const isDeclined = statusStr.includes("decline") || statusStr.includes("reject");
              const isApproved = statusStr.includes("approved");
              const displayStatus = isDeclined ? "Declined" : isApproved ? "Approved" : "Pending";
              const schemeName = pendingData?.schemeName || pendingData?.name || r.reason?.replace(/Client self-enrollment for /i, "").split(" (")[0] || "Eligible Scheme";
              return {
                id: r.requestCode || r.id,
                rawId: r.id,
                clientName,
                companyName: clientName,
                clientEmail: r.client?.email || pendingData?.clientEmail || pendingData?.email || "",
                phone: r.client?.phone || pendingData?.phone || "+91 98765 43210",
                requestType: "Eligible Scheme",
                status: displayStatus,
                category: "Eligible Scheme",
                schemeName: schemeName,
                pitchedAmount: pendingData?.price || 0,
                amountRequired: pendingData?.cover || pendingData?.amountRequired || 0,
                decisionDate: r.decisionDate ? new Date(r.decisionDate).toISOString().split("T")[0] : "",
                managerRemarks: r.managerRemarks || "",
                reason: r.reason || "",
                targetDepartment: "Sales & Schemes",
                managerName: pendingData?.salesPerson || "Sales Representative",
                createdAt: r.createdAt,
                submittedDate: r.createdAt ? new Date(r.createdAt).toISOString().split("T")[0] : "",
                currentStage: r.currentStage,
                approvalChain: r.approvalChain,
                currentChainIndex: r.currentChainIndex,
                auditHistory: r.auditHistory,
                requestedChanges: pendingData,
                raw: r,
              };
            }

            return {
              id: r.requestCode || r.id,
              rawId: r.id,
              clientName,
              companyName: clientName,
              requestType: r.requestType === "NEW_SERVICE" ? "Client Create" : r.requestType === "DELETE_CLIENT" ? "Delete Client" : r.requestType === "TRANSFER_CLIENT" ? "Transfer Client" : r.requestType === "EDIT_CLIENT" ? "Edit Client" : r.requestType,
              status: r.status === "PENDING" ? "Pending" : r.status === "APPROVED" ? "Approved" : r.status === "REJECTED" ? "Rejected" : "Pending",
              category: r.requestType === "NEW_SERVICE" ? "Manager Approval: Client Create" : r.requestType === "DELETE_CLIENT" ? "Manager Approval: Client Delete" : r.requestType === "TRANSFER_CLIENT" ? "Manager Approval: Client Transfer" : r.requestType === "EDIT_CLIENT" ? "Manager Approval: Client Edit" : r.requestType,
              decisionDate: r.decisionDate ? new Date(r.decisionDate).toISOString().split("T")[0] : "",
              managerRemarks: r.managerRemarks || "",
              reason: r.reason || "",
              currentStage: r.currentStage,
              approvalChain: r.approvalChain,
              currentChainIndex: r.currentChainIndex,
              auditHistory: r.auditHistory,
              requestedChanges: Array.isArray(r.requestedChanges) ? r.requestedChanges : [],
              raw: r,
            };
          });
          setRequests(mapped);
        }
      }

      const savedSchemes = localStorage.getItem("agni_pending_scheme_requests");
      if (savedSchemes) {
        try {
          const clientReqs = JSON.parse(savedSchemes);
          if (Array.isArray(clientReqs)) {
            const mappedClientReqs = clientReqs.map((r) => {
              const statusStr = String(r.status || "").toLowerCase();
              const isDeclined = statusStr.includes("decline") || statusStr.includes("reject");
              const isApproved = statusStr.includes("approved");
              const displayStatus = isDeclined ? "Declined" : isApproved ? "Approved" : "Pending";
              return {
                id: r.id,
                clientName: r.clientName,
                companyName: r.clientName,
                requestType: "Eligible Scheme",
                status: displayStatus,
                category: "Eligible Scheme",
                schemeName: r.schemeName,
                decisionDate: r.decisionDate || "",
                managerRemarks: r.managerRemarks || "",
                raw: r,
              };
            });
            setRequests((prev) => {
              const existingMap = new Map();
              prev.forEach((p) => existingMap.set(p.id, p));
              mappedClientReqs.forEach((r) => {
                if (existingMap.has(r.id)) {
                  const curr = existingMap.get(r.id);
                  if (r.status === "Declined" && curr.status === "Pending") {
                    existingMap.set(r.id, { ...curr, status: "Declined" });
                  }
                } else {
                  // Only add if not already represented in existingMap by scheme name and client
                  const rNorm = String(r.schemeName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
                  const rClient = String(r.clientName || "").toLowerCase().trim();
                  const alreadyInPrev = Array.from(existingMap.values()).some((p) => {
                    const pNorm = String(p.schemeName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
                    const pClient = String(p.clientName || "").toLowerCase().trim();
                    return pNorm && rNorm && (pNorm === rNorm) && (!rClient || !pClient || pClient === rClient);
                  });
                  if (!alreadyInPrev) {
                    existingMap.set(r.id, r);
                  }
                }
              });
              return Array.from(existingMap.values());
            });
          }
        } catch (e) { }
      }

      // Merge explicit Payment Settlement requests from localStorage
      const savedSettlements = localStorage.getItem("agni_pending_payment_settlement_requests");
      let mappedSettlements = [];
      if (savedSettlements) {
        try {
          const settlementReqs = JSON.parse(savedSettlements);
          if (Array.isArray(settlementReqs)) {
            mappedSettlements = settlementReqs.map((s) => {
              const statusStr = String(s.status || "").toLowerCase();
              const isDeclined = statusStr.includes("decline") || statusStr.includes("reject");
              const isApproved = statusStr.includes("approved") || statusStr.includes("paid");
              const displayStatus = isDeclined ? "Declined" : isApproved ? "Approved" : "Pending";
              return {
                id: s.id,
                paymentId: s.paymentId || s.rawId || s.id,
                clientId: s.clientId || s.raw?.clientId || "",
                clientName: s.clientName || s.companyName || "Client",
                companyName: s.companyName || s.clientName || "Client",
                clientEmail: s.clientEmail || "",
                requestType: "Payment Settlement",
                category: "Payment Settlement",
                status: displayStatus,
                amount: s.amount,
                pitchedAmount: s.amount,
                totalPayment: s.amount,
                paymentMode: s.paymentMode || "Online Gateway",
                transactionRef: s.transactionRef || "",
                decisionDate: s.decisionDate || "",
                managerRemarks: s.managerRemarks || "",
                reason: s.reason || `Payment Settlement verification for ${s.paymentId || s.id}`,
                targetDepartment: "Sales & Accounts",
                managerName: s.managerName || "Sales Representative",
                createdAt: s.createdAt,
                submittedDate: s.submittedDate || (s.createdAt ? new Date(s.createdAt).toISOString().split("T")[0] : ""),
                raw: s,
              };
            });
          }
        } catch (e) {}
      }

      // Auto-reconcile any pending payment demands across local storage that are awaiting approval
      const awaitingDemands = [];
      const demandKeys = ["agni_sales_payments", "agni_payment_demands", "agni_client_requests"];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i) || "";
        if (k.startsWith("agni_payment_demands_")) {
          demandKeys.push(k);
        }
      }
      demandKeys.forEach((key) => {
        try {
          const raw = localStorage.getItem(key);
          if (!raw) return;
          const items = JSON.parse(raw);
          if (Array.isArray(items)) {
            items.forEach((p) => {
              const s = String(p.status || "").toLowerCase();
              if (s.includes("awaiting") || s.includes("pending sales")) {
                if (!awaitingDemands.some((x) => String(x.id) === String(p.id))) {
                  awaitingDemands.push(p);
                }
              }
            });
          }
        } catch (e) {}
      });

      const synthesizedDemands = awaitingDemands.map((p) => {
        const cName = p.clientCompany || p.clientName || "Client Account";
        return {
          id: `SETTLE-${p.id}`,
          paymentId: p.id,
          rawId: p.id,
          clientName: cName,
          companyName: cName,
          clientEmail: p.clientEmail || "",
          requestType: "Payment Settlement",
          category: "Payment Settlement",
          status: "Pending",
          amount: Number(p.amount || 0),
          pitchedAmount: Number(p.amount || 0),
          totalPayment: Number(p.amount || 0),
          paymentMode: p.paymentMode || "Online Gateway",
          transactionRef: p.transactionRef || "",
          decisionDate: "",
          managerRemarks: "",
          reason: `Payment Settlement verification for demand ${p.id} (₹${Number(p.amount || 0).toLocaleString("en-IN")}) via ${p.paymentMode || "Online Gateway"}.`,
          targetDepartment: "Sales & Accounts",
          managerName: p.salesPerson || "Sales Representative",
          createdAt: p.settledAt || p.date || new Date().toISOString(),
          submittedDate: p.submissionDate || p.date || new Date().toISOString().split("T")[0],
          raw: p,
        };
      });

      setRequests((prev) => {
        const existingMap = new Map();
        prev.forEach((p) => existingMap.set(p.id, p));

        mappedSettlements.forEach((s) => {
          if (existingMap.has(s.id)) {
            const curr = existingMap.get(s.id);
            if ((s.status === "Declined" || s.status === "Approved") && curr.status === "Pending") {
              existingMap.set(s.id, { ...curr, status: s.status });
            }
          } else {
            existingMap.set(s.id, s);
          }
        });

        synthesizedDemands.forEach((syn) => {
          const matchExisting = Array.from(existingMap.values()).find(
            (r) => String(r.paymentId) === String(syn.paymentId) || String(r.id) === String(syn.id)
          );
          if (!matchExisting) {
            existingMap.set(syn.id, syn);
          }
        });

        return Array.from(existingMap.values());
      });

    } catch (e) {
      console.error("Failed to fetch requests", e);
    }
  };

  useEffect(() => {
    fetchRequests();

    const handleSync = () => fetchRequests();
    window.addEventListener("storage", handleSync);
    window.addEventListener("agni_requests_updated", handleSync);
    window.addEventListener("agni_pending_updated", handleSync);
    window.addEventListener("agni_payments_updated", handleSync);
    window.addEventListener("agni_clients_updated", handleSync);
    const interval = setInterval(handleSync, 5000);

    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("agni_requests_updated", handleSync);
      window.removeEventListener("agni_pending_updated", handleSync);
      window.removeEventListener("agni_payments_updated", handleSync);
      window.removeEventListener("agni_clients_updated", handleSync);
      clearInterval(interval);
    };
  }, []);

  const pendingRequests = useMemo(
    () => requests.filter((request) => request.status === "Pending"),
    [requests]
  );

  const historyRequests = useMemo(
    () => requests.filter((request) => request.status !== "Pending"),
    [requests]
  );

  const stats = useMemo(() => {
    const total = requests.length;
    const pending = pendingRequests.length;
    const approved = requests.filter((r) => r.status === "Approved").length;
    const cancelled = requests.filter((r) => r.status === "Cancelled" || r.status === "Rejected").length;
    return { total, pending, approved, cancelled };
  }, [requests, pendingRequests]);

  useEffect(() => {
    const handleRequestsUpdate = () => {
      fetchRequests();
    };
    window.addEventListener("agni_requests_updated", handleRequestsUpdate);
    return () => {
      window.removeEventListener("agni_requests_updated", handleRequestsUpdate);
    };
  }, []);

  const addRequest = (newRequest) => {
    fetchRequests();
    const reqName = newRequest?.clientName || newRequest?.client?.companyName || newRequest?.client?.name || "Client";
    const reqId = newRequest?.requestCode || newRequest?.id || "";
    setNotification(
      newRequest.requestType === "Edit Client" || newRequest.requestType === "EDIT_CLIENT"
        ? `✓ Edit request for "${reqName}" (${reqId}) submitted successfully!`
        : `✓ Deletion request for "${reqName}" (${reqId}) submitted successfully!`
    );
    setTimeout(() => setNotification(""), 4500);
  };

  const cancelPendingRequest = (requestId) => {
    setRequests((prev) =>
      prev.map((request) =>
        request.id === requestId
          ? {
            ...request,
            status: "Cancelled",
            decisionDate: new Date().toISOString().split("T")[0],
            managerRemarks: "Cancelled by salesperson.",
          }
          : request
      )
    );
    setNotification(`Request ${requestId} has been cancelled.`);
    setTimeout(() => setNotification(""), 3500);
  };

  const handleApproveScheme = async (details) => {
    if (!approvingScheme) return;
    try {
      const savedSchemes = localStorage.getItem("agni_pending_scheme_requests");
      if (savedSchemes) {
        let allReqs = JSON.parse(savedSchemes);
        allReqs = allReqs.map(r =>
          r.id === approvingScheme.id
            ? {
                ...r,
                status: "Approved & Active",
                pitchedAmount: details.pitchedAmount,
                paymentMode: details.paymentMode,
                totalPayment: details.totalPayment,
                amountRequired: details.amountRequired,
                decisionDate: new Date().toISOString()
              }
            : r
        );
        localStorage.setItem("agni_pending_scheme_requests", JSON.stringify(allReqs));
      }

      const clientEmail = approvingScheme.raw?.clientEmail || approvingScheme.raw?.email || approvingScheme.email;
      if (clientEmail) {
        await apiFetch("/clients", {
          method: "POST",
          body: {
            companyName: approvingScheme.companyName || approvingScheme.clientName,
            contactPerson: approvingScheme.clientName,
            name: approvingScheme.clientName,
            email: clientEmail,
            phone: approvingScheme.raw?.phone || "+91 98765 43210",
            serviceName: approvingScheme.schemeName,
            serviceType: "CONSULTANCY",
            amount: details.totalPayment || details.pitchedAmount,
            paymentMode: (details.paymentMode || "ONLINE").toUpperCase(),
            paymentReceived: details.paymentReceived || 0,
            paymentPending: details.paymentPending || details.totalPayment || 0,
            fundingRequirement: details.amountRequired,
            approvalStatus: "ACTIVE",
          }
        });
      }

      // Also patch backend DB request decision if dbId exists!
      let dbId = approvingScheme.raw?.id || approvingScheme.rawId || (String(approvingScheme.id).includes("-") && !String(approvingScheme.id).startsWith("req-") ? approvingScheme.id : null);
      if (!dbId && approvingScheme.schemeName) {
        const normS = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        const targetNorm = normS(approvingScheme.schemeName);
        const foundDbReq = requests.find((r) => {
          const rId = String(r.id || "");
          const isDb = !rId.startsWith("req-") && (r.raw?.id || r.id);
          const rNorm = normS(r.schemeName || r.raw?.requestedChanges?.schemeName || r.raw?.reason);
          return isDb && (rNorm === targetNorm || rNorm.includes(targetNorm) || targetNorm.includes(rNorm));
        });
        if (foundDbReq) {
          dbId = foundDbReq.raw?.id || foundDbReq.id;
        }
      }

      if (dbId) {
        try {
          await apiFetch(`/requests/${dbId}/decision`, {
            method: "PATCH",
            body: {
              decision: "APPROVED",
              remarks: `Scheme approved with ${details.totalPayment || details.pitchedAmount || 0} pitched amount`,
            },
          });
        } catch (err) {
          console.warn("Could not patch DB request approval:", err);
        }
      }

      // Optimistically update request in local table
      setRequests((prev) =>
        prev.map((r) => {
          const isMatch = r.id === approvingScheme.id || (dbId && (r.id === dbId || r.raw?.id === dbId));
          return isMatch
            ? {
                ...r,
                status: "Approved",
                decisionDate: new Date().toISOString().split("T")[0],
                managerRemarks: `Scheme approved with ${details.totalPayment || details.pitchedAmount || 0} pitched amount`,
              }
            : r;
        })
      );

      window.dispatchEvent(new Event("agni_pending_updated"));
      window.dispatchEvent(new CustomEvent("agni_pending_updated"));
      window.dispatchEvent(new CustomEvent("agni_clients_updated"));
      window.dispatchEvent(new CustomEvent("agni_requests_updated"));
      window.dispatchEvent(new Event("storage"));

      setNotification(`✓ Scheme ${approvingScheme.schemeName} approved successfully for ${approvingScheme.clientName}!`);
      setTimeout(() => setNotification(""), 4500);

      // Refresh requests list from server
      fetchRequests();
    } catch (e) {
      console.error(e);
    }
    setApprovingScheme(null);
  };

  const handleDeclineScheme = async (requestId) => {
    const matched = requests.find((r) => r.id === requestId || r.raw?.id === requestId);
    let dbId = matched?.raw?.id || matched?.rawId || (String(requestId).includes("-") && !String(requestId).startsWith("req-") ? requestId : null);
    const schemeName = matched?.schemeName || matched?.raw?.schemeName || "";
    const clientName = matched?.clientName || matched?.raw?.clientName || "Client";

    const normS = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const targetNorm = normS(schemeName);

    // If dbId was not directly on matched, locate any corresponding DB record in requests
    if (!dbId && targetNorm) {
      const foundDbReq = requests.find((r) => {
        const rId = String(r.id || "");
        const isDb = !rId.startsWith("req-") && (r.raw?.id || r.id);
        const rNorm = normS(r.schemeName || r.raw?.requestedChanges?.schemeName || r.raw?.reason);
        return isDb && (rNorm === targetNorm || rNorm.includes(targetNorm) || targetNorm.includes(rNorm));
      });
      if (foundDbReq) {
        dbId = foundDbReq.raw?.id || foundDbReq.id;
      }
    }

    // 1. Immediately update state so it moves from Pending to History
    setRequests((prev) =>
      prev.map((r) => {
        const rNorm = normS(r.schemeName || r.raw?.requestedChanges?.schemeName || "");
        const isMatch = r.id === requestId || (dbId && (r.id === dbId || r.raw?.id === dbId)) || (targetNorm && rNorm === targetNorm);
        return isMatch
          ? {
              ...r,
              status: "Declined",
              decisionDate: new Date().toISOString().split("T")[0],
              managerRemarks: "Declined by sales representative",
            }
          : r;
      })
    );

    // 2. Persist to localStorage
    const savedSchemes = localStorage.getItem("agni_pending_scheme_requests");
    if (savedSchemes) {
      try {
        let allReqs = JSON.parse(savedSchemes);
        if (Array.isArray(allReqs)) {
          allReqs = allReqs.map((r) => {
            const matchesId = r.id === requestId || (dbId && r.id === dbId);
            const matchesScheme = targetNorm && normS(r.schemeName) === targetNorm;
            if (matchesId || matchesScheme) {
              return { ...r, status: "Declined", decisionDate: new Date().toISOString() };
            }
            return r;
          });
          localStorage.setItem("agni_pending_scheme_requests", JSON.stringify(allReqs));
        }
      } catch (e) {}
    }

    // 3. Patch backend database if record exists in DB
    if (dbId) {
      try {
        await apiFetch(`/requests/${dbId}/decision`, {
          method: "PATCH",
          body: {
            decision: "REJECTED",
            managerRemarks: "Declined by sales representative",
          },
        });
      } catch (e) {
        try {
          await apiFetch(`/requests/${dbId}/decline`, {
            method: "POST",
            body: { managerRemarks: "Declined by sales representative" },
          });
        } catch (err) {
          console.warn("Could not patch decline decision to backend:", err);
        }
      }
    }

    // 4. Notify all dashboards and listeners
    window.dispatchEvent(new Event("agni_pending_updated"));
    window.dispatchEvent(new Event("agni_requests_updated"));
    window.dispatchEvent(new Event("storage"));

    setNotification(`Request for "${schemeName || clientName}" declined.`);
    setTimeout(() => setNotification(""), 4500);
  };

  const handleApprovePaymentSettlement = async (req) => {
    if (!req) return;
    const paymentId = req.paymentId || req.raw?.paymentId || req.rawId || req.id;
    const targetAmount = Number(req.amount || req.raw?.amount || 0);
    const clientEmail = (req.clientEmail || req.raw?.clientEmail || "").toLowerCase().trim();
    const clientName = req.clientName || req.companyName || "Client";
    const txnRef = req.transactionRef || req.raw?.transactionRef || `TXN-AGNI-${Date.now().toString().slice(-6)}`;

    // 1. Immediately update state so it moves from Pending to History
    setRequests((prev) =>
      prev.map((r) => {
        const matches = r.id === req.id || String(r.paymentId) === String(paymentId);
        return matches
          ? {
              ...r,
              status: "Approved",
              decisionDate: new Date().toISOString().split("T")[0],
              managerRemarks: "Settlement verified & approved by sales representative.",
            }
          : r;
      })
    );

    // 2. Persist in agni_pending_payment_settlement_requests
    try {
      const saved = localStorage.getItem("agni_pending_payment_settlement_requests");
      let list = saved ? JSON.parse(saved) : [];
      if (Array.isArray(list)) {
        let found = false;
        list = list.map((s) => {
          if (s.id === req.id || String(s.paymentId) === String(paymentId)) {
            found = true;
            return {
              ...s,
              status: "Approved",
              decisionDate: new Date().toISOString(),
              managerRemarks: "Settlement verified & approved by sales representative.",
            };
          }
          return s;
        });
        if (!found) {
          list.push({
            ...req,
            status: "Approved",
            decisionDate: new Date().toISOString(),
            managerRemarks: "Settlement verified & approved by sales representative.",
          });
        }
        localStorage.setItem("agni_pending_payment_settlement_requests", JSON.stringify(list));
      }
    } catch (e) {}

    // 3. Mark payment as Paid in all local payment demand lists
    const cleanPayId = String(paymentId || "").replace(/^SETTLE-/, "");
    const updatePaymentStatusLocal = (key) => {
      try {
        const saved = localStorage.getItem(key);
        if (!saved) return;
        const list = JSON.parse(saved);
        if (!Array.isArray(list)) return;
        const updated = list.map((p) => {
          const curPId = String(p.id || p.paymentId || "");
          const matches =
            curPId === String(paymentId) ||
            curPId === cleanPayId ||
            curPId.replace(/^SETTLE-/, "") === cleanPayId ||
            (req.id && curPId === String(req.id)) ||
            (clientEmail && String(p.clientEmail || "").toLowerCase().trim() === clientEmail && Number(p.amount) === targetAmount);

          if (matches) {
            return {
              ...p,
              status: "Paid",
              transactionRef: txnRef,
              paidAt: new Date().toISOString(),
            };
          }
          return p;
        });
        localStorage.setItem(key, JSON.stringify(updated));
      } catch (e) {}
    };

    updatePaymentStatusLocal("agni_sales_payments");
    updatePaymentStatusLocal("agni_payment_demands");
    updatePaymentStatusLocal("agni_client_requests");
    if (clientEmail) {
      updatePaymentStatusLocal(`agni_payment_demands_${clientEmail}`);
    }

    // 4. Update client metrics (paymentReceived + targetAmount, paymentPending - targetAmount)
    if (targetAmount > 0) {
      const updateClientMetrics = async () => {
        let dbClients = [];
        try {
          const res = await apiFetch("/clients");
          if (res.ok) {
            const resJson = await res.json();
            if (Array.isArray(resJson.data)) dbClients = resJson.data;
          }
        } catch (e) {}

        const targetEmail = clientEmail;
        const targetComp = clientName.toLowerCase().trim();
        const targetId = String(req.clientId || req.raw?.clientId || req.rawId || "").toLowerCase().trim();

        // Priority client matcher: exact ID > email/company with matching pending amount > email > company
        const foundDbClient =
          (targetId && targetId !== "1" ? dbClients.find((c) => String(c.id || "").toLowerCase().trim() === targetId) : null) ||
          dbClients.find((c) => {
            const cEmail = String(c.email || "").toLowerCase().trim();
            const curPend = Math.max(0, Number(c.totalPayment || c.amount || 0) - Number(c.paymentReceived || 0));
            return targetEmail && cEmail === targetEmail && Math.abs(curPend - targetAmount) < 5;
          }) ||
          dbClients.find((c) => {
            const cCompany = String(c.companyName || c.name || "").toLowerCase().trim();
            const curPend = Math.max(0, Number(c.totalPayment || c.amount || 0) - Number(c.paymentReceived || 0));
            return targetComp && (cCompany.includes(targetComp) || targetComp.includes(cCompany)) && Math.abs(curPend - targetAmount) < 5;
          }) ||
          dbClients.find((c) => {
            const cEmail = String(c.email || "").toLowerCase().trim();
            return targetEmail && cEmail === targetEmail;
          }) ||
          dbClients.find((c) => {
            const cCompany = String(c.companyName || c.name || "").toLowerCase().trim();
            return targetComp && (cCompany.includes(targetComp) || targetComp.includes(cCompany));
          });

        let newRec = targetAmount;
        let newPend = 0;

        if (foundDbClient) {
          const curRec = parseFloat(String(foundDbClient.paymentReceived || 0).replace(/[^0-9.]/g, "")) || 0;
          const curTot = parseFloat(String(foundDbClient.totalPayment || foundDbClient.amount || 0).replace(/[^0-9.]/g, "")) || (curRec + targetAmount);
          newRec = Math.min(curTot, curRec + targetAmount);
          newPend = Math.max(0, curTot - newRec);

          // Update backend database via PATCH /clients/:id
          try {
            await apiFetch(`/clients/${foundDbClient.id}`, {
              method: "PATCH",
              body: { paymentReceived: newRec },
            });
          } catch (err) {
            console.warn("Could not patch client paymentReceived to backend:", err);
          }

          // If client has invoices, record payment on active invoice
          if (foundDbClient.invoices && foundDbClient.invoices.length > 0) {
            const activeInv = foundDbClient.invoices.find((inv) => inv.status !== "PAID") || foundDbClient.invoices[0];
            if (activeInv && activeInv.id) {
              try {
                await apiFetch(`/invoices/${activeInv.id}/payments`, {
                  method: "POST",
                  body: {
                    amount: targetAmount,
                    paymentMode: req.paymentMode || "ONLINE",
                    referenceNumber: txnRef,
                    remarks: "Settlement approved by sales representative",
                  },
                });
              } catch (invErr) {}
            }
          }
        }

        // Update local storage client caches
        const resolvedClientId = foundDbClient ? String(foundDbClient.id || "").toLowerCase().trim() : (targetId !== "1" ? targetId : "");
        ["agni_sales_clients", "agni_branch_clients", "agni_clients"].forEach((key) => {
          try {
            const saved = localStorage.getItem(key);
            let list = saved ? JSON.parse(saved) : (dbClients.length > 0 ? dbClients : []);
            if (Array.isArray(list)) {
              let matched = false;
              list = list.map((c) => {
                const cId = String(c.id || "").toLowerCase().trim();
                const cEmail = String(c.email || "").toLowerCase().trim();
                const cCompany = String(c.company || c.name || c.companyName || "").toLowerCase().trim();
                const curPend = Math.max(0, Number(c.totalPayment || c.amount || 0) - Number(c.paymentReceived || 0));

                const isMatch =
                  (resolvedClientId && cId === resolvedClientId) ||
                  (!resolvedClientId && (
                    (targetEmail && cEmail === targetEmail && Math.abs(curPend - targetAmount) < 5) ||
                    (targetComp && (cCompany.includes(targetComp) || targetComp.includes(cCompany)) && Math.abs(curPend - targetAmount) < 5) ||
                    (list.length === 1)
                  ));

                if (isMatch) {
                  matched = true;
                  const cRec = parseFloat(String(c.paymentReceived || 0).replace(/[^0-9.]/g, "")) || 0;
                  const cTot = parseFloat(String(c.totalPayment || c.amount || 0).replace(/[^0-9.]/g, "")) || (cRec + targetAmount);
                  const updatedRec = Math.min(cTot, Math.max(newRec, cRec + targetAmount));
                  const updatedPend = Math.max(0, cTot - updatedRec);
                  return {
                    ...c,
                    paymentReceived: String(updatedRec),
                    paymentPending: String(updatedPend),
                  };
                }
                return c;
              });

              if (!matched && (targetEmail || targetComp)) {
                list.push({
                  id: resolvedClientId || `client-${Date.now()}`,
                  name: clientName,
                  company: clientName,
                  companyName: clientName,
                  email: targetEmail,
                  paymentReceived: String(newRec),
                  paymentPending: String(newPend),
                  totalPayment: String(newRec + newPend),
                });
              }
              localStorage.setItem(key, JSON.stringify(list));
            }
          } catch (e) {}
        });
      };
      await updateClientMetrics();
    }

    // 5. Backend patch if db record exists
    const dbId = req.raw?.id && !String(req.raw.id).startsWith("REQ-PAY-") && !String(req.raw.id).startsWith("SETTLE-") ? req.raw.id : null;
    if (dbId) {
      try {
        await apiFetch(`/requests/${dbId}/decision`, {
          method: "PATCH",
          body: { decision: "APPROVED", managerRemarks: "Settlement verified & approved" },
        });
      } catch (e) {
        try {
          await apiFetch(`/requests/${dbId}/approve`, {
            method: "POST",
            body: { managerRemarks: "Settlement verified & approved" },
          });
        } catch (err) {}
      }
    }

    // 6. Broadcast all updates
    window.dispatchEvent(new Event("agni_payments_updated"));
    window.dispatchEvent(new Event("agni_requests_updated"));
    window.dispatchEvent(new Event("agni_pending_updated"));
    window.dispatchEvent(new Event("agni_clients_updated"));
    window.dispatchEvent(new Event("storage"));

    setNotification(`✓ Settlement of ₹${targetAmount.toLocaleString("en-IN")} for ${clientName} approved! Official receipt unlocked for client.`);
    setTimeout(() => setNotification(""), 4500);
  };

  const handleDeclinePaymentSettlement = async (req) => {
    if (!req) return;
    const paymentId = req.paymentId || req.raw?.paymentId || req.rawId || req.id;
    const clientEmail = (req.clientEmail || req.raw?.clientEmail || "").toLowerCase().trim();
    const clientName = req.clientName || req.companyName || "Client";

    // 1. Immediately update state so it moves from Pending to History
    setRequests((prev) =>
      prev.map((r) => {
        const matches = r.id === req.id || String(r.paymentId) === String(paymentId);
        return matches
          ? {
              ...r,
              status: "Declined",
              decisionDate: new Date().toISOString().split("T")[0],
              managerRemarks: "Settlement verification declined by sales representative.",
            }
          : r;
      })
    );

    // 2. Persist in agni_pending_payment_settlement_requests
    try {
      const saved = localStorage.getItem("agni_pending_payment_settlement_requests");
      let list = saved ? JSON.parse(saved) : [];
      if (Array.isArray(list)) {
        let found = false;
        list = list.map((s) => {
          if (s.id === req.id || String(s.paymentId) === String(paymentId)) {
            found = true;
            return {
              ...s,
              status: "Declined",
              decisionDate: new Date().toISOString(),
              managerRemarks: "Settlement verification declined by sales representative.",
            };
          }
          return s;
        });
        if (!found) {
          list.push({
            ...req,
            status: "Declined",
            decisionDate: new Date().toISOString(),
            managerRemarks: "Settlement verification declined by sales representative.",
          });
        }
        localStorage.setItem("agni_pending_payment_settlement_requests", JSON.stringify(list));
      }
    } catch (e) {}

    // 3. Revert payment status back to "Requested" in all payment demand lists
    const revertPaymentStatusLocal = (key) => {
      try {
        const saved = localStorage.getItem(key);
        if (!saved) return;
        const list = JSON.parse(saved);
        if (!Array.isArray(list)) return;
        const updated = list.map((p) => {
          if (String(p.id) === String(paymentId)) {
            return {
              ...p,
              status: "Requested",
              transactionRef: undefined,
              rejectionReason: "Settlement verification declined by sales representative.",
              rejectedAt: new Date().toISOString(),
            };
          }
          return p;
        });
        localStorage.setItem(key, JSON.stringify(updated));
      } catch (e) {}
    };

    revertPaymentStatusLocal("agni_sales_payments");
    revertPaymentStatusLocal("agni_payment_demands");
    revertPaymentStatusLocal("agni_client_requests");
    if (clientEmail) {
      revertPaymentStatusLocal(`agni_payment_demands_${clientEmail}`);
    }

    // 4. Backend patch if db record exists
    const dbId = req.raw?.id && !String(req.raw.id).startsWith("REQ-PAY-") && !String(req.raw.id).startsWith("SETTLE-") ? req.raw.id : null;
    if (dbId) {
      try {
        await apiFetch(`/requests/${dbId}/decision`, {
          method: "PATCH",
          body: { decision: "REJECTED", managerRemarks: "Settlement declined by sales representative" },
        });
      } catch (e) {
        try {
          await apiFetch(`/requests/${dbId}/decline`, {
            method: "POST",
            body: { managerRemarks: "Settlement declined by sales representative" },
          });
        } catch (err) {}
      }
    }

    // 5. Broadcast updates
    window.dispatchEvent(new Event("agni_payments_updated"));
    window.dispatchEvent(new Event("agni_requests_updated"));
    window.dispatchEvent(new Event("agni_pending_updated"));
    window.dispatchEvent(new Event("storage"));

    setNotification(`Settlement request for ${clientName} (${paymentId}) declined. Returned to pending for client re-submission.`);
    setTimeout(() => setNotification(""), 4500);
  };


  return (
    <section className="sales-page-view">
      {/* Header section */}
      <div className="sales-header-banner">
        <div className="sales-header-info">
          <p className="sales-header-eyebrow">
            Workflow & Approvals
          </p>
          <h1 className="sales-header-title">
            My Requests
          </h1>
          <p className="sales-header-subtitle">
            Track client profile edits, scheme enrollments, and payment settlement approvals.
          </p>
        </div>

        <button
          type="button"
          className="sales-add-btn"
          onClick={() => setShowCreateModal(true)}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
          <span>Create Request</span>
        </button>
      </div>

      {/* KPI Stats Ribbon */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 14,
          marginBottom: 20,
        }}
      >
        <div className="analytics-card" style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(140, 95, 248, 0.12)", color: "#8c5ff8", display: "grid", placeItems: "center", fontWeight: 700 }}>
            {stats.total}
          </div>
          <div>
            <span style={{ fontSize: 11.5, color: "#7a748e", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>Total Requests</span>
            <strong style={{ display: "block", fontSize: 16 }}>{stats.total}</strong>
          </div>
        </div>

        <div className="analytics-card" style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(245, 158, 11, 0.14)", color: "#f59e0b", display: "grid", placeItems: "center", fontWeight: 700 }}>
            {stats.pending}
          </div>
          <div>
            <span style={{ fontSize: 11.5, color: "#7a748e", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>Pending Approval</span>
            <strong style={{ display: "block", fontSize: 16, color: "#f59e0b" }}>{stats.pending}</strong>
          </div>
        </div>

        <div className="analytics-card" style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(16, 185, 129, 0.14)", color: "#10b981", display: "grid", placeItems: "center", fontWeight: 700 }}>
            {stats.approved}
          </div>
          <div>
            <span style={{ fontSize: 11.5, color: "#7a748e", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>Approved</span>
            <strong style={{ display: "block", fontSize: 16, color: "#10b981" }}>{stats.approved}</strong>
          </div>
        </div>

        <div className="analytics-card" style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(100, 116, 139, 0.14)", color: "#64748b", display: "grid", placeItems: "center", fontWeight: 700 }}>
            {stats.cancelled}
          </div>
          <div>
            <span style={{ fontSize: 11.5, color: "#7a748e", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>Closed / Cancelled</span>
            <strong style={{ display: "block", fontSize: 16, color: "#64748b" }}>{stats.cancelled}</strong>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: 4,
          borderRadius: 12,
          background: "rgba(140, 95, 248, 0.08)",
          border: "1px solid rgba(140, 95, 248, 0.14)",
          marginBottom: 18,
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const count = tab.id === "Pending Requests" ? pendingRequests.length : historyRequests.length;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 18px",
                borderRadius: 9,
                border: "none",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
                background: isActive ? "linear-gradient(135deg, #8c5ff8 0%, #6d3bf5 100%)" : "transparent",
                color: isActive ? "#ffffff" : "#7a748e",
                boxShadow: isActive ? "0 4px 12px rgba(109, 59, 245, 0.3)" : "none",
              }}
            >
              <span>{tab.label}</span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: 18,
                  height: 18,
                  padding: "0 6px",
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 700,
                  background: isActive ? "rgba(255, 255, 255, 0.25)" : "rgba(140, 95, 248, 0.12)",
                  color: isActive ? "#ffffff" : "#8c5ff8",
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {notification && (
        <div
          style={{
            marginBottom: 18,
            padding: "12px 18px",
            borderRadius: 12,
            background: "linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%)",
            color: "#059669",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            fontWeight: 600,
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            animation: "fadeIn 0.2s ease",
          }}
        >
          <span>{notification}</span>
          <button
            type="button"
            onClick={() => setNotification("")}
            style={{ background: "transparent", border: "none", color: "#059669", cursor: "pointer", fontSize: 14 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Table Card Container */}
      <div className="analytics-card" style={{ padding: 0, overflow: "hidden" }}>
        {activeTab === "Pending Requests" ? (
          <RequestTable
            requests={pendingRequests}
            onView={setSelectedRequest}
            onCancel={cancelPendingRequest}
            onApproveScheme={setApprovingScheme}
            onDeclineScheme={handleDeclineScheme}
            onApprovePayment={handleApprovePaymentSettlement}
            onDeclinePayment={handleDeclinePaymentSettlement}
          />
        ) : (
          <RequestHistory requests={historyRequests} onView={setSelectedRequest} />
        )}
      </div>

      {showCreateModal && (
        <CreateRequestModal
          clients={effectiveClients}
          userEmail={userEmail}
          salesPersonName={salesPersonName}
          onClose={() => setShowCreateModal(false)}
          onSubmit={addRequest}
        />
      )}

      {selectedRequest && (
        <RequestDetailsModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onApprovePayment={handleApprovePaymentSettlement}
          onDeclinePayment={handleDeclinePaymentSettlement}
        />
      )}

      {approvingScheme && (
        <ApproveSchemeModal
          request={approvingScheme}
          onClose={() => setApprovingScheme(null)}
          onSubmit={handleApproveScheme}
        />
      )}
    </section>
  );
}

export function isEligibleSchemeRequest(req = {}) {
  if (!req) return false;
  const type = String(req.requestType || req.type || "").toLowerCase();
  return type.includes("scheme") || type.includes("service") || type.includes("enrollment");
}

