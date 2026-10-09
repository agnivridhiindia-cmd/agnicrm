import React, { useState, useMemo, useRef, useEffect } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import DashboardSidebar from "../../components/dashboard/DashboardSidebar";
import DashboardHeader from "../../components/dashboard/DashboardHeader";
import NotificationBell from "../../components/dashboard/NotificationBell";
import UserProfileMenu from "../../components/dashboard/UserProfileMenu";
import Icon from "../../components/Icon";
import Modal from "../../components/Modal";
import SimpleModal from "../../components/SimpleModal";
import EditForm from "../../components/EditForm";
import ConfirmDialog from "../../components/ConfirmDialog";
import ActivityTracker from "../../components/ActivityTracker";
import { getTrackerState, getCanonicalSchemeName } from "../../utils/schemeTracker";
import { sanitizeClientRecord, normalizeSalesPersonName, sortByRoleRanking, mergeSecondaryClients } from "../../utils/branchHelper";
import { apiFetch } from "../../services/apiClient";
import { isMockClient } from "../../utils/revenueCalculator";
import { ACTIVITY_STAGES } from "../Admin/mockAdminData";
import { useAuth } from "../../context/AuthContext";
import "./owner.css";

// Modular Page Components
import OwnerOverviewPage from "./OwnerOverviewPage";
import OwnerClientsPage from "./OwnerClientsPage";
import OwnerEmployeesPage from "./OwnerEmployeesPage";
import OwnerRevenuePage from "./OwnerRevenuePage";
import OwnerInvoicePage from "./OwnerInvoicePage";
import OwnerRequestsPage from "./OwnerRequestsPage";
import OwnerAgreementPage from "./OwnerAgreementPage";
import OwnerClientInfoModal from "./OwnerClientInfoModal";
import OwnerEmployeeInfoModal from "./OwnerEmployeeInfoModal";
import OwnerInvoiceDetailsModal from "./OwnerInvoiceDetailsModal";
import OwnerRequestDecisionModal from "./OwnerRequestDecisionModal";

// Data & Configs
import {
  navItems,
  initialOwnerEmployees,
  initialInvoices,
  initialRequests,
  notifications,
  downloadInvoiceFile,
} from "./mockOwnerData";

export default function OwnerDashboard({ onSignOut, userEmail }) {
  const { user: authUser, userName: authName } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const urlToNavMap = useMemo(() => ({
    dashboard: "Dashboard",
    overview: "Dashboard",
    clients: "Clients",
    client: "Clients",
    agreement: "Agreement",
    agreements: "Agreement",
    revenue: "Revenue",
    revenues: "Revenue",
    employees: "Employees",
    employee: "Employees",
    team: "Employees",
    requests: "Requests",
    request: "Requests",
    invoice: "Invoice",
    invoices: "Invoice",
    billing: "Invoice",
  }), []);

  const pathParts = location.pathname.split("/").filter(Boolean);
  const currentSlug = pathParts[1] || "dashboard";
  const activeNav = urlToNavMap[currentSlug.toLowerCase()] || "Dashboard";

  const handleNavChange = (label) => {
    const slug = label.toLowerCase();
    navigate(`/owner/${slug}`);
  };

  const [dark, setDark] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [currentUser, setCurrentUser] = useState(() => authUser);

  // Authoritatively fetch logged-in Owner profile from PostgreSQL database
  useEffect(() => {
    let isMounted = true;
    apiFetch("/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data?.success && data?.user) {
          setCurrentUser(data.user);
          if (data.user.fullName || data.user.name) {
            localStorage.setItem("agni_user_name", data.user.fullName || data.user.name);
          }
          localStorage.setItem("agni_user", JSON.stringify(data.user));
          if (data.user.email) {
            localStorage.setItem("agni_user_email", data.user.email);
          }
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // Effective Owner email dynamically loaded from database
  const effectiveEmail = currentUser?.email || authUser?.email || userEmail || localStorage.getItem("agni_user_email") || "";

  // Owner Name derived from live user profile or userEmail
  const ownerName = useMemo(() => {
    if (currentUser?.fullName?.trim()) return currentUser.fullName.trim();
    if (currentUser?.name?.trim()) return currentUser.name.trim();
    if (authUser?.fullName?.trim()) return authUser.fullName.trim();
    if (authName) return authName;
    const email = effectiveEmail;
    if (!email) return "Owner";
    const raw = email.split("@")[0];
    const parts = raw.split(/[\.\-_\s]+/).filter(Boolean);
    return parts
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");
  }, [effectiveEmail, authUser, authName, currentUser]);

  const effectiveName = currentUser?.fullName?.trim() || currentUser?.name?.trim() || authUser?.fullName?.trim() || ownerName;
  const ownerInitials = effectiveName
    ? effectiveName
        .split(" ")
        .filter(Boolean)
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "RS";

  // Clients state
  const [clients, setClients] = useState([]);

  // Fetch clients from backend PostgreSQL DB on mount
  useEffect(() => {
    async function fetchDBOwnerClients() {
      try {
        const response = await apiFetch("/clients");

        if (response.ok) {
          const resData = await response.json();
          if (resData.success && Array.isArray(resData.data)) {
            setClients(() => {
              const dedupeMap = new Map();

              resData.data.forEach((dbC) => {
                const c = sanitizeClientRecord(dbC);
                const dbComp = typeof c.companyName === "string" ? c.companyName : (c.company || c.name || c.email || "");
                const dbScheme = typeof c.serviceName === "string" ? c.serviceName : (c.scheme || "");
                const canonicalScheme = getCanonicalSchemeName(dbScheme || c.scheme);
                const itemKey = c.id ? String(c.id) : `${String(dbComp).toLowerCase().trim()}::${String(canonicalScheme).toLowerCase().trim()}`;
                const dbSpRaw = typeof c.salesPerson === "string" ? c.salesPerson : (c.salesPerson?.fullName || c.salesPerson?.name || c.assignedSalesPerson || c.owner || "Mia Rose");
                const explicitTotal = parseFloat(String(c.invoices?.[0]?.rawTotal || c.totalPayment || c.amount || 0).replace(/[^0-9.]/g, "")) || 0;
                const clientRec = parseFloat(String(c.paymentReceived || 0).replace(/[^0-9.]/g, "")) || 0;
                const invRec = (c.invoices || []).reduce((sum, inv) => sum + (parseFloat(String(inv.paymentReceived || 0).replace(/[^0-9.]/g, "")) || 0), 0);
                const directRec = (c.payments || []).reduce((sum, p) => sum + (parseFloat(String(p.amount || 0).replace(/[^0-9.]/g, "")) || 0), 0);
                const rawRec = Math.max(clientRec, invRec, directRec);

                const isSec = c.isPrimary === false || c.processType === "secondary" || c.serviceType === "More Services" || (typeof c.appId === "string" && (c.appId.endsWith("-S") || c.appId.endsWith("-E")));
                const rawAmt = (!isSec && explicitTotal === 0) ? 118000 : (explicitTotal > 0 ? explicitTotal : (rawRec > 0 ? Math.round(rawRec / 1.18) : 0));
                const isPaid = c.paymentStatus === "Paid" || c.paymentStatus === "PAID" || (rawAmt > 0 && rawRec >= rawAmt) || (c.invoices && c.invoices.some(inv => inv.status === "PAID" || inv.status === "Paid"));
                const finalRecAmt = isPaid ? Math.max(rawAmt, rawRec) : rawRec;
                const finalPending = Math.max(0, rawAmt - finalRecAmt);
                const finalStatus = isPaid || (finalPending <= 0 && finalRecAmt > 0) ? "Paid" : (finalRecAmt > 0 ? "Partial" : "Pending");
                const clientDate = c.createdAt ? String(c.createdAt).split("T")[0] : (c.startDate || "2026-09-08");

                dedupeMap.set(itemKey, {
                  ...c,
                  id: c.id,
                  name: c.name || c.companyName || "Client Entity",
                  company: dbComp || "Enterprise Account",
                  email: c.email || "client@company.com",
                  phone: c.phone || "+91 98765 43210",
                  serviceType: c.serviceType || "Consultancy Services",
                  serviceName: canonicalScheme || "PMEGP",
                  scheme: canonicalScheme || "PMEGP",
                  salesPerson: dbSpRaw,
                  branch: c.branch?.name || c.branch || "West Zone (Mumbai)",
                  totalPayment: rawAmt,
                  paymentReceived: finalRecAmt,
                  paymentPending: finalPending,
                  paymentStatus: finalStatus,
                  applicationStatus: c.applicationStatus || c.stage || "CRM Creation",
                  progressPercent: c.progressPercent || 20,
                  completedSteps: c.completedSteps || ["CRM Creation"],
                  startDate: clientDate,
                });
              });

              const mappedDbClients = Array.from(dedupeMap.values());
              return mergeSecondaryClients(mappedDbClients);
            });
          }
        }
      } catch (err) {
        console.warn("Could not fetch DB clients for Owner Dashboard:", err);
      }
    }

    fetchDBOwnerClients();

    // Re-fetch when other dashboards update client milestones
    window.addEventListener("agni_clients_updated", fetchDBOwnerClients);
    return () => {
      window.removeEventListener("agni_clients_updated", fetchDBOwnerClients);
    };
  }, []);

  const [employeesList, setEmployeesList] = useState(() => sortByRoleRanking(initialOwnerEmployees));

  // Fetch live staff users from backend PostgreSQL DB on mount
  useEffect(() => {
    async function fetchDBOwnerEmployees() {
      try {
        const response = await apiFetch("/auth/users");

        if (response.ok) {
          const resData = await response.json();
          if (resData.success && Array.isArray(resData.users) && resData.users.length > 0) {
            setEmployeesList((prev) => {
              const dedupeMap = new Map();
              resData.users.forEach((u) => {
                if (!u) return;
                const emailKey = (u.email || "").toLowerCase().trim();
                dedupeMap.set(emailKey, {
                  ...u,
                  id: u.id,
                  name: u.fullName || u.name,
                  role: u.role || u.rawRole,
                  rawRole: u.rawRole || u.role,
                  branch: u.branch ? (typeof u.branch === "string" ? u.branch : u.branch.name) : "West Zone (Mumbai)",
                });
              });

              initialOwnerEmployees.forEach((item) => {
                const emailKey = (item.email || "").toLowerCase().trim();
                if (!dedupeMap.has(emailKey)) {
                  dedupeMap.set(emailKey, item);
                }
              });

              return sortByRoleRanking(Array.from(dedupeMap.values()));
            });
          }
        }
      } catch (err) {
        console.warn("Could not fetch DB users for Owner Dashboard:", err);
      }
    }
    fetchDBOwnerEmployees();
  }, []);

  const [invoices, setInvoices] = useState(() => initialInvoices || []);

  // Fetch live invoices from backend PostgreSQL DB on mount
  useEffect(() => {
    async function fetchDBOwnerInvoices() {
      try {
        const response = await apiFetch("/invoices");
        if (response.ok) {
          const resData = await response.json();
          const rawInvoices = Array.isArray(resData) ? resData : (Array.isArray(resData?.data) ? resData.data : []);
          if (rawInvoices.length > 0) {
            setInvoices(rawInvoices.map((inv) => {
              const clientObj = typeof inv.client === "object" ? inv.client : {};
              const clientCompany = clientObj?.companyName || clientObj?.name || inv.company || "Client Company";
              const clientContact = clientObj?.contactPerson || clientObj?.representativeName || clientObj?.name || inv.clientName || clientCompany;
              const branchName = inv.branch?.name || (typeof inv.branch === "string" ? inv.branch : "") || "West Zone (Mumbai)";
              const branchRegion = inv.branch?.region || inv.region || (
                branchName.toLowerCase().includes("north") ? "North Zone" :
                branchName.toLowerCase().includes("south") ? "South Zone" :
                branchName.toLowerCase().includes("east") ? "East Zone" :
                "West Zone"
              );
              const service = inv.description || inv.serviceName || inv.client?.serviceName || "Consultancy Service";
              const rawTotalNum = Number(inv.rawTotal || inv.amount || 0);
              const recNum = Number(inv.paymentReceived || 0);
              const statusStr = inv.status === "PAID" ? "Paid" : (inv.status === "PARTIAL" ? "Partial" : "Pending");
              const rawAmtNum = Number(inv.rawAmount || inv.amount || 0);
              const gstAmtNum = Number(inv.gstAmount || 0);

              return {
                ...inv,
                id: inv.invoiceNo || inv.id,
                invoiceNo: inv.invoiceNo || inv.id,
                company: clientCompany,
                clientName: clientContact,
                serviceName: service,
                scheme: service,
                status: statusStr,
                rawTotal: rawTotalNum,
                totalAmount: `₹${rawTotalNum.toLocaleString("en-IN")}`,
                amount: `₹${rawAmtNum.toLocaleString("en-IN")}`,
                tax: `₹${gstAmtNum.toLocaleString("en-IN")}`,
                paymentReceived: recNum,
                paymentPending: Math.max(0, rawTotalNum - recNum),
                branch: branchName,
                region: branchRegion,
                accountManager: inv.accountManager?.fullName || inv.accountManager || "Account Manager",
                issueDate: inv.issueDate ? new Date(inv.issueDate).toISOString().split("T")[0] : "—",
                dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().split("T")[0] : "—",
              };
            }));
          }
        }
      } catch (err) {
        console.warn("Could not fetch DB invoices for Owner Dashboard:", err);
      }
    }
    fetchDBOwnerInvoices();
    window.addEventListener("agni_invoices_updated", fetchDBOwnerInvoices);
    window.addEventListener("agni_payments_updated", fetchDBOwnerInvoices);
    window.addEventListener("agni_clients_updated", fetchDBOwnerInvoices);
    return () => {
      window.removeEventListener("agni_invoices_updated", fetchDBOwnerInvoices);
      window.removeEventListener("agni_payments_updated", fetchDBOwnerInvoices);
      window.removeEventListener("agni_clients_updated", fetchDBOwnerInvoices);
    };
  }, []);

  const [requestsList, setRequestsList] = useState(initialRequests);

  const fetchDBOwnerRequests = async () => {
    try {
      const res = await apiFetch("/requests");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          // Secondary scheme requests and payment settlement demands are handled by Sales Representatives & Sales Managers, not Owner Governance.
          const ownerGovernanceRequests = data.data.filter((r) => {
            const rawType = String(r.requestType || "").toUpperCase();
            const reason = String(r.reason || "").toLowerCase();
            const changes = r.requestedChanges;
            const isPaymentSettlement =
              changes?.isPaymentSettlement === true ||
              changes?.category === "Payment Settlement" ||
              reason.includes("payment settlement") ||
              reason.includes("payment demand") ||
              reason.includes("payment request");
            return rawType !== "NEW_SERVICE" && rawType !== "NEW_SCHEME" && !reason.includes("self-enrollment") && !isPaymentSettlement;
          });

          const mapped = ownerGovernanceRequests.map((r) => {
            const clientName = r.client?.companyName || r.client?.name || r.requestedChanges?.companyName || r.requestedChanges?.name || "Client Account";
            const reqTypeDisplay = r.requestType === "DELETE_CLIENT"
              ? "Delete Client"
              : r.requestType === "EDIT_CLIENT"
              ? "Edit Client"
              : r.requestType === "TRANSFER_CLIENT"
              ? "Transfer Client"
              : r.requestType === "DELETE_EMPLOYEE"
              ? "Delete Employee"
              : r.requestType === "TRANSFER_EMPLOYEE"
              ? "Transfer Employee"
              : r.requestType === "EDIT_EMPLOYEE"
              ? "Edit Employee"
              : r.requestType;

            return {
              id: r.requestCode || r.id,
              rawId: r.id,
              clientId: r.clientId,
              clientName,
              company: clientName,
              managerName: r.requester?.fullName || "Branch Manager",
              managerRole: r.requester?.role,
              requestType: reqTypeDisplay,
              createdAt: r.createdAt ? String(r.createdAt).split("T")[0] : "",
              status: r.status === "PENDING" ? "Pending" : r.status === "APPROVED" ? "Approved" : "Rejected",
              currentStage: r.currentStage,
              approvalChain: r.approvalChain,
              reason: r.reason,
              requestedChanges: r.requestedChanges,
              auditHistory: r.auditHistory || [],
              raw: r,
            };
          });
          setRequestsList(mapped);
        }
      }
    } catch (err) {
      console.warn("Could not fetch DB requests for Owner Dashboard:", err);
    }
  };

  useEffect(() => {
    fetchDBOwnerRequests();
    window.addEventListener("agni_requests_updated", fetchDBOwnerRequests);
    return () => {
      window.removeEventListener("agni_requests_updated", fetchDBOwnerRequests);
    };
  }, []);

  // Filter & deep linking states
  const [selectedRole, setSelectedRole] = useState("All roles");
  const [revenueRange, setRevenueRange] = useState("monthly");

  // Modals state
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedEmployeeInfo, setSelectedEmployeeInfo] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4200);
  };

  // Client actions
  const handleOpenClientInfo = (client) => {
    setSelectedClient(client);
  };

  const handleUpdateClientTracker = async (clientId, nextCompletedSteps, newPercent) => {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return;
    const clientScheme = client.scheme || client.serviceName || client.serviceType || "PMEGP";
    const tracker = getTrackerState({ ...client, scheme: clientScheme }, nextCompletedSteps);
    const activeStageName = tracker.completedStages.length > 0
      ? tracker.completedStages[tracker.completedStages.length - 1]
      : tracker.currentStage || "CRM Creation";

    const updatedClient = {
      ...client,
      completedSteps: tracker.completedStages,
      applicationStatus: activeStageName,
      progressPercent: tracker.progressPercent,
      progress: tracker.progressPercent,
    };

    // Optimistic UI update
    setClients((prev) =>
      prev.map((c) => (c.id === clientId ? updatedClient : c))
    );
    setSelectedClient((prev) => (prev && prev.id === clientId ? updatedClient : prev));
    showToast(`✓ Updated ${client.name} tracker to "${activeStageName}" (${tracker.progressPercent}%)`);

    // Persist to PostgreSQL database
    try {
      await apiFetch(`/clients/${clientId}/status`, {
        method: "PATCH",
        body: {
          completedSteps: tracker.completedStages,
          applicationStatus: activeStageName,
          progressPercent: tracker.progressPercent,
        },
      });
    } catch (err) {
      console.warn("Could not persist milestone tracker update to DB:", err);
    }


    // Broadcast update event to all active dashboards (Sales, Manager, Branch Manager, Admin, Client Portal)
    window.dispatchEvent(new Event("agni_clients_updated"));
    window.dispatchEvent(new Event("storage"));
  };

  const handleOpenEditClient = (client) => {
    const clientScheme = client.scheme || client.serviceName || client.serviceType || "PMEGP";
    const tracker = getTrackerState({ ...client, scheme: clientScheme }, client.completedSteps);
    setSelectedClient(null);
    setEditModal({
      type: "client",
      item: client,
      values: {
        name: client.name || "",
        company: client.company || "",
        email: client.email || "",
        phone: client.phone || "",
        serviceType: client.serviceType || "",
        serviceName: client.serviceName || client.scheme || "PMEGP",
        totalPayment: client.totalPayment || 0,
        paymentReceived: client.paymentReceived || 0,
      },
      completedSteps: tracker.completedStages,
      scheme: clientScheme,
    });
  };

  const handleDeleteClient = (client) => {
    setConfirmModal({
      type: "client",
      item: client,
      message: `Delete ${client.name} permanently?`,
    });
  };

  // Employee actions
  const handleOpenEmployeeInfo = (employee) => {
    setSelectedEmployeeInfo(employee);
  };

  const handleOpenEditEmployee = (employee) => {
    setEditModal({
      type: "employee",
      item: employee,
      values: {
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        role: employee.role,
      },
    });
  };

  const handleDeleteEmployee = (employee) => {
    setConfirmModal({
      type: "employee",
      item: employee,
      message: `Delete ${employee.name} permanently?`,
    });
  };

  const handleEmployeeCreated = (newEmp) => {
    // Add newly created employee to the list immediately (optimistic update)
    const formattedEmp = {
      id: newEmp.id,
      name: newEmp.fullName,
      fullName: newEmp.fullName,
      email: newEmp.email,
      phone: newEmp.phone || "N/A",
      role: newEmp.role,
      rawRole: newEmp.role,
      branch: newEmp.branch?.name || "—",
      branchId: newEmp.branch?.id,
      region: newEmp.region || "",
      status: newEmp.status || "Active",
    };
    setEmployeesList((prev) => sortByRoleRanking([formattedEmp, ...prev]));
    showToast(`✓ Employee "${newEmp.fullName}" created successfully!`);
  };

  // Request actions
  const handleApproveRequest = async (reqId, remarks) => {
    const targetReq = requestsList.find((r) => r.id === reqId || r.rawId === reqId);
    const targetId = targetReq?.rawId || reqId;

    try {
      const res = await apiFetch(`/requests/${targetId}/decision`, {
        method: "PATCH",
        body: { decision: "APPROVED", managerRemarks: remarks },
      });

      if (res.ok) {
        showToast(`✓ Request ${reqId} has been Approved and authorized.`);
        window.dispatchEvent(new CustomEvent("agni_requests_updated"));
        window.dispatchEvent(new CustomEvent("agni_clients_updated"));
        window.dispatchEvent(new CustomEvent("agni_employees_updated"));
        fetchDBOwnerRequests();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(`⚠️ ${err.message || "Failed to approve request."}`);
      }
    } catch (e) {
      showToast("⚠️ Network error while approving request.");
    }
  };

  const handleRejectRequest = async (reqId, remarks) => {
    const targetReq = requestsList.find((r) => r.id === reqId || r.rawId === reqId);
    const targetId = targetReq?.rawId || reqId;

    try {
      const res = await apiFetch(`/requests/${targetId}/decision`, {
        method: "PATCH",
        body: { decision: "REJECTED", managerRemarks: remarks },
      });

      if (res.ok) {
        showToast(`✓ Request ${reqId} has been Rejected.`);
        window.dispatchEvent(new CustomEvent("agni_requests_updated"));
        fetchDBOwnerRequests();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(`⚠️ ${err.message || "Failed to reject request."}`);
      }
    } catch (e) {
      showToast("⚠️ Network error while rejecting request.");
    }
  };

  const handleCancelRequest = (reqId) => {
    const today = new Date().toISOString().split("T")[0];
    setRequestsList((prev) =>
      prev.map((r) => {
        if (r.id === reqId) {
          return {
            ...r,
            status: "Cancelled",
            decisionDate: today,
            managerRemarks: "Cancelled by requester.",
          };
        }
        return r;
      })
    );
    showToast(`Request ${reqId} cancelled.`);
  };

  // Global Edit Form Handlers
  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditModal((prev) => ({
      ...prev,
      values: {
        ...prev.values,
        [name]: value,
      },
    }));
  };

  const saveEditItem = async () => {
    if (!editModal) return;

    if (editModal.type === "client") {
      const clientId = editModal.item.id;
      const scheme = editModal.values.serviceName || editModal.values.scheme || editModal.values.serviceType || editModal.scheme || "PMEGP";
      const tracker = getTrackerState(
        {
          ...editModal.item,
          ...editModal.values,
          scheme,
        },
        editModal.completedSteps || []
      );
      const activeStageName = tracker.completedStages.length > 0
        ? tracker.completedStages[tracker.completedStages.length - 1]
        : tracker.currentStage || "CRM Creation";

      const totalPay = parseFloat(String(editModal.values.totalPayment || 0).replace(/[^0-9.]/g, "")) || 0;
      const recPay = parseFloat(String(editModal.values.paymentReceived || 0).replace(/[^0-9.]/g, "")) || 0;
      const isPaid = recPay >= totalPay && totalPay > 0;

      const updatedClient = {
        ...editModal.item,
        ...editModal.values,
        name: editModal.values.name || editModal.values.company || editModal.item.name,
        company: editModal.values.company || editModal.values.name || editModal.item.company,
        email: editModal.values.email || editModal.item.email,
        phone: editModal.values.phone || editModal.item.phone,
        serviceName: scheme,
        scheme: scheme,
        totalPayment: totalPay,
        paymentReceived: recPay,
        paymentPending: Math.max(0, totalPay - recPay),
        paymentStatus: isPaid ? "Paid" : (recPay > 0 ? "Partial" : "Pending"),
        completedSteps: tracker.completedStages,
        applicationStatus: activeStageName,
        progressPercent: tracker.progressPercent,
        progress: tracker.progressPercent,
      };

      setClients((prev) =>
        prev.map((item) => (item.id === clientId ? updatedClient : item))
      );
      setSelectedClient((prev) => (prev && prev.id === clientId ? updatedClient : prev));
      setEditModal(null);
      showToast(`✓ Saved updates & tracker for client "${updatedClient.name}"`);

      // Persist to PostgreSQL database
      try {
        await apiFetch(`/clients/${clientId}`, {
          method: "PATCH",
          body: {
            name: updatedClient.name,
            companyName: updatedClient.company,
            contactPerson: updatedClient.name,
            email: updatedClient.email,
            phone: updatedClient.phone,
            serviceName: scheme,
            totalPayment: totalPay,
            paymentReceived: recPay,
            completedSteps: tracker.completedStages,
            applicationStatus: activeStageName,
            progressPercent: tracker.progressPercent,
          },
        });
      } catch (err) {
        console.warn("Could not save client edit to DB:", err);
      }


      // Broadcast update event across all dashboards
      window.dispatchEvent(new Event("agni_clients_updated"));
      window.dispatchEvent(new Event("storage"));
      return;
    } else if (editModal.type === "employee") {
      setEmployeesList((prev) =>
        prev.map((item) =>
          item.id === editModal.item.id ? { ...item, ...editModal.values } : item
        )
      );
      showToast(`Saved updates for employee "${editModal.values.name || editModal.item.name}"`);
      setEditModal(null);
    }
  };

  // Confirm Dialog Handlers
  const confirmDelete = async () => {
    if (!confirmModal) return;

    if (confirmModal.type === "client") {
      const clientId = confirmModal.item.id;
      setClients((prev) => prev.filter((item) => item.id !== clientId));
      showToast(`Client "${confirmModal.item.name}" removed successfully.`);

      try {
        await apiFetch(`/clients/${clientId}`, {
          method: "DELETE",
        });
      } catch (err) {
        console.warn("Could not delete client from DB:", err);
      }


      window.dispatchEvent(new Event("agni_clients_updated"));
      window.dispatchEvent(new Event("storage"));
    } else if (confirmModal.type === "employee") {
      const empId = confirmModal.item.id;
      const empName = confirmModal.item.name || confirmModal.item.fullName;
      
      setEmployeesList((prev) => prev.filter((item) => item.id !== empId));
      showToast(`Soft-deleting "${empName}" and archiving records...`);

      try {
        const res = await apiFetch(`/employees/${empId}`, {
          method: "DELETE",
          body: { reason: "Soft-deleted by Owner from Workforce Directory" },
        });
        const data = await res.json();
        if (data.success) {
          showToast(`✓ ${data.message || `Employee "${empName}" soft-deleted successfully.`}`);
          window.dispatchEvent(new Event("agni_employees_updated"));
        } else {
          showToast(`⚠️ ${data.message || "Failed to soft-delete employee."}`);
        }
      } catch (err) {
        console.error("Error soft-deleting employee:", err);
        showToast("⚠️ Network error while deleting employee.");
      }
    }

    setConfirmModal(null);
  };

  return (
    <main className={`owner-dashboard ${dark ? "dashboard-dark" : ""}`}>
      <DashboardSidebar
        navItems={navItems}
        activeNav={activeNav}
        onNavChange={handleNavChange}
        dark={dark}
        onToggleDark={() => setDark(!dark)}
        onSignOut={onSignOut}
        IconComponent={Icon}
        navLabel="Owner dashboard navigation"
      />

      <section className="dashboard-content">
        <DashboardHeader
          eyebrow="Owner workspace"
          title={`Hello, ${effectiveName}`}
          copy="Track revenue, top performers, and client activity in one place."
          className="owner-dashboard-top"
        >
          <div className="top-actions owner-top-actions">
            <NotificationBell role="Owner" userEmail={effectiveEmail} userName={effectiveName} />

            <UserProfileMenu
              user={{
                name: effectiveName,
                email: effectiveEmail,
                phone: currentUser?.phone || authUser?.phone || "+91 98000 00001",
                branch: (typeof currentUser?.branch === "string" ? currentUser.branch : currentUser?.branch?.name) || (typeof authUser?.branch === "string" ? authUser.branch : authUser?.branch?.name) || "Enterprise HQ (Mumbai)",
                designation: "Enterprise Founder & Managing Director",
                empId: currentUser?.id ? `EMP-${currentUser.id.slice(0, 6).toUpperCase()}` : "EMP-OWN-0001",
                reportingManager: "Board of Directors",
              }}
              role="Owner"
              roleBadge="Owner"
              initials={ownerInitials}
              avatarColor="linear-gradient(135deg, #8c5ff8 0%, #6366f1 100%)"
              onSignOut={onSignOut}
              showToast={(msg) => showToast(msg)}
            />
          </div>
        </DashboardHeader>

        {/* Global Toast Alert */}
        {toastMessage && (
          <div
            style={{
              padding: "14px 20px",
              marginBottom: 18,
              borderRadius: 12,
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              color: "#ffffff",
              fontWeight: 600,
              fontSize: "13.5px",
              boxShadow: "0 4px 18px rgba(16, 185, 129, 0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              animation: "fadeIn 0.25s ease",
            }}
          >
            <span>{toastMessage}</span>
            <button
              type="button"
              onClick={() => setToastMessage("")}
              style={{
                background: "transparent",
                border: "none",
                color: "#fff",
                cursor: "pointer",
                fontSize: 16,
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Dynamic Nested Routes for Owner Dashboard */}
        <Routes>
          <Route
            index
            element={
              <OwnerOverviewPage
                clients={clients}
                employeesList={employeesList}
                invoices={invoices}
                onNavigate={handleNavChange}
                onSelectEmployeeRole={setSelectedRole}
                onSelectRevenueRange={setRevenueRange}
                dark={dark}
              />
            }
          />
          <Route
            path="dashboard"
            element={
              <OwnerOverviewPage
                clients={clients}
                employeesList={employeesList}
                invoices={invoices}
                onNavigate={handleNavChange}
                onSelectEmployeeRole={setSelectedRole}
                onSelectRevenueRange={setRevenueRange}
                dark={dark}
              />
            }
          />
          <Route
            path="overview"
            element={
              <OwnerOverviewPage
                clients={clients}
                employeesList={employeesList}
                invoices={invoices}
                onNavigate={handleNavChange}
                onSelectEmployeeRole={setSelectedRole}
                onSelectRevenueRange={setRevenueRange}
                dark={dark}
              />
            }
          />
          <Route
            path="clients"
            element={
              <OwnerClientsPage
                clients={clients}
                onOpenClientInfo={handleOpenClientInfo}
                onDeleteClient={handleDeleteClient}
              />
            }
          />
          <Route
            path="client"
            element={
              <OwnerClientsPage
                clients={clients}
                onOpenClientInfo={handleOpenClientInfo}
                onDeleteClient={handleDeleteClient}
              />
            }
          />
          <Route
            path="agreement"
            element={
              <OwnerAgreementPage
                clients={clients}
                showToast={showToast}
              />
            }
          />
          <Route
            path="agreements"
            element={
              <OwnerAgreementPage
                clients={clients}
                showToast={showToast}
              />
            }
          />
          <Route
            path="employees"
            element={
              <OwnerEmployeesPage
                employeesList={employeesList}
                clients={clients}
                selectedRole={selectedRole}
                setSelectedRole={setSelectedRole}
                onOpenEmployeeInfo={handleOpenEmployeeInfo}
                onOpenEditEmployee={handleOpenEditEmployee}
                onDeleteEmployee={handleDeleteEmployee}
                onOpenClientInfo={handleOpenClientInfo}
                onEmployeeCreated={handleEmployeeCreated}
                dark={dark}
              />
            }
          />

          <Route
            path="team"
            element={
              <OwnerEmployeesPage
                employeesList={employeesList}
                clients={clients}
                selectedRole={selectedRole}
                setSelectedRole={setSelectedRole}
                onOpenEmployeeInfo={handleOpenEmployeeInfo}
                onOpenEditEmployee={handleOpenEditEmployee}
                onDeleteEmployee={handleDeleteEmployee}
                onOpenClientInfo={handleOpenClientInfo}
                onEmployeeCreated={handleEmployeeCreated}
                dark={dark}
              />
            }
          />
          <Route
            path="employee"
            element={
              <OwnerEmployeesPage
                employeesList={employeesList}
                clients={clients}
                selectedRole={selectedRole}
                setSelectedRole={setSelectedRole}
                onOpenEmployeeInfo={handleOpenEmployeeInfo}
                onOpenEditEmployee={handleOpenEditEmployee}
                onDeleteEmployee={handleDeleteEmployee}
                onOpenClientInfo={handleOpenClientInfo}
                onEmployeeCreated={handleEmployeeCreated}
                dark={dark}
              />
            }
          />

          <Route
            path="revenue"
            element={
              <OwnerRevenuePage
                revenueRange={revenueRange}
                setRevenueRange={setRevenueRange}
                clients={clients}
                invoices={invoices}
              />
            }
          />
          <Route
            path="revenues"
            element={
              <OwnerRevenuePage
                revenueRange={revenueRange}
                setRevenueRange={setRevenueRange}
                clients={clients}
                invoices={invoices}
              />
            }
          />
          <Route
            path="invoice"
            element={
              <OwnerInvoicePage
                invoices={invoices}
                onOpenInvoiceDetails={setSelectedInvoice}
              />
            }
          />
          <Route
            path="invoices"
            element={
              <OwnerInvoicePage
                invoices={invoices}
                onOpenInvoiceDetails={setSelectedInvoice}
              />
            }
          />
          <Route
            path="billing"
            element={
              <OwnerInvoicePage
                invoices={invoices}
                onOpenInvoiceDetails={setSelectedInvoice}
              />
            }
          />
          <Route
            path="requests"
            element={
              <OwnerRequestsPage
                requestsList={requestsList}
                onOpenRequestDecision={setSelectedRequest}
                onCancelRequest={handleCancelRequest}
              />
            }
          />
          <Route
            path="request"
            element={
              <OwnerRequestsPage
                requestsList={requestsList}
                onOpenRequestDecision={setSelectedRequest}
                onCancelRequest={handleCancelRequest}
              />
            }
          />
          <Route
            path="*"
            element={<Navigate to="/owner/dashboard" replace />}
          />
        </Routes>

        {/* Global Modals */}
        {editModal && (
          <Modal
            title={editModal.type === "client" ? "Edit Client Portfolio & Milestone Tracker" : "Edit Employee Profile"}
            onClose={() => setEditModal(null)}
          >
            <div style={{ padding: "4px 0" }}>
              <div style={{ marginBottom: 18, fontSize: 13, color: "#64748b" }}>
                Make necessary changes to {editModal.type === "client" ? "the client's portfolio records, scheme, and milestone tracker" : "the employee's system credentials"} below and save updates.
              </div>
              <EditForm values={editModal.values} onChange={handleEditChange} />

              {/* Dynamic Milestone Activity Tracker for Client Editing */}
              {editModal.type === "client" && (() => {
                const editScheme = editModal.values?.serviceName || editModal.values?.scheme || editModal.values?.serviceType || editModal.scheme || "PMEGP";
                const editTracker = getTrackerState({
                  ...editModal.values,
                  scheme: editScheme,
                }, editModal.completedSteps || []);

                return (
                  <div style={{ marginTop: 22, paddingTop: 18, borderTop: "1px solid rgba(99, 102, 241, 0.16)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                      <div>
                        <p className="owner-header-eyebrow" style={{ margin: 0 }}>Milestone Completion Tracker</p>
                        <h4 style={{ margin: "2px 0 0", fontSize: 15, fontWeight: 700 }}>
                          {editTracker.totalStages}-Point Sequential Workflow ({editScheme})
                        </h4>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span className="owner-status-pill completed">
                          ● {editTracker.currentStage}
                        </span>
                        <span className="owner-rep-pill">
                          {editTracker.progressPercent}% ({editTracker.completedStages.length}/{editTracker.totalStages} points)
                        </span>
                      </div>
                    </div>

                    <ActivityTracker
                      scheme={editScheme}
                      completedSteps={editModal.completedSteps || []}
                      progress={editTracker.progressPercent}
                      interactive={true}
                      onStepToggle={(stepName, nextCompletedSteps) => {
                        setEditModal((prev) => ({
                          ...prev,
                          completedSteps: nextCompletedSteps,
                        }));
                      }}
                    />

                    {/* Quick Stage Progress Buttons */}
                    <div style={{ marginTop: 14 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "#64748b", display: "block", marginBottom: 8 }}>
                        Quick Milestone Advancement (Click step to advance/rollback):
                      </span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {editTracker.stages.map((stage, idx) => {
                          const isDone = (editModal.completedSteps || []).includes(stage.name);
                          return (
                            <button
                              key={stage.name}
                              type="button"
                              onClick={() => {
                                let next;
                                if (isDone) {
                                  next = (editModal.completedSteps || []).filter((name) => {
                                    const sIdx = editTracker.stages.findIndex((s) => s.name === name);
                                    return sIdx < idx;
                                  });
                                } else {
                                  next = editTracker.stages.slice(0, idx + 1).map((s) => s.name);
                                }
                                setEditModal((prev) => ({
                                  ...prev,
                                  completedSteps: next,
                                }));
                              }}
                              style={{
                                padding: "6px 12px",
                                borderRadius: 10,
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: "pointer",
                                border: isDone ? "1px solid #10b981" : "1px solid rgba(99, 102, 241, 0.22)",
                                background: isDone ? "rgba(16, 185, 129, 0.12)" : "rgba(99, 102, 241, 0.06)",
                                color: isDone ? "#10b981" : "#6366f1",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                transition: "all 0.2s ease",
                              }}
                            >
                              <span>{isDone ? "✓" : idx + 1}</span>
                              <span>{stage.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="owner-modal-actions" style={{ marginTop: 22 }}>
              <button
                className="owner-btn-secondary"
                type="button"
                onClick={() => setEditModal(null)}
              >
                Cancel
              </button>
              <button className="owner-btn-primary" type="button" onClick={saveEditItem}>
                Save Changes &amp; Tracker
              </button>
            </div>
          </Modal>
        )}

        {confirmModal && (
          <SimpleModal onClose={() => setConfirmModal(null)} showCloseButton={false}>
            <ConfirmDialog
              title={confirmModal.type === "employee" ? "Delete Team Member?" : "Delete Client Account?"}
              message={confirmModal.message}
              confirmLabel={confirmModal.type === "employee" ? "Delete Member" : "Delete Client"}
              onCancel={() => setConfirmModal(null)}
              onConfirm={confirmDelete}
            />
          </SimpleModal>
        )}

        <OwnerClientInfoModal
          selectedClient={selectedClient}
          onClose={() => setSelectedClient(null)}
          onEditClient={handleOpenEditClient}
          onUpdateTracker={handleUpdateClientTracker}
        />

        <OwnerEmployeeInfoModal
          selectedEmployeeInfo={selectedEmployeeInfo}
          onClose={() => setSelectedEmployeeInfo(null)}
          onEditEmployee={handleOpenEditEmployee}
        />

        <OwnerInvoiceDetailsModal
          selectedInvoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onDownload={(inv) =>
            downloadInvoiceFile(inv, (msg) => showToast(`✓ ${msg}`))
          }
        />

        <OwnerRequestDecisionModal
          selectedRequest={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onApprove={handleApproveRequest}
          onReject={handleRejectRequest}
        />
      </section>
    </main>
  );
}
