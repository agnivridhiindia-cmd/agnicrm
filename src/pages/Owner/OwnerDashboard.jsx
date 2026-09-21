import React, { useState, useMemo, useRef, useEffect } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import DashboardSidebar from "../../components/dashboard/DashboardSidebar";
import DashboardHeader from "../../components/dashboard/DashboardHeader";
import HeaderSearch from "../../components/dashboard/HeaderSearch";
import UserProfileMenu from "../../components/dashboard/UserProfileMenu";
import Icon from "../../components/Icon";
import Modal from "../../components/Modal";
import EditForm from "../../components/EditForm";
import ConfirmDialog from "../../components/ConfirmDialog";
import ActivityTracker from "../../components/ActivityTracker";
import { getTrackerState, getCanonicalSchemeName } from "../../utils/schemeTracker";
import { sanitizeClientRecord, normalizeSalesPersonName, sortByRoleRanking, mergeSecondaryClients } from "../../utils/branchHelper";
import { apiFetch } from "../../services/apiClient";
import { isMockClient } from "../../utils/revenueCalculator";
import { ACTIVITY_STAGES } from "../Admin/mockAdminData";
import "./owner.css";

// Modular Page Components
import OwnerOverviewPage from "./OwnerOverviewPage";
import OwnerClientsPage from "./OwnerClientsPage";
import OwnerEmployeesPage from "./OwnerEmployeesPage";
import OwnerRevenuePage from "./OwnerRevenuePage";
import OwnerInvoicePage from "./OwnerInvoicePage";
import OwnerRequestsPage from "./OwnerRequestsPage";
import OwnerReportsPage from "./OwnerReportsPage";
import OwnerAgreementPage from "./OwnerAgreementPage";
import OwnerClientInfoModal from "./OwnerClientInfoModal";
import OwnerEmployeeInfoModal from "./OwnerEmployeeInfoModal";
import OwnerInvoiceDetailsModal from "./OwnerInvoiceDetailsModal";
import OwnerRequestDecisionModal from "./OwnerRequestDecisionModal";

// Data & Configs
import {
  navItems,
  initialOwnerClients,
  initialOwnerEmployees,
  initialInvoices,
  initialRequests,
  notifications,
  downloadInvoiceFile,
} from "./mockOwnerData";

export default function OwnerDashboard({ onSignOut, userEmail }) {
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
    reports: "Reports",
    report: "Reports",
    analytics: "Reports",
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsAutoScrollPaused, setNotificationsAutoScrollPaused] = useState(false);
  const [query, setQuery] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  const notificationWrapRef = useRef(null);
  const notificationsListRef = useRef(null);
  const notificationsPauseTimer = useRef(null);

  // Close notifications on click outside
  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        notificationsOpen &&
        notificationWrapRef.current &&
        !notificationWrapRef.current.contains(event.target)
      ) {
        setNotificationsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [notificationsOpen]);

  // Notifications auto-scroll
  useEffect(() => {
    if (!notificationsOpen) return undefined;
    const list = notificationsListRef.current;
    if (!list) return undefined;

    const intervalId = window.setInterval(() => {
      if (notificationsAutoScrollPaused || !list) return;
      const maxScroll = list.scrollHeight - list.clientHeight;
      if (maxScroll <= 0) return;

      const nextScrollTop = Math.min(list.scrollTop + 86, maxScroll);
      if (list.scrollTop >= maxScroll - 2) {
        list.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        list.scrollTo({ top: nextScrollTop, behavior: 'smooth' });
      }
    }, 2600);

    return () => window.clearInterval(intervalId);
  }, [notificationsOpen, notificationsAutoScrollPaused]);

  useEffect(() => {
    return () => {
      if (notificationsPauseTimer.current) {
        window.clearTimeout(notificationsPauseTimer.current);
      }
    };
  }, []);

  function handleNotificationsListScroll() {
    if (notificationsPauseTimer.current) {
      window.clearTimeout(notificationsPauseTimer.current);
    }

    setNotificationsAutoScrollPaused(true);
    notificationsPauseTimer.current = window.setTimeout(() => {
      setNotificationsAutoScrollPaused(false);
      notificationsPauseTimer.current = null;
    }, 3000);
  }

  // Owner Name derived from userEmail
  const ownerName = useMemo(() => {
    if (!userEmail) return "Owner";
    const raw = userEmail.split("@")[0];
    const parts = raw.split(/[\.\-_\s]+/).filter(Boolean);
    return parts
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");
  }, [userEmail]);

  // Clients state
  const [clients, setClients] = useState(() => initialOwnerClients.map(sanitizeClientRecord));

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
                const recAmt = parseFloat(String(c.invoices?.[0]?.paymentReceived || c.paymentReceived || 0).replace(/[^0-9.]/g, "")) || 0;
                const isSec = c.isPrimary === false || c.processType === "secondary" || c.serviceType === "More Services" || (typeof c.appId === "string" && (c.appId.endsWith("-S") || c.appId.endsWith("-E")));
                const rawAmt = (!isSec && explicitTotal === 0) ? 118000 : (explicitTotal > 0 ? explicitTotal : (recAmt > 0 ? Math.round(recAmt / 1.18) : 0));
                const finalRecAmt = (!isSec && recAmt === 0 && (c.paymentStatus === "Paid" || c.approvalStatus === "ACTIVE")) ? rawAmt : recAmt;
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
                  paymentReceived: recAmt,
                  paymentStatus: c.invoices?.[0]?.status || (recAmt >= rawAmt ? "Paid" : (recAmt > 0 ? "Partial" : "Pending")),
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
  const [invoices] = useState(initialInvoices);
  const [requestsList, setRequestsList] = useState(initialRequests);

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

  const handleUpdateClientTracker = (clientId, nextCompletedSteps, newPercent) => {
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

    setClients((prev) =>
      prev.map((c) => (c.id === clientId ? updatedClient : c))
    );

    setSelectedClient((prev) => (prev && prev.id === clientId ? updatedClient : prev));
    showToast(`✓ Updated ${client.name} tracker to "${activeStageName}" (${tracker.progressPercent}% - ${tracker.completedStages.length}/${tracker.totalStages} points)`);
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

  // Request actions
  const handleApproveRequest = (reqId, remarks) => {
    const today = new Date().toISOString().split("T")[0];
    setRequestsList((prev) =>
      prev.map((r) => {
        if (r.id === reqId) {
          return {
            ...r,
            status: "Approved",
            decisionDate: today,
            managerRemarks: remarks || "Approved by Owner.",
          };
        }
        return r;
      })
    );
    showToast(`✓ Request ${reqId} has been Approved.`);
  };

  const handleRejectRequest = (reqId, remarks) => {
    const today = new Date().toISOString().split("T")[0];
    setRequestsList((prev) =>
      prev.map((r) => {
        if (r.id === reqId) {
          return {
            ...r,
            status: "Rejected",
            decisionDate: today,
            managerRemarks: remarks || "Rejected by Owner.",
          };
        }
        return r;
      })
    );
    showToast(`✓ Request ${reqId} has been Rejected.`);
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

  const saveEditItem = () => {
    if (!editModal) return;

    if (editModal.type === "client") {
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

      const updatedClient = {
        ...editModal.item,
        ...editModal.values,
        completedSteps: tracker.completedStages,
        applicationStatus: activeStageName,
        progressPercent: tracker.progressPercent,
        progress: tracker.progressPercent,
      };

      setClients((prev) =>
        prev.map((item) => (item.id === editModal.item.id ? updatedClient : item))
      );
      setSelectedClient((prev) => (prev && prev.id === editModal.item.id ? updatedClient : prev));
      showToast(`✓ Saved updates & tracker for client "${editModal.values.name || editModal.item.name}"`);
    } else if (editModal.type === "employee") {
      setEmployeesList((prev) =>
        prev.map((item) =>
          item.id === editModal.item.id ? { ...item, ...editModal.values } : item
        )
      );
      showToast(`Saved updates for employee "${editModal.values.name || editModal.item.name}"`);
    }
    setEditModal(null);
  };

  // Confirm Dialog Handlers
  const confirmDelete = () => {
    if (!confirmModal) return;

    if (confirmModal.type === "client") {
      setClients((prev) => prev.filter((item) => item.id !== confirmModal.item.id));
      showToast(`Client "${confirmModal.item.name}" removed successfully.`);
    } else if (confirmModal.type === "employee") {
      setEmployeesList((prev) => prev.filter((item) => item.id !== confirmModal.item.id));
      showToast(`Employee "${confirmModal.item.name}" removed successfully.`);
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
          title={`Hello, ${ownerName}`}
          copy="Track revenue, top performers, and client activity in one place."
          className="owner-dashboard-top"
        >
          <div className="top-actions owner-top-actions">
            <HeaderSearch
              query={query}
              setQuery={setQuery}
              isOpen={searchOpen}
              setIsOpen={setSearchOpen}
              placeholder="Search reports, clients or teams..."
            />

            <div className="notification-wrap" ref={notificationWrapRef}>
              <button
                className="notification"
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                aria-label="Notifications"
              >
                <Icon name="bell" size={16} />
                <i />
              </button>
              {notificationsOpen && (
                <section className="notifications-popover" aria-label="Notifications">
                  <header>
                    <h2>Notifications</h2>
                    <span>{notifications.length} new</span>
                  </header>
                  <div
                    ref={notificationsListRef}
                    className="notifications-scroll"
                    onScroll={handleNotificationsListScroll}
                  >
                    {notifications.map((notice) => (
                      <article key={notice.title}>
                        <span
                          className={`notice-dot ${notice.tone === "#aa83eb"
                              ? "violet"
                              : notice.tone === "#88cda4"
                                ? "green"
                                : "coral"
                            }`}
                        />
                        <div>
                          <strong>{notice.title}</strong>
                          <p>{notice.detail}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <UserProfileMenu
              user={{
                name: ownerName || "Yashvardhan Trivedi",
                email: "owner@agnicrm.com",
                phone: "+91 98000 00001",
                branch: "Enterprise HQ (Mumbai)",
                designation: "Enterprise Founder & Managing Director",
                empId: "EMP-OWN-0001",
                reportingManager: "Board of Directors",
              }}
              role="Owner"
              roleBadge="Owner"
              initials="JB"
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
            path="reports"
            element={
              <OwnerReportsPage
                employeesList={employeesList}
              />
            }
          />
          <Route
            path="report"
            element={
              <OwnerReportsPage
                employeesList={employeesList}
              />
            }
          />
          <Route
            path="analytics"
            element={
              <OwnerReportsPage
                employeesList={employeesList}
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
          <Modal title="Confirm delete" onClose={() => setConfirmModal(null)}>
            <ConfirmDialog
              message={confirmModal.message}
              onCancel={() => setConfirmModal(null)}
              onConfirm={confirmDelete}
            />
          </Modal>
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
