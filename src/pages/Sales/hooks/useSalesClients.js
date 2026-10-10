import { useState, useMemo, useEffect } from "react";
import {
  GST_RATE,
  schemeOptions,
  serviceTypeSchemes,
  initialNewClientState,
  salesLeads,
} from "../mockSalesData";
import { salesTeam } from "../../Manager/mockManagerData";
import { getTrackerState } from "../../../utils/schemeTracker";
import { sanitizeClientRecord, mergeSecondaryClients } from "../../../utils/branchHelper";
import { apiFetch } from "../../../services/apiClient";
import { isMockClient } from "../../../utils/revenueCalculator";
import { getSalesPersonQuota } from "../../../utils/salesConfigHelper";

export function useSalesClients(salesPersonName, onClientAdded, userEmail) {
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientSearch, setClientSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [newClient, setNewClient] = useState(initialNewClientState);
  const [configUpdateTrigger, setConfigUpdateTrigger] = useState(0);

  useEffect(() => {
    const handleConfigUpdate = () => {
      setConfigUpdateTrigger((prev) => prev + 1);
    };
    window.addEventListener("agni_sales_config_updated", handleConfigUpdate);
    window.addEventListener("storage", handleConfigUpdate);
    return () => {
      window.removeEventListener("agni_sales_config_updated", handleConfigUpdate);
      window.removeEventListener("storage", handleConfigUpdate);
    };
  }, []);

  useEffect(() => {
    async function fetchSalesClientsFromDB() {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      const token = localStorage.getItem("agni_token");
      if (!token) return;

      try {
        const response = await apiFetch("/clients");

        if (response.ok) {
          const resData = await response.json();
          if (resData.success && Array.isArray(resData.data)) {
            const mappedDbClients = resData.data.map((c) => {
              const tracker = getTrackerState({
                ...c,
                scheme: c.serviceName || c.scheme,
              });

              const isSec = c.isPrimary === false || c.processType === "secondary" || c.serviceType === "More Services" || (typeof c.appId === "string" && (c.appId.endsWith("-S") || c.appId.endsWith("-E")));
              const rawTot = Number(c.totalPayment !== undefined && c.totalPayment !== null ? c.totalPayment : (c.invoices?.[0]?.rawTotal || c.fundingRequirement || 0));
              const finalTot = (!isSec && rawTot === 0) ? 118000 : rawTot;
              const rawRec = Number(c.paymentReceived !== undefined && c.paymentReceived !== null ? c.paymentReceived : (c.invoices?.[0]?.paymentReceived || 0));
              const finalRec = Math.min(finalTot, rawRec);
              const finalPend = c.paymentPending !== undefined && c.paymentPending !== null && !isNaN(Number(c.paymentPending))
                ? Number(c.paymentPending)
                : Math.max(0, finalTot - finalRec);

              return sanitizeClientRecord({
                ...c,
                id: c.id,
                appId: c.appId,
                name: c.name,
                company: c.companyName,
                contactPerson: c.contactPerson,
                email: c.email,
                phone: c.phone,
                branch: c.branch?.name || "West Zone (Mumbai)",
                region: c.branch?.region || "West Zone",
                scheme: c.serviceName,
                serviceType: c.serviceType,
                assignedSalesPerson: c.salesPerson?.fullName || c.owner || salesPersonName || "Mia Rose",
                salesRep: c.salesPerson?.fullName || c.owner || salesPersonName || "Mia Rose",
                owner: c.salesPerson?.fullName || c.owner || salesPersonName || "Mia Rose",
                applicationStatus: c.applicationStatus || "CRM Creation",
                completedSteps: tracker.completedStages,
                progress: c.progressPercent || tracker.progressPercent,
                revenue: String(finalTot),
                totalPayment: String(finalTot),
                amount: String(Math.round(finalTot / 1.18)),
                paymentReceived: String(finalRec),
                paymentPending: String(finalPend),
                approvalStatus: c.approvalStatus,
                documentStatus: c.documentStatus,
                documents: c.documents || [],
                processType: isSec ? "secondary" : (c.processType || "primary"),
                isPrimary: c.isPrimary !== undefined ? c.isPrimary : !isSec,
                createdAt: c.createdAt,
                invoices: c.invoices || [],
                eligibleSchemes: c.eligibleSchemes || [],
                dueDate: c.dueDate || null,
              });
            });

            const fullDbClients = mergeSecondaryClients(mappedDbClients);
            setClients(fullDbClients);
          }
        }
      } catch (err) {
        console.warn("Could not fetch sales clients from DB:", err);
      }
    }

    fetchSalesClientsFromDB();

    const handleVisibility = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        fetchSalesClientsFromDB();
      }
    };

    window.addEventListener("storage", fetchSalesClientsFromDB);
    window.addEventListener("agni_pending_updated", fetchSalesClientsFromDB);
    window.addEventListener("agni_clients_updated", fetchSalesClientsFromDB);
    window.addEventListener("agni_payments_updated", fetchSalesClientsFromDB);
    window.addEventListener("agni_invoices_updated", fetchSalesClientsFromDB);
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibility);
    }
    const interval = setInterval(fetchSalesClientsFromDB, 60000);

    return () => {
      window.removeEventListener("storage", fetchSalesClientsFromDB);
      window.removeEventListener("agni_pending_updated", fetchSalesClientsFromDB);
      window.removeEventListener("agni_clients_updated", fetchSalesClientsFromDB);
      window.removeEventListener("agni_payments_updated", fetchSalesClientsFromDB);
      window.removeEventListener("agni_invoices_updated", fetchSalesClientsFromDB);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibility);
      }
      clearInterval(interval);
    };
  }, [salesPersonName]);

  // Filtered clients list for directory table in Details tab
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const q = clientSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.company && c.company.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.phone && c.phone.toLowerCase().includes(q)) ||
        (c.scheme && c.scheme.toLowerCase().includes(q)) ||
        (c.serviceType && c.serviceType.toLowerCase().includes(q));

      const filterLower = (stageFilter || "all").toLowerCase().trim();
      const clientServiceTypeLower = (c.serviceType || "").toLowerCase().trim();
      const clientStageLower = (c.stage || "").toLowerCase().trim();

      const matchesStage =
        filterLower === "all" ||
        clientStageLower === filterLower ||
        clientServiceTypeLower === filterLower ||
        (filterLower.includes("consult") && clientServiceTypeLower.includes("consult")) ||
        (filterLower.includes("cert") && clientServiceTypeLower.includes("cert")) ||
        (filterLower === "it" && clientServiceTypeLower === "it") ||
        (filterLower.includes("market") && clientServiceTypeLower.includes("market"));

      let matchesPayment = true;
      const pending = parseFloat(c.paymentPending) || 0;
      const received = parseFloat(c.paymentReceived) || 0;
      if (paymentFilter === "paid") {
        matchesPayment = pending === 0 && received > 0;
      } else if (paymentFilter === "partial") {
        matchesPayment = pending > 0 && received > 0;
      } else if (paymentFilter === "pending") {
        matchesPayment = received === 0;
      }

      return matchesSearch && matchesStage && matchesPayment;
    });
  }, [clients, clientSearch, stageFilter, paymentFilter]);

  const { totalActiveClients, totalClosedDeals } = useMemo(() => {
    let active = 0;
    let closed = 0;
    for (let i = 0; i < clients.length; i++) {
      const client = clients[i];
      if (client.stage === "Active" || client.stage === "ACTIVE" || client.approvalStatus === "ACTIVE") {
        active++;
      }
      if (client.stage === "COMPLETED" || client.stage === "Completed" || client.applicationStatus === "Completed") {
        closed++;
      }
    }
    return { totalActiveClients: active, totalClosedDeals: closed };
  }, [clients]);

  const quotaMetrics = useMemo(() => {
    let totalRealized = clients.reduce((sum, c) => {
      // Gross received = max of client.paymentReceived vs total invoice payments received
      const invoicePayments = (c.invoices || []).reduce((s, inv) => s + Number(inv.paymentReceived || 0), 0);
      const grossRec = Math.max(
        Number(c.paymentReceived || 0),
        invoicePayments,
      );

      if (grossRec <= 0) return sum;

      // Formula: Net Revenue = Math.round(Gross Received / 1.18)
      // Same as revenueCalculator.js — strips GST from gross payment
      const netRec = Math.round(grossRec / 1.18);
      return sum + netRec;
    }, 0);

    const initialQuotaTarget = Number(getSalesPersonQuota(salesPersonName, 80000));
    const leftNum = Math.max(initialQuotaTarget - totalRealized, 0);
    const progressPct = initialQuotaTarget > 0 ? Math.min(100, Math.round((totalRealized / initialQuotaTarget) * 100)) : 0;
    const incentiveNum = totalRealized > initialQuotaTarget ? (totalRealized - initialQuotaTarget) : 0;

    // Daily Achieved Quota for this salesperson (reverts to 0 every other day)
    // Formula: Realized Net = Math.round(Gross Received / 1.18) (excl. 18% GST)
    // Works strictly like the Owner Dashboard revenue engine, scoped exclusively to this salesperson
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();

    function parseDateTimestamp(dateInput) {
      if (!dateInput) return null;
      if (dateInput instanceof Date) return dateInput.getTime();
      if (typeof dateInput === "number") return dateInput;
      if (typeof dateInput === "string") {
        const trimmed = dateInput.trim();
        if (!trimmed) return null;
        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
          const [y, m, d] = trimmed.split("-").map(Number);
          return new Date(y, m - 1, d).getTime();
        }
        const parsed = new Date(trimmed).getTime();
        if (!isNaN(parsed)) return parsed;
      }
      return null;
    }

    const sLower = (salesPersonName || "").toLowerCase().trim();
    const myClients = clients.filter((c) => {
      if (!sLower) return true;
      const rep = (c.assignedSalesPerson || c.salesRep || c.owner || "").toLowerCase().trim();
      return !rep || rep.includes(sLower) || sLower.includes(rep);
    });

    let dailyAchievedNet = 0;
    myClients.forEach((client) => {
      if (isMockClient(client)) return;

      const invoices = Array.isArray(client.invoices) ? client.invoices : [];
      const payments = Array.isArray(client.payments) && client.payments.length > 0
        ? client.payments
        : invoices.flatMap((inv) => Array.isArray(inv.payments) ? inv.payments : []);

      let processedFromPayments = 0;
      if (payments.length > 0) {
        payments.forEach((payment) => {
          const status = String(payment.status || "SUCCESS").toUpperCase();
          if (status === "FAILED" || status === "PENDING" || status === "CANCELLED" || status === "DECLINED") return;

          const paymentDate = payment.paymentDate || payment.date || payment.createdAt;
          const timestamp = parseDateTimestamp(paymentDate);
          const grossAmount = Number(payment.amount || payment.paidAmount || 0);

          if (timestamp !== null && timestamp >= startOfToday && timestamp <= endOfToday && grossAmount > 0) {
            dailyAchievedNet += Math.round(grossAmount / 1.18);
            processedFromPayments += grossAmount;
          }
        });
      }

      // Check direct payment received if not already accounted for by detailed payments
      const totalRec = Number(client.paymentReceived || 0);
      const remainingDirect = Math.max(0, totalRec - processedFromPayments);
      if (remainingDirect > 0) {
        const paymentDate = client.lastPaymentDate || client.paymentDate || client.createdAt;
        const timestamp = parseDateTimestamp(paymentDate);
        if (timestamp !== null && timestamp >= startOfToday && timestamp <= endOfToday) {
          dailyAchievedNet += Math.round(remainingDirect / 1.18);
        }
      }
    });

    return {
      initialQuotaTarget,
      totalRealized,
      achieved: `₹${totalRealized.toLocaleString("en-IN")}`,
      left: `₹${leftNum.toLocaleString("en-IN")}`,
      incentive: `₹${incentiveNum.toLocaleString("en-IN")}`,
      progress: `${progressPct}%`,
      dailyAchieved: `₹${dailyAchievedNet.toLocaleString("en-IN")}`,
      dailyAchievedNum: dailyAchievedNet,
    };
  }, [clients, salesPersonName, configUpdateTrigger]);

  const kpiCards = useMemo(() => [
    { label: "Active clients", value: `${totalActiveClients}`, trend: "+0%", description: "Currently active", accent: "#4e7cff", icon: "clients" },
    { label: "Total closed", value: `${totalClosedDeals}`, trend: "+0%", description: "Closed deals", accent: "#44bfb0", icon: "checkCircle" },
    { label: "Quota achieved", value: quotaMetrics.achieved, trend: "+0%", description: "Realized (excl. 18% GST)", accent: "#10b981", icon: "currency" },
    { label: "Quota left", value: quotaMetrics.left, trend: "Remaining gap", description: "To reach target", accent: "#f43f5e", icon: "wallet" },
    { label: "Quota progress", value: quotaMetrics.progress, trend: "+0%", description: "Towards target", accent: "#9a74e9", icon: "revenue" },
    { label: "Daily Quota", value: quotaMetrics.dailyAchieved, trend: "Today", description: "Realized today (excl. 18% GST)", accent: "#f2aa38", icon: "calendarToday" },
  ], [totalActiveClients, totalClosedDeals, quotaMetrics]);

  const monthlyQuotaChartData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const acquiredData = Array(12).fill(0);

    clients.forEach((client) => {
      const invoices = Array.isArray(client.invoices) ? client.invoices : [];
      const payments = Array.isArray(client.payments) && client.payments.length > 0
        ? client.payments
        : invoices.flatMap((invoice) => Array.isArray(invoice.payments) ? invoice.payments : []);

      if (payments.length > 0) {
        payments.forEach((payment) => {
          const status = String(payment.status || "SUCCESS").toUpperCase();
          if (status === "FAILED" || status === "PENDING" || status === "CANCELLED") return;

          const paymentDate = new Date(payment.paymentDate || payment.date || payment.createdAt || "");
          const grossAmount = Number(payment.amount || payment.paidAmount || 0);
          if (
            !Number.isFinite(paymentDate.getTime()) ||
            String(paymentDate.getFullYear()) !== selectedYear ||
            grossAmount <= 0
          ) return;

          acquiredData[paymentDate.getMonth()] += Math.round(grossAmount / 1.18);
        });
        return;
      }

      const invoicePayments = invoices.reduce(
        (sum, invoice) => sum + Number(invoice.paymentReceived || 0),
        0,
      );
      const grossAmount = Math.max(Number(client.paymentReceived || 0), invoicePayments);
      const paymentDate = new Date(
        client.lastPaymentDate || client.paymentDate || client.updatedAt || client.createdAt || "",
      );
      if (
        !Number.isFinite(paymentDate.getTime()) ||
        String(paymentDate.getFullYear()) !== selectedYear ||
        grossAmount <= 0
      ) return;

      acquiredData[paymentDate.getMonth()] += Math.round(grossAmount / 1.18);
    });

    const curYear = String(new Date().getFullYear());
    if (selectedYear === curYear) {
      const curMonthIdx = new Date().getMonth();
      acquiredData[curMonthIdx] = Math.max(acquiredData[curMonthIdx], quotaMetrics.totalRealized || 0);
    }

    return {
      months,
      quotaData: months.map(() => quotaMetrics.initialQuotaTarget || 80000),
      acquiredData,
    };
  }, [clients, selectedYear, quotaMetrics]);

  const handleNewClientChange = (event) => {
    const { name, value } = event.target;
    setNewClient((prev) => {
      let next = { ...prev, [name]: value };

      if (name === "serviceType") {
        const available = serviceTypeSchemes[value] || serviceTypeSchemes.Certificate || [];
        if (!available.includes(next.scheme)) {
          next.scheme = available[0] || "";
        }
      }

      const amountNum = parseFloat(next.amount) || 0;
      const receivedNum = parseFloat(next.paymentReceived) || 0;
      const gstAmount = next.paymentMode === "Online" ? Math.round(amountNum * GST_RATE) : 0;
      const totalPayment = amountNum + gstAmount;
      const paymentPending = Math.max(totalPayment - receivedNum, 0);

      return {
        ...next,
        gstAmount,
        totalPayment,
        paymentPending,
      };
    });
  };

  const handleClearClientForm = () => {
    setNewClient(initialNewClientState);
  };

  const handleAddClient = async (event) => {
    event.preventDefault();

    let rawServiceType = (newClient.serviceType || "CONSULTANCY").toUpperCase();
    if (rawServiceType.includes("CERT")) rawServiceType = "CERTIFICATE";
    else if (rawServiceType.includes("CONSULT")) rawServiceType = "CONSULTANCY";
    else if (rawServiceType.includes("IT")) rawServiceType = "IT";
    else if (rawServiceType.includes("MARKET")) rawServiceType = "MARKETING";

    const payload = {
      companyName: newClient.company || newClient.name,
      contactPerson: newClient.contactPerson || newClient.name,
      name: newClient.company || newClient.name,
      email: newClient.email ? newClient.email.trim().toLowerCase() : "",
      phone: newClient.phone,
      address: newClient.address || "Main Street, Metro City",
      serviceType: rawServiceType,
      serviceName: newClient.scheme || "PMEGP",
      amount: Number(newClient.totalPayment || newClient.amount || 0),
      paymentMode: (newClient.paymentMode || "ONLINE").toUpperCase() === "OFFLINE" ? "OFFLINE" : "ONLINE",
      paymentReceived: Number(newClient.paymentReceived || 0),
      adminNotes: newClient.notes || "Client profile registered by salesperson.",
      salesPersonEmail: userEmail || undefined,
    };

    try {
      const res = await apiFetch("/clients", {
        method: "POST",
        body: payload,
      });

      if (res.ok) {
        const resData = await res.json();

        window.dispatchEvent(new CustomEvent("agni_pending_updated"));
        window.dispatchEvent(new CustomEvent("agni_clients_updated"));
        window.dispatchEvent(new Event("storage"));

        setNewClient(initialNewClientState);

        if (onClientAdded) {
          onClientAdded(resData.data);
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error("Server returned error:", errorData);
        alert(`Failed to register client: ${errorData.message || 'Validation error'}`);
      }
    } catch (err) {
      console.error("Failed to register client on API server:", err);
      alert("Network error: Failed to connect to the server.");
    }
  };

  const handleSaveClientSchemes = (clientId, updatedSchemes) => {
    if (!clientId || !updatedSchemes) return;

    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId || (selectedClient?.email && c.email && c.email.toLowerCase() === selectedClient.email.toLowerCase())
          ? { ...c, eligibleSchemes: updatedSchemes }
          : c
      )
    );

    setSelectedClient((prev) => {
      if (!prev) return null;
      if (prev.id === clientId || (prev.email && selectedClient?.email && prev.email.toLowerCase() === selectedClient.email.toLowerCase())) {
        return { ...prev, eligibleSchemes: updatedSchemes };
      }
      return prev;
    });

    if (clientId) {
      apiFetch(`/clients/${clientId}/eligible-schemes`, {
        method: "PATCH",
        body: { eligibleSchemes: updatedSchemes },
      }).catch((err) => {
        console.warn("Failed to persist eligible schemes to backend:", err);
      });
    }

    window.dispatchEvent(new CustomEvent("agni_clients_updated"));
  };

  const handleUpdateClientDueDate = async (clientId, newDueDate) => {
    if (!clientId) return;

    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId || (selectedClient?.email && c.email && c.email.toLowerCase() === selectedClient.email.toLowerCase())
          ? { ...c, dueDate: newDueDate }
          : c
      )
    );

    setSelectedClient((prev) => {
      if (!prev) return null;
      if (prev.id === clientId || (prev.email && selectedClient?.email && prev.email.toLowerCase() === selectedClient.email.toLowerCase())) {
        return { ...prev, dueDate: newDueDate };
      }
      return prev;
    });

    try {
      await apiFetch(`/clients/${clientId}/due-date`, {
        method: "PATCH",
        body: { dueDate: newDueDate },
      });
    } catch (err) {
      console.warn("Failed to persist due date to backend:", err);
    }

    window.dispatchEvent(new CustomEvent("agni_clients_updated"));
  };

  const handleVerifyDocument = async (clientId, docName, newStatus) => {
    if (!clientId) return;
    const apiStatus = newStatus === "Verified" ? "VERIFIED" : "NOT_SUBMITTED";
    try {
      const res = await apiFetch(`/clients/${clientId}/documents`, {
        method: "POST",
        body: { documentName: docName, status: apiStatus },
      });
      if (res.ok) {
        const resData = await res.json();
        const updatedDoc = resData.data; // The returned ClientDocument
        
        const clientEmailKey = selectedClient?.email ? selectedClient.email.toLowerCase() : "";
        
        setClients((prev) =>
          prev.map((c) => {
            if (c.id === clientId || (clientEmailKey && c.email && c.email.toLowerCase() === clientEmailKey)) {
              // Update the documents array
              const existingDocs = c.documents || [];
              const docIndex = existingDocs.findIndex(d => d.documentName === docName);
              const newDocs = [...existingDocs];
              if (docIndex >= 0) {
                newDocs[docIndex] = { ...newDocs[docIndex], ...updatedDoc };
              } else {
                newDocs.push(updatedDoc);
              }
              return { ...c, documents: newDocs };
            }
            return c;
          })
        );
        
        setSelectedClient((prev) => {
          if (!prev) return null;
          const existingDocs = prev.documents || [];
          const docIndex = existingDocs.findIndex(d => d.documentName === docName);
          const newDocs = [...existingDocs];
          if (docIndex >= 0) {
            newDocs[docIndex] = { ...newDocs[docIndex], ...updatedDoc };
          } else {
            newDocs.push(updatedDoc);
          }
          return { ...prev, documents: newDocs };
        });
        
        window.dispatchEvent(new CustomEvent("agni_clients_updated"));
      }
    } catch (err) {
      console.warn("Failed to update document status:", err);
    }
  };

  const [pendingSchemeRequests, setPendingSchemeRequests] = useState([]);

  const handleApproveSchemeRequest = async (reqId, reqAmt, pitchedAmt) => {
    try {
      await apiFetch(`/requests/${reqId}/approve`, { method: "POST", body: { reqAmt, pitchedAmt } });
      setPendingSchemeRequests((prev) => prev.filter((r) => r.id !== reqId));
      window.dispatchEvent(new CustomEvent("agni_clients_updated"));
    } catch (e) {
      console.warn("Failed to approve request:", e);
    }
  };

  const handleDeclineSchemeRequest = async (reqId) => {
    try {
      await apiFetch(`/requests/${reqId}/decline`, { method: "POST" });
      setPendingSchemeRequests((prev) => prev.filter((r) => r.id !== reqId));
      window.dispatchEvent(new CustomEvent("agni_clients_updated"));
    } catch (e) {
      console.warn("Failed to decline request:", e);
    }
  };

  return {
    clients,
    setClients,
    selectedClient,
    setSelectedClient,
    clientSearch,
    setClientSearch,
    stageFilter,
    setStageFilter,
    paymentFilter,
    setPaymentFilter,
    newClient,
    setNewClient,
    filteredClients,
    kpiCards,
    quotaMetrics,
    selectedYear,
    setSelectedYear,
    monthlyQuotaChartData,
    handleNewClientChange,
    handleClearClientForm,
    handleAddClient,
    handleSaveClientSchemes,
    handleVerifyDocument,
    pendingSchemeRequests,
    handleApproveSchemeRequest,
    handleDeclineSchemeRequest,
    handleUpdateClientDueDate,
  };
}

export function normalizeSchemeName(schemeName = "") {
  return String(schemeName || "").toLowerCase().trim();
}

export function isSameClientScheme(c1 = {}, c2 = {}) {
  const e1 = (c1.email || "").toLowerCase().trim();
  const e2 = (c2.email || "").toLowerCase().trim();
  const s1 = normalizeSchemeName(c1.scheme || c1.serviceName);
  const s2 = normalizeSchemeName(c2.scheme || c2.serviceName);
  return e1 === e2 && s1 === s2;
}

export function isClientCreatedByUser(client = {}, userEmailOrName = "", userEmail = "") {
  if (!client) return false;
  if (!userEmailOrName && !userEmail) return true;

  const targetName = String(userEmailOrName || "").toLowerCase().trim();
  const targetEmail = String(userEmail || "").toLowerCase().trim();

  // Extract all possible salesperson identifiers from client
  const spObj = typeof client.salesPerson === "object" && client.salesPerson !== null ? client.salesPerson : {};
  const salesPersonFullName = String(spObj.fullName || spObj.name || "").toLowerCase().trim();
  const salesPersonEmail = String(spObj.email || client.salesPersonEmail || "").toLowerCase().trim();
  const salesPersonId = String(spObj.id || client.salesPersonId || "").toLowerCase().trim();

  const owner = String(client.owner || client.salesRep || (typeof client.salesPerson === "string" ? client.salesPerson : "") || "").toLowerCase().trim();
  const clientEmail = String(client.email || "").toLowerCase().trim();

  if (targetEmail) {
    if (salesPersonEmail && (salesPersonEmail === targetEmail || salesPersonEmail.includes(targetEmail) || targetEmail.includes(salesPersonEmail))) return true;
    if (clientEmail === targetEmail) return true;
  }

  if (targetName) {
    if (targetName.includes("@")) {
      if (salesPersonEmail && (salesPersonEmail === targetName || salesPersonEmail.includes(targetName) || targetName.includes(salesPersonEmail))) return true;
      if (clientEmail === targetName) return true;
    }
    if (salesPersonFullName && (salesPersonFullName.includes(targetName) || targetName.includes(salesPersonFullName))) return true;
    if (owner && (owner.includes(targetName) || targetName.includes(owner))) return true;
    if (salesPersonId && targetName === salesPersonId) return true;
  }

  // If client record has no salesperson info at all, don't arbitrarily hide it
  if (!salesPersonFullName && !salesPersonEmail && !salesPersonId && !owner) {
    return true;
  }

  return false;
}

