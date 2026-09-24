import React, { useState, useMemo, useRef, useEffect } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import DashboardSidebar from "../../components/dashboard/DashboardSidebar";
import DashboardHeader from "../../components/dashboard/DashboardHeader";
import HeaderSearch from "../../components/dashboard/HeaderSearch";
import UserProfileMenu from "../../components/dashboard/UserProfileMenu";
import Icon from "../../components/Icon";
import {
  initialBranches,
  initialBranchClients,
  initialBranchTeam,
  ACTIVITY_STAGES,
} from "./mockAdminData";
import {
  getTrackerState,
  getCanonicalSchemeName,
  canCompleteStage,
  getTrackerStages,
  normalizeCompletedStages,
  isPaymentDemandOrSettlement,
  saveSchemeCompletedStages,
  getSchemeCompletedStages,
  isClientPrimaryScheme,
} from "../../utils/schemeTracker";
import {
  sanitizeClientRecord,
  mergeSecondaryClients,
  sortByRoleRanking,
  getManagerBranchDetails
} from "../../utils/branchHelper";
import { apiFetch, apiClient } from "../../services/apiClient";

// Modular Page Components
import AdminOverviewPage from "./AdminOverviewPage";
import AdminClientsPage from "./AdminClientsPage";
import AdminPipelinePage from "./AdminPipelinePage";
import AdminHistoryPage from "./AdminHistoryPage";
import AdminTeamPage from "./AdminTeamPage";
import AdminRequestsPage from "./AdminRequestsPage";
import AgreementPage from "../Agreement/AgreementPage";

// Dedicated Modals
import AdminStatusModal from "./AdminStatusModal";
import AdminClientDossierModal from "./AdminClientDossierModal";
import AdminCreateRequestModal from "./AdminCreateRequestModal";
import "./AdminDashboard.css";

import { useApiClients } from "../../hooks/useApiClients";

// Navigation items
const adminNavItems = [
  { icon: "dashboard", label: "Dashboard" },
  { icon: "clients", label: "Clients" },
  { icon: "overview", label: "Pipeline" },
  { icon: "agreement", label: "Agreement" },
  { icon: "requests", label: "Requests" },
  { icon: "history", label: "History" },
  { icon: "team", label: "Team" },
];

export default function AdminDashboard({ onSignOut, userEmail }) {
  const navigate = useNavigate();
  const location = useLocation();

  const urlToNavMap = useMemo(() => ({
    dashboard: "Dashboard",
    overview: "Dashboard",
    clients: "Clients",
    pipeline: "Pipeline",
    agreement: "Agreement",
    agreements: "Agreement",
    requests: "Requests",
    history: "History",
    team: "Team",
  }), []);

  const pathParts = location.pathname.split("/").filter(Boolean);
  const currentSlug = pathParts[1] || "dashboard";
  const activeNav = urlToNavMap[currentSlug.toLowerCase()] || "Dashboard";

  const handleNavChange = (label) => {
    const slug = label.toLowerCase();
    navigate(`/admin/${slug}`);
  };

  const [dark, setDark] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  const notificationWrapRef = useRef(null);

  // Admin Name & Branch Details
  const adminName = useMemo(() => {
    if (!userEmail) return "Branch Admin";
    const raw = userEmail.split("@")[0];
    const cleaned = raw.replace(/\d+$/, "");
    const parts = cleaned.split(/[^a-zA-Z]+/).filter(Boolean);
    if (!parts.length) return "Branch Admin";
    return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(" ");
  }, [userEmail]);

  const adminBranchDetails = useMemo(() => {
    return getManagerBranchDetails(userEmail);
  }, [userEmail]);

  // Selected Branch (dynamically bound to logged-in Admin's branch)
  const [selectedBranch, setSelectedBranch] = useState(() => {
    const details = getManagerBranchDetails(userEmail);
    return details?.branchName || "North Zone (Delhi)";
  });

  useEffect(() => {
    if (adminBranchDetails && adminBranchDetails.branchName) {
      setSelectedBranch(adminBranchDetails.branchName);
      try {
        localStorage.setItem("agni_user_branch", adminBranchDetails.branchName);
      } catch (e) { }
    }
  }, [adminBranchDetails]);

  const [teamMembers, setTeamMembers] = useState(initialBranchTeam);

  const [departmentNotifs, setDepartmentNotifs] = useState([]);

  // Fetch Salespersons & Team members from Database
  useEffect(() => {
    async function fetchDatabaseTeam() {
      try {
        const response = await apiFetch("/auth/users");

        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.users) && data.users.length > 0) {
            setTeamMembers((prev) => {
              const dbUsers = data.users;
              const userMap = new Map();
              dbUsers.forEach((u) => {
                userMap.set(u.email.toLowerCase(), u);
              });
              prev.forEach((m) => {
                if (m.email && !userMap.has(m.email.toLowerCase())) {
                  userMap.set(m.email.toLowerCase(), m);
                }
              });
              return sortByRoleRanking(Array.from(userMap.values()));
            });
          }
        }
      } catch (err) {
        console.warn("Failed to fetch team from database, using local fallback:", err);
      }
    }

    fetchDatabaseTeam();
  }, []);


  const handleDismissNotif = (notifId) => {
    try {
      const saved = localStorage.getItem("agni_department_notifications");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const updated = parsed.map((n) => (n.id === notifId ? { ...n, read: true } : n));
          localStorage.setItem("agni_department_notifications", JSON.stringify(updated));
          setDepartmentNotifs(updated.filter((n) => n.department === "Admin" && !n.read));
        }
      }
    } catch (e) { }
  };

  // Live Fetch Clients from PostgreSQL Backend API
  const { clients: apiClients, refreshClients, setClients } = useApiClients();

  const clients = useMemo(() => {
    return apiClients.map((c) => {
      const tracker = getTrackerState({
        ...c,
        scheme: c.serviceName || c.scheme,
      });

      return sanitizeClientRecord({
        ...c,
        scheme: c.serviceName || c.scheme,
        branch: typeof c.branch === 'object' ? c.branch?.name : (c.branch || selectedBranch),
        assignedSalesPerson: c.salesPerson?.fullName || c.assignedSalesPerson || c.owner || "Mia Rose",
        progress: c.progressPercent || tracker.progressPercent,
        completedSteps: tracker.completedStages,
      });
    });
  }, [apiClients, selectedBranch]);

  // Filter States for Clients Page
  const [statusTab, setStatusTab] = useState("All");
  const [clientSearch, setClientSearch] = useState("");

  // Modals State
  const [selectedClientForDossier, setSelectedClientForDossier] = useState(null);
  const [updatingClient, setUpdatingClient] = useState(null);
  const [rollbackRequestData, setRollbackRequestData] = useState(null);
  const [statusFormData, setStatusFormData] = useState({
    status: "Doc Audit",
    completedSteps: ["Submission", "Doc Audit"],
    progress: 40,
    notes: "",
    documentUpdates: {},
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4500);
  };

  // Branch Clients (strictly filtered by Admin's assigned branch, excluding Payment Demands)
  const branchClients = useMemo(() => {
    const targetBranch = selectedBranch || adminBranchDetails.branchName || "North Zone (Delhi)";
    const targetRegion = targetBranch.split(" ")[0].toLowerCase(); // "north", "west", "south", "east"

    return clients.map(sanitizeClientRecord).filter((c) => {
      if (!c) return false;
      if (isPaymentDemandOrSettlement(c)) return false;
      const sName = c.scheme || c.serviceName || c.particularScheme;
      if (isPaymentDemandOrSettlement(sName)) return false;

      const rawBranch = c.branch || c.branchName || c.region || "";
      const cBranch = typeof rawBranch === "object" ? rawBranch?.name || "" : String(rawBranch);

      if (targetRegion === "all" || targetBranch.toLowerCase().includes("all")) return true;

      if (cBranch.trim()) {
        const cBranchLower = cBranch.toLowerCase();
        return cBranchLower.includes(targetRegion) || cBranchLower === targetBranch.toLowerCase();
      }

      // If client branch is unpopulated, derive branch from sales representative or creator
      const sales = (c.assignedSalesPerson || c.salesPerson || c.owner || c.salesperson || c.creatorName || "").toLowerCase();
      const email = (c.salesPersonEmail || c.creatorEmail || c.email || "").toLowerCase();

      const belongsToWest = sales.includes("mia") || sales.includes("lucas") || sales.includes("eli") || sales.includes("ariana") || email.includes("mumbai");
      const belongsToNorth = sales.includes("rohan") || sales.includes("kavya") || sales.includes("ananya") || sales.includes("rajesh") || email.includes("delhi");
      const belongsToSouth = sales.includes("arjun") || sales.includes("deepa") || sales.includes("karthik") || sales.includes("suresh") || email.includes("bengaluru");
      const belongsToEast = sales.includes("sourav") || sales.includes("riya") || sales.includes("debolina") || sales.includes("subhash") || email.includes("kolkata");

      if (targetRegion === "north") return belongsToNorth;
      if (targetRegion === "west") return belongsToWest;
      if (targetRegion === "south") return belongsToSouth;
      if (targetRegion === "east") return belongsToEast;

      return false;
    });
  }, [clients, selectedBranch, adminBranchDetails]);

  // Filtered clients list for Clients Page based on statusTab and search
  const filteredClients = useMemo(() => {
    return branchClients.filter((c) => {
      const tracker = getTrackerState(c);
      const matchesStatus = statusTab === "All" || tracker.currentStage === statusTab;
      const q = clientSearch.trim().toLowerCase();
      const schemeStr = (c.particularScheme || c.schemeName || c.scheme || c.serviceName || "").toLowerCase();
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.appId.toLowerCase().includes(q) ||
        schemeStr.includes(q) ||
        c.assignedSalesPerson.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [branchClients, statusTab, clientSearch]);

  // Status Metrics for current branch
  const metrics = useMemo(() => {
    const total = branchClients.length;
    const completed = branchClients.filter((c) => getTrackerState(c).progressPercent === 100).length;
    const inProgress = branchClients.filter((c) => {
      const p = getTrackerState(c).progressPercent;
      return p > 0 && p < 100;
    }).length;
    const managerReview = branchClients.filter((c) => getTrackerState(c).currentStage === "Reports").length;
    const docAudit = branchClients.filter((c) => getTrackerState(c).currentStage === "Agreement").length;
    return { total, completed, inProgress, managerReview, docAudit };
  }, [branchClients]);

  // Handle direct quick interactive point toggle on client card
  const handleQuickStepToggle = async (client, stepName, nextCompletedSteps, newPercent) => {
    const schemeToUse = client.scheme || "PMEGP";
    const tracker = getTrackerState({ ...client, scheme: schemeToUse, completedSteps: nextCompletedSteps });
    const activeStageName = tracker.completedStages.length > 0
      ? tracker.completedStages[tracker.completedStages.length - 1]
      : "CRM Creation";
    const nowStr = new Date().toISOString().replace("T", " ").substring(0, 16);
    const historyEntry = {
      date: nowStr.split(" ")[0],
      status: activeStageName,
      updatedBy: `${adminName} (Branch Admin)`,
      notes: `Updated milestone to "${activeStageName}" (${tracker.progressPercent}% completion - ${tracker.completedStages.length}/${tracker.totalStages} points checked).`,
    };

    saveSchemeCompletedStages(client, schemeToUse, tracker.completedStages);

    if (setClients) {
      setClients((prev) =>
        prev.map((c) => {
          if (c.id === client.id || (c.email && client.email && c.email.toLowerCase() === client.email.toLowerCase())) {
            return {
              ...c,
              completedSteps: tracker.completedStages,
              applicationStatus: activeStageName,
              progress: tracker.progressPercent,
              progressPercent: tracker.progressPercent,
              lastUpdated: nowStr,
              history: [historyEntry, ...(c.history || [])],
            };
          }
          return c;
        })
      );
    }

    // Sync to backend DB if token available
    if (client.id && typeof client.id === "string" && client.id.length > 10) {
      try {
        await apiClient.patch(`/clients/${client.id}/status`, {
          completedSteps: tracker.completedStages,
          applicationStatus: activeStageName,
          progressPercent: tracker.progressPercent,
        });
        if (refreshClients) refreshClients();
        window.dispatchEvent(new Event("agni_clients_updated"));
      } catch (err) {
        console.warn("Failed to sync client status to backend:", err);
      }
    }

    showToast(`✓ Updated ${client.name} to "${activeStageName}" (${tracker.progressPercent}% — ${tracker.completedStages.length}/${tracker.totalStages} points completed)`);
  };

  // Advance client CRM activity tracker upon agreement creation/dispatch
  const handleClientAgreementAdvance = async (client, milestoneName, isComplete) => {
    if (!client) return;
    const stages = getTrackerStages(client.scheme);
    const currentCompleted = client.completedSteps || ["CRM Creation"];
    let nextCompleted = [...currentCompleted];

    if (isComplete) {
      if (!nextCompleted.includes("Agreement") && canCompleteStage("Agreement", stages, nextCompleted)) {
        nextCompleted.push("Agreement");
      }
    }

    const normalized = normalizeCompletedStages(nextCompleted, stages);
    const tracker = getTrackerState({ ...client, scheme: client.scheme, completedSteps: normalized });
    const nowStr = new Date().toISOString().replace("T", " ").substring(0, 16);

    saveSchemeCompletedStages(client, client.scheme, tracker.completedStages);

    const historyEntry = {
      date: nowStr.split(" ")[0],
      status: isComplete ? "Agreement" : "CRM Creation",
      updatedBy: `${adminName} (Branch Admin)`,
      notes: isComplete
        ? `Legal agreement executed and dispatched. Milestone "Agreement" completed (${tracker.progressPercent}%).`
        : `Agreement draft initialized and prepared for ${client.name}.`,
    };

    if (setClients) {
      setClients((prev) =>
        prev.map((c) => {
          if (c.id === client.id || (c.email && client.email && c.email.toLowerCase() === client.email.toLowerCase())) {
            return {
              ...c,
              completedSteps: tracker.completedStages,
              applicationStatus: isComplete && tracker.completedStages.includes("Agreement") ? "Agreement" : c.applicationStatus,
              progress: tracker.progressPercent,
              progressPercent: tracker.progressPercent,
              lastUpdated: nowStr,
              history: [historyEntry, ...(c.history || [])],
            };
          }
          return c;
        })
      );
    }

    if (client.id && typeof client.id === "string" && client.id.length > 10) {
      try {
        await apiClient.patch(`/clients/${client.id}/status`, {
          completedSteps: tracker.completedStages,
          applicationStatus: isComplete && tracker.completedStages.includes("Agreement") ? "Agreement" : client.applicationStatus,
          progressPercent: tracker.progressPercent,
        });
        if (refreshClients) refreshClients();
        window.dispatchEvent(new Event("agni_clients_updated"));
      } catch (err) {
        console.warn("Failed to sync agreement status to backend:", err);
      }
    }

    window.dispatchEvent(new Event("storage"));
  };

  // Open Status Update Modal
  const handleOpenStatusUpdate = (client, targetScheme) => {
    setUpdatingClient(client);
    const schemeToUse = targetScheme || client.scheme || "PMEGP";
    const isPrimary = client.isPrimary === false || client.processType === "secondary" ? false : isClientPrimaryScheme(client, schemeToUse);
    const defaultSteps = isPrimary
      ? (client.completedSteps || ["CRM Creation"])
      : ["CRM Creation", "Agreement", "Reports"];
    const savedSteps = getSchemeCompletedStages(client, schemeToUse, defaultSteps);
    const tracker = getTrackerState({ ...client, scheme: schemeToUse }, savedSteps);

    setStatusFormData({
      schemeName: schemeToUse,
      status: tracker.currentStage,
      completedSteps: tracker.completedStages,
      progress: tracker.progressPercent,
      notes: client.adminNotes || "",
      documentUpdates: (client.documents || []).reduce((acc, doc) => {
        acc[doc.name] = doc.status;
        return acc;
      }, {}),
    });
  };

  // Save Application Status Update
  const handleSaveStatusUpdate = async (e, overrideData) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!updatingClient) return;

    const targetScheme = overrideData?.schemeName || statusFormData.schemeName || updatingClient.scheme || "PMEGP";
    const newCompletedSteps = overrideData?.completedSteps || statusFormData.completedSteps || ["CRM Creation"];
    const newStatus = overrideData?.status || statusFormData.status || "CRM Creation";
    const newProgress = overrideData?.progress !== undefined ? Number(overrideData.progress) : Number(statusFormData.progress || 20);
    const nowStr = new Date().toISOString().replace("T", " ").substring(0, 16);

    saveSchemeCompletedStages(updatingClient, targetScheme, newCompletedSteps);

    const historyEntry = {
      date: nowStr.split(" ")[0],
      status: newStatus,
      updatedBy: `${adminName} (Branch Admin)`,
      notes: (overrideData?.notes || statusFormData.notes) || `Milestones updated for ${targetScheme}: ${newCompletedSteps.length} points checked (${newProgress}% completed).`,
    };

    const docUpdates = overrideData?.documentUpdates || statusFormData.documentUpdates || {};
    const updatedDocuments = (updatingClient.documents || []).map((doc) => {
      if (docUpdates[doc.name]) {
        return { ...doc, status: docUpdates[doc.name] };
      }
      return doc;
    });

    if (setClients) {
      setClients((prev) =>
        prev.map((c) => {
          if (c.id === updatingClient.id || (c.email && updatingClient.email && c.email.toLowerCase() === updatingClient.email.toLowerCase())) {
            return {
              ...c,
              completedSteps: newCompletedSteps,
              progress: newProgress,
              progressPercent: newProgress,
              applicationStatus: newStatus,
              lastUpdated: nowStr,
              adminNotes: (overrideData?.notes || statusFormData.notes) || c.adminNotes,
              documents: updatedDocuments,
              history: [historyEntry, ...(c.history || [])],
            };
          }
          return c;
        })
      );
    }

    // Also update selectedClientForDossier if open
    if (selectedClientForDossier && selectedClientForDossier.id === updatingClient.id) {
      setSelectedClientForDossier((prev) => ({
        ...prev,
        applicationStatus: newStatus,
        completedSteps: newCompletedSteps,
        progress: newProgress,
        progressPercent: newProgress,
        lastUpdated: nowStr,
        adminNotes: (overrideData?.notes || statusFormData.notes) || prev.adminNotes,
        documents: updatedDocuments,
        history: [historyEntry, ...(prev.history || [])],
      }));
    }

    // Sync to backend DB if token available
    if (updatingClient.id && typeof updatingClient.id === "string" && updatingClient.id.length > 10) {
      try {
        await apiClient.patch(`/clients/${updatingClient.id}/status`, {
          completedSteps: newCompletedSteps,
          applicationStatus: newStatus,
          progressPercent: newProgress,
          adminNotes: (overrideData?.notes || statusFormData.notes) || undefined,
        });
        if (refreshClients) refreshClients();
        window.dispatchEvent(new Event("agni_clients_updated"));
      } catch (err) {
        console.error("Failed to sync client status to backend:", err);
      }
    }

    showToast(`✓ Application ${updatingClient.appId} (${updatingClient.name}) saved for ${targetScheme}: "${newStatus}" (${newProgress}%).`);
    setUpdatingClient(null);
  };

  return (
    <main className={`owner-dashboard admin-dashboard ${dark ? "dashboard-dark" : ""}`}>
      <DashboardSidebar
        navItems={adminNavItems}
        activeNav={activeNav}
        onNavChange={handleNavChange}
        dark={dark}
        onToggleDark={() => setDark((v) => !v)}
        onSignOut={onSignOut}
        IconComponent={Icon}
        brandMark="A"
        navLabel="Branch admin navigation"
      />

      <section className="dashboard-content">
        <DashboardHeader
          eyebrow="Branch Admin Portal"
          title={`Hello, ${adminName}`}
          className="admin-dashboard-top"
        >
          <div className="top-actions">
            <HeaderSearch
              query={query}
              setQuery={setQuery}
              isOpen={searchOpen}
              setIsOpen={setSearchOpen}
              placeholder="Search client applications..."
            />

            <div className="notification-wrap" ref={notificationWrapRef}>
              <button
                className="notification"
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                aria-label="Branch Notifications"
              >
                <Icon name="bell" size={16} />
                <i />
              </button>
              {notificationsOpen && (
                <section className="notifications-popover" aria-label="Notifications">
                  <header>
                    <h2>Branch Alerts</h2>
                    <span>{metrics.inProgress} In Progress</span>
                  </header>
                  <div className="notifications-scroll">
                    {branchClients.slice(0, 4).map((c) => (
                      <article key={c.id}>
                        <span className="notice-dot green" />
                        <div>
                          <strong>{c.name}</strong>
                          <p>Status: {c.applicationStatus} ({c.progress}% - {(c.completedSteps || []).length}/5 points)</p>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <UserProfileMenu
              user={{
                name: adminName || "Rajesh Kumar",
                email: "rajesh.admin@agnicrm.com",
                phone: "+91 98203 11223",
                branch: selectedBranch || "West Zone (Mumbai)",
                designation: "Branch Lead Administrator",
                empId: "EMP-ADM-3001",
                reportingManager: "Vikramaditya Sharma (Branch Manager)",
              }}
              role="Branch Admin"
              roleBadge="Branch Admin"
              initials="AD"
              avatarColor="linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
              onSignOut={onSignOut}
              showToast={(msg) => showToast(msg)}
            />
          </div>
        </DashboardHeader>

        {departmentNotifs.length > 0 && (
          <div style={{
            background: "linear-gradient(135deg, rgba(78, 124, 255, 0.15) 0%, rgba(16, 185, 129, 0.15) 100%)",
            border: "1px solid rgba(78, 124, 255, 0.4)",
            borderRadius: "12px",
            padding: "14px 18px",
            margin: "16px 24px 8px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            color: "#ffffff",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "13.5px" }}>
              <span style={{ fontSize: "18px" }}>⚡</span>
              <span>
                <strong>Sales Assignment Alert:</strong> Salesperson <strong>{departmentNotifs[0].salesPerson}</strong> assigned client <strong>{departmentNotifs[0].companyName}</strong> ({departmentNotifs[0].serviceName}) to <strong>{departmentNotifs[0].targetStaffName}</strong> ({departmentNotifs[0].targetStaffRole})!
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleDismissNotif(departmentNotifs[0].id)}
              style={{
                background: "rgba(255, 255, 255, 0.15)",
                border: "1px solid rgba(255, 255, 255, 0.25)",
                color: "#ffffff",
                padding: "6px 14px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Acknowledge ✓
            </button>
          </div>
        )}

        {/* Global Toast Alert */}
        {toastMessage && (
          <div
            style={{
              padding: "14px 20px",
              marginBottom: 18,
              borderRadius: 14,
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              color: "#ffffff",
              fontWeight: 600,
              fontSize: "13.5px",
              boxShadow: "0 6px 20px rgba(16, 185, 129, 0.35)",
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
              style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer", fontSize: 16 }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Dynamic Nested Routes for Admin Section */}
        <Routes>
          <Route
            index
            element={
              <AdminOverviewPage
                selectedBranch={selectedBranch}
                branchClients={branchClients}
                metrics={metrics}
                dark={dark}
                onOpenClients={() => handleNavChange("Clients")}
                onOpenPipeline={() => handleNavChange("Pipeline")}
                onOpenAgreement={() => handleNavChange("Agreement")}
                onOpenHistory={() => handleNavChange("History")}
                onOpenStatusUpdate={handleOpenStatusUpdate}
                onQuickStepToggle={handleQuickStepToggle}
                onOpenDossier={setSelectedClientForDossier}
              />
            }
          />
          <Route
            path="dashboard"
            element={
              <AdminOverviewPage
                selectedBranch={selectedBranch}
                branchClients={branchClients}
                metrics={metrics}
                dark={dark}
                onOpenClients={() => handleNavChange("Clients")}
                onOpenPipeline={() => handleNavChange("Pipeline")}
                onOpenAgreement={() => handleNavChange("Agreement")}
                onOpenHistory={() => handleNavChange("History")}
                onOpenStatusUpdate={handleOpenStatusUpdate}
                onQuickStepToggle={handleQuickStepToggle}
                onRequestRollback={(client, targetStage) => setRollbackRequestData({ client, targetStage })}
                onOpenDossier={setSelectedClientForDossier}
              />
            }
          />
          <Route
            path="overview"
            element={
              <AdminOverviewPage
                selectedBranch={selectedBranch}
                branchClients={branchClients}
                metrics={metrics}
                dark={dark}
                onOpenClients={() => handleNavChange("Clients")}
                onOpenPipeline={() => handleNavChange("Pipeline")}
                onOpenAgreement={() => handleNavChange("Agreement")}
                onOpenHistory={() => handleNavChange("History")}
                onOpenStatusUpdate={handleOpenStatusUpdate}
                onQuickStepToggle={handleQuickStepToggle}
                onRequestRollback={(client, targetStage) => setRollbackRequestData({ client, targetStage })}
                onOpenDossier={setSelectedClientForDossier}
              />
            }
          />
          <Route
            path="clients"
            element={
              <AdminClientsPage
                selectedBranch={selectedBranch}
                statusTab={statusTab}
                setStatusTab={setStatusTab}
                clientSearch={clientSearch}
                setClientSearch={setClientSearch}
                filteredClients={filteredClients}
                dark={dark}
                onOpenStatusUpdate={handleOpenStatusUpdate}
                onOpenDossier={setSelectedClientForDossier}
              />
            }
          />
          <Route
            path="pipeline"
            element={
              <AdminPipelinePage
                selectedBranch={selectedBranch}
                branchClients={branchClients}
                dark={dark}
                onOpenStatusUpdate={handleOpenStatusUpdate}
              />
            }
          />
          <Route
            path="agreement"
            element={
              <AgreementPage
                clients={branchClients}
                onClientTrackerAdvance={handleClientAgreementAdvance}
                showToast={showToast}
                selectedBranch={selectedBranch}
              />
            }
          />
          <Route
            path="requests"
            element={
              <AdminRequestsPage
                clients={branchClients}
                onRollbackApproved={(req) => {
                  showToast(`Rollback request ${req.id} approved.`);
                }}
              />
            }
          />
          <Route
            path="history"
            element={
              <AdminHistoryPage
                selectedBranch={selectedBranch}
                branchClients={branchClients}
                dark={dark}
                onOpenDossier={setSelectedClientForDossier}
              />
            }
          />
          <Route
            path="team"
            element={
              <AdminTeamPage
                selectedBranch={selectedBranch}
                teamMembers={teamMembers}
                branchClients={branchClients}
                dark={dark}
                onOpenDossier={setSelectedClientForDossier}
                onOpenStatusUpdate={handleOpenStatusUpdate}
              />
            }
          />
          <Route
            path="*"
            element={<Navigate to="/admin/dashboard" replace />}
          />
        </Routes>

        {/* MODAL: UPDATE APPLICATION STATUS & 5-POINT MILESTONES */}
        <AdminStatusModal
          updatingClient={updatingClient}
          statusFormData={statusFormData}
          setStatusFormData={setStatusFormData}
          onClose={() => setUpdatingClient(null)}
          onSave={handleSaveStatusUpdate}
          onRequestRollback={(client, targetStage) => {
            setUpdatingClient(null);
            setRollbackRequestData({ client, targetStage });
          }}
        />

        {/* MODAL: CLIENT APPLICATION DOSSIER */}
        <AdminClientDossierModal
          selectedClientForDossier={selectedClientForDossier}
          onClose={() => setSelectedClientForDossier(null)}
          onOpenStatusUpdate={(client) => {
            setSelectedClientForDossier(null);
            handleOpenStatusUpdate(client);
          }}
        />

        {/* MODAL: STAGE ROLLBACK & GOVERNANCE REQUEST TO BRANCH MANAGER */}
        {rollbackRequestData && (
          <AdminCreateRequestModal
            clients={branchClients}
            preselectedClient={rollbackRequestData.client}
            preselectedTargetStage={rollbackRequestData.targetStage}
            onClose={() => setRollbackRequestData(null)}
            onSubmit={(newReq) => {
              setRollbackRequestData(null);
              showToast(`Rollback request for ${newReq.clientName} submitted to Branch Manager.`);
              navigate("/admin/requests");
            }}
          />
        )}
      </section>
    </main>
  );
}
