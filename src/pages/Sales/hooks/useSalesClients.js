import { useState, useMemo, useEffect } from "react";
import {
  GST_RATE,
  schemeOptions,
  serviceTypeSchemes,
  initialSalesClients,
  initialNewClientState,
  salesLeads,
} from "../mockSalesData";
import { salesTeam } from "../../Manager/mockManagerData";
import { getTrackerState } from "../../../utils/schemeTracker";
import { sanitizeClientRecord, mergeSecondaryClients } from "../../../utils/branchHelper";
import { apiFetch } from "../../../services/apiClient";

export function useSalesClients(salesPersonName, onClientAdded) {
  const [clients, setClients] = useState(initialSalesClients);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientSearch, setClientSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [newClient, setNewClient] = useState(initialNewClientState);

  useEffect(() => {
    async function fetchSalesClientsFromDB() {
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
              const rawTot = Number(c.totalPayment || c.invoices?.[0]?.rawTotal || c.fundingRequirement || 0);
              const finalTot = (!isSec && rawTot === 0) ? 118000 : rawTot;
              const rawRec = Math.max(Number(c.paymentReceived || 0), Number(c.invoices?.[0]?.paymentReceived || 0));
              const finalRec = (!isSec && rawRec === 0 && (c.paymentStatus === "Paid" || c.approvalStatus === "ACTIVE")) ? finalTot : rawRec;
              const finalPend = Math.max(0, finalTot - finalRec);

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

    window.addEventListener("storage", fetchSalesClientsFromDB);
    window.addEventListener("agni_pending_updated", fetchSalesClientsFromDB);
    window.addEventListener("agni_clients_updated", fetchSalesClientsFromDB);
    const interval = setInterval(fetchSalesClientsFromDB, 30000);

    return () => {
      window.removeEventListener("storage", fetchSalesClientsFromDB);
      window.removeEventListener("agni_pending_updated", fetchSalesClientsFromDB);
      window.removeEventListener("agni_clients_updated", fetchSalesClientsFromDB);
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

  const totalActiveClients = clients.filter((client) => client.stage === "Active" || client.stage === "ACTIVE" || client.approvalStatus === "ACTIVE").length;
  const totalClosedDeals = clients.filter((client) => client.stage === "COMPLETED" || client.stage === "Completed" || client.applicationStatus === "Completed").length;

  const quotaMetrics = useMemo(() => {
    const totalRealized = clients.reduce((sum, c) => {
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

    const initialQuotaTarget = 80000;
    const leftNum = Math.max(initialQuotaTarget - totalRealized, 0);
    const progressPct = initialQuotaTarget > 0 ? Math.min(100, Math.round((totalRealized / initialQuotaTarget) * 100)) : 0;
    const incentiveNum = totalRealized > initialQuotaTarget ? (totalRealized - initialQuotaTarget) : 0;

    return {
      achieved: `₹${totalRealized.toLocaleString("en-IN")}`,
      left: `₹${leftNum.toLocaleString("en-IN")}`,
      incentive: `₹${incentiveNum.toLocaleString("en-IN")}`,
      progress: `${progressPct}%`,
    };
  }, [clients]);

  const kpiCards = useMemo(() => [
    { label: "Active clients", value: `${totalActiveClients}`, trend: "+0%", description: "Currently active", accent: "#4e7cff", icon: "clients" },
    { label: "Total closed", value: `${totalClosedDeals}`, trend: "+0%", description: "Closed deals", accent: "#44bfb0", icon: "checkCircle" },
    { label: "Quota achieved", value: quotaMetrics.achieved, trend: "+0%", description: "Realized (excl. 18% GST)", accent: "#10b981", icon: "currency" },
    { label: "Quota left", value: quotaMetrics.left, trend: "Remaining gap", description: "To reach target", accent: "#f43f5e", icon: "wallet" },
    { label: "Quota progress", value: quotaMetrics.progress, trend: "+0%", description: "Towards target", accent: "#9a74e9", icon: "revenue" },
    { label: "Incentive", value: quotaMetrics.incentive, trend: "+0%", description: "Earned this month", accent: "#f2aa38", icon: "incentive" },
  ], [totalActiveClients, totalClosedDeals, quotaMetrics]);

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
      salesPersonEmail: localStorage.getItem("agni_user_email") || localStorage.getItem("agni_email") || undefined,
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

    const clientEmailKey = selectedClient?.email ? selectedClient.email.trim().toLowerCase() : "";
    if (clientEmailKey) {
      try {
        localStorage.setItem(`agni_client_eligible_schemes_${clientEmailKey}`, JSON.stringify(updatedSchemes));
        localStorage.setItem(`agni_approved_client_plans_${clientEmailKey}`, JSON.stringify(updatedSchemes));
      } catch (e) { }

      try {
        ["agni_sales_clients", "agni_branch_clients"].forEach((storageKey) => {
          const savedList = localStorage.getItem(storageKey);
          if (savedList) {
            const list = JSON.parse(savedList);
            if (Array.isArray(list)) {
              const updated = list.map((c) =>
                c.email && c.email.toLowerCase().trim() === clientEmailKey
                  ? { ...c, eligibleSchemes: updatedSchemes }
                  : c
              );
              localStorage.setItem(storageKey, JSON.stringify(updated));
            }
          }
        });
      } catch (e) { }
    }

    if (clientId) {
      apiFetch(`/clients/${clientId}/eligible-schemes`, {
        method: "PATCH",
        body: { eligibleSchemes: updatedSchemes },
      }).catch((err) => {
        console.warn("Failed to persist eligible schemes to backend:", err);
      });
    }

    window.dispatchEvent(new Event("storage"));
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

    const clientEmailKey = selectedClient?.email ? selectedClient.email.trim().toLowerCase() : "";
    if (clientEmailKey) {
      try {
        localStorage.setItem(`agni_client_due_date_${clientEmailKey}`, newDueDate || "");
      } catch (e) {}

      try {
        ["agni_sales_clients", "agni_branch_clients"].forEach((storageKey) => {
          const savedList = localStorage.getItem(storageKey);
          if (savedList) {
            const list = JSON.parse(savedList);
            if (Array.isArray(list)) {
              const updated = list.map((c) =>
                c.email && c.email.toLowerCase().trim() === clientEmailKey
                  ? { ...c, dueDate: newDueDate }
                  : c
              );
              localStorage.setItem(storageKey, JSON.stringify(updated));
            }
          }
        });
      } catch (e) {}
    }

    try {
      await apiFetch(`/clients/${clientId}/due-date`, {
        method: "PATCH",
        body: { dueDate: newDueDate },
      });
    } catch (err) {
      console.warn("Failed to persist due date to backend:", err);
    }

    window.dispatchEvent(new Event("storage"));
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

export function isClientCreatedByUser(client = {}, userEmailOrName = "") {
  if (!client || !userEmailOrName) return true;
  const target = String(userEmailOrName).toLowerCase().trim();
  const owner = String(client.owner || client.salesRep || client.salesPerson || "").toLowerCase().trim();
  const email = String(client.email || "").toLowerCase().trim();
  return owner.includes(target) || target.includes(owner) || email === target;
}
