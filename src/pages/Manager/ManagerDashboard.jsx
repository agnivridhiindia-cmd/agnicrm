import React, { useState, useMemo, useRef, useEffect } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import DashboardSidebar from "../../components/dashboard/DashboardSidebar";
import DashboardHeader from "../../components/dashboard/DashboardHeader";
import NotificationBell from "../../components/dashboard/NotificationBell";
import UserProfileMenu from "../../components/dashboard/UserProfileMenu";
import Icon from "../../components/Icon";

// Modular Page Components
import ManagerOverviewPage from "./ManagerOverviewPage";
import ManagerTeamPage from "./ManagerTeamPage";
import ManagerClientsPage from "./ManagerClientsPage";
import ManagerRequestsPage from "./ManagerRequestsPage";
import ManagerRevenuePage from "./ManagerRevenuePage";
import ManagerReportsPage from "./ManagerReportsPage";
import "./manager.css";

import { getManagerBranchDetails, normalizeSalesPersonName, sanitizeClientRecord, mergeSecondaryClients, syncTeamHierarchyFromDB } from "../../utils/branchHelper";
import { normalizeSchemeName, isSameClientScheme } from "../Sales/hooks/useSalesClients";
import { isMockClient } from "../../utils/revenueCalculator";
import { apiFetch } from "../../services/apiClient";
import { useAuth } from "../../context/AuthContext";

// Mock & Initial Data
import {
  navItems,
  salesTeam,
} from "./mockManagerData";

export default function ManagerDashboard({ onSignOut, userEmail }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: authUser, userName: authName, userEmail: authEmail, userBranch: authBranch } = useAuth();

  const urlToNavMap = useMemo(
    () => ({
      dashboard: "Dashboard",
      overview: "Dashboard",
      team: "Team",
      employees: "Team",
      clients: "Clients",
      client: "Clients",
      requests: "Requests",
      request: "Requests",
      revenue: "Revenue",
      revenues: "Revenue",
      reports: "Reports",
      report: "Reports",
      analytics: "Reports",
    }),
    []
  );

  const pathParts = location.pathname.split("/").filter(Boolean);
  const currentSlug = pathParts[1] || "dashboard";
  const activeNav = urlToNavMap[currentSlug.toLowerCase()] || "Dashboard";

  const handleNavChange = (label) => {
    const slug = label.toLowerCase();
    navigate(`/manager/${slug}`);
  };

  const [dark, setDark] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => authUser);

  const activeUser = currentUser || authUser;
  const activeEmail = userEmail || authEmail || activeUser?.email || "";

  const branchInfo = useMemo(() => {
    return getManagerBranchDetails(activeEmail || activeUser?.branch?.name || "");
  }, [activeEmail, activeUser]);

  const managerName = activeUser?.fullName || activeUser?.name || authName || branchInfo.managerName;
  const managedBranch = authBranch || activeUser?.branch?.name || (typeof activeUser?.branch === "string" ? activeUser.branch : "") || branchInfo.branchName;
  const managedRegion = activeUser?.region || activeUser?.branch?.region || branchInfo.region;

  // Sync logged in user profile & team hierarchy from API
  useEffect(() => {
    let isMounted = true;
    syncTeamHierarchyFromDB();
    async function syncMe() {
      try {
        const res = await apiFetch("/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user && isMounted) {
            setCurrentUser(data.user);
          }
        }
      } catch (e) {}
    }
    syncMe();
    return () => { isMounted = false; };
  }, []);

  const [managerNotices, setManagerNotices] = useState([]);

  useEffect(() => {
    async function syncManagerNotices() {
      try {
        const res = await apiFetch("/notifications");
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            setManagerNotices(json.data);
          }
        }
      } catch (e) {}
    }
    syncManagerNotices();
    window.addEventListener("agni_notifications_updated", syncManagerNotices);
    window.addEventListener("agni_pending_updated", syncManagerNotices);
    const interval = setInterval(syncManagerNotices, 45000);
    return () => {
      window.removeEventListener("agni_notifications_updated", syncManagerNotices);
      window.removeEventListener("agni_pending_updated", syncManagerNotices);
      clearInterval(interval);
    };
  }, []);

  // Helper to fetch clients from PostgreSQL Database
  const fetchManagerClientsFromDB = async () => {
    try {
      const response = await apiFetch("/clients");

      if (response.ok) {
        const resData = await response.json();
        if (resData.success && Array.isArray(resData.data)) {
          const mappedDbClients = resData.data.map((c) => {
            const isSec = c.isPrimary === false || c.processType === "secondary" || c.serviceType === "More Services" || (typeof c.appId === "string" && (c.appId.endsWith("-S") || c.appId.endsWith("-E")));
            const rawTot = Number(c.totalPayment || c.invoices?.[0]?.rawTotal || c.fundingRequirement || 0);
            const finalTot = (!isSec && rawTot === 0) ? 118000 : rawTot;
            const rawRec = Math.max(Number(c.paymentReceived || 0), Number(c.invoices?.[0]?.paymentReceived || 0));
            const finalRec = (!isSec && rawRec === 0 && (c.paymentStatus === "Paid" || c.approvalStatus === "ACTIVE")) ? finalTot : rawRec;
            const finalPend = Math.max(0, finalTot - finalRec);

            const repName = c.salesPerson?.fullName || c.owner || c.assignedSalesPerson || branchInfo.salespersons?.[0] || "Sales Representative";
            const repEmail = c.salesPerson?.email || c.ownerEmail || branchInfo.salesEmails?.[0] || "";

            return sanitizeClientRecord({
              ...c,
              id: c.id,
              appId: c.appId,
              name: c.name,
              company: c.companyName || c.name,
              contactPerson: c.contactPerson || c.name,
              email: c.email,
              phone: c.phone,
              branch: c.branch?.name || managedBranch,
              region: c.branch?.region || managedRegion,
              scheme: c.serviceName,
              service: c.serviceName,
              serviceType: c.serviceType,
              assignedSalesPerson: repName,
              salesRep: repName,
              owner: repName,
              salesPersonEmail: repEmail,
              applicationStatus: c.applicationStatus || "CRM Creation",
              stage: c.applicationStatus || "Active",
              completedSteps: c.completedSteps || ["CRM Creation"],
              progress: c.progressPercent || 20,
              createdAt: c.createdAt,
              lastUpdated: c.updatedAt
                ? new Date(c.updatedAt).toISOString().replace("T", " ").substring(0, 16)
                : new Date().toISOString().replace("T", " ").substring(0, 16),
              totalPayment: String(finalTot),
              revenue: String(finalTot),
              amount: String(Math.round(finalTot / 1.18)),
              paymentReceived: String(finalRec),
              paymentPending: String(finalPend),
              fundingRequirement: c.fundingRequirement,
              annualTurnover: c.annualTurnover,
              businessType: c.businessType,
              sector: c.sector,
              gstNumber: c.gstNumber,
              panNumber: c.panNumber,
              invoices: c.invoices || [],
              paymentsHistory: (c.invoices || []).flatMap((inv) =>
                (inv.payments || []).map((p) => ({
                  id: p.id,
                  amount: p.amount,
                  paidAmount: p.amount,
                  date: p.paymentDate || p.createdAt,
                  paymentDate: p.paymentDate || p.createdAt,
                  status: p.status === "FAILED" ? "failed" : p.status === "PENDING" ? "pending" : "success",
                  salesPerson: repName,
                  salesRep: repName,
                }))
              ),
            });
          });
          const fullDbClients = mergeSecondaryClients(mappedDbClients);
          setClientsState(fullDbClients);
        }
      }
    } catch (err) {
      console.warn("Could not fetch manager clients from DB:", err);
    }
  };

  const [clients, setClientsState] = useState([]);

  useEffect(() => {
    fetchManagerClientsFromDB();
    
    // Listen for cross-component re-fetches
    const handleUpdate = () => fetchManagerClientsFromDB();
    window.addEventListener("agni_clients_updated", handleUpdate);
    
    return () => {
      window.removeEventListener("agni_clients_updated", handleUpdate);
    };
  }, []);

  const setClients = (updater) => {
    setClientsState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      // We no longer sync array to localStorage
      window.dispatchEvent(new Event("agni_clients_updated"));
      return next;
    });
  };


  const [dbEmployees, setDbEmployees] = useState([]);

  useEffect(() => {
    let isMounted = true;
    async function fetchDBUsers() {
      try {
        const response = await apiFetch("/auth/users");
        if (response.ok) {
          const resData = await response.json();
          if (resData.success && Array.isArray(resData.users) && isMounted) {
            const mapped = resData.users.map((u) => ({
              ...u,
              id: u.id,
              name: u.fullName || u.name,
              fullName: u.fullName || u.name,
              role: u.role || "Sales Executive",
              email: u.email,
              phone: u.phone || "",
              branch: u.branch ? (typeof u.branch === "string" ? u.branch : u.branch.name) : (u.region || "West Zone (Mumbai)"),
              region: u.region || (u.branch ? (typeof u.branch === "object" ? u.branch.region : "") : ""),
            }));
            setDbEmployees(mapped);
          }
        }
      } catch (err) {
        console.warn("Could not fetch DB users for Manager Dashboard:", err);
      }
    }
    fetchDBUsers();
    return () => { isMounted = false; };
  }, []);

  // Dynamically resolve ALL sales persons belonging to this manager's branch
  const branchTeam = useMemo(() => {
    const branchLower = (managedBranch || "").toLowerCase().trim();
    const regionLower = (managedRegion || "").toLowerCase().trim();
    const codeLower = (branchInfo.branchCode || branchInfo.code || "").toLowerCase().trim();

    const designatedNames = (branchInfo.salespersons || []).map((s) => s.toLowerCase().trim());
    const designatedEmails = (branchInfo.salesEmails || []).map((s) => s.toLowerCase().trim());

    const userSource = dbEmployees.length > 0 ? dbEmployees : salesTeam;

    return userSource.filter((member) => {
      if (!member) return false;
      const mName = (member.name || member.fullName || "").toLowerCase().trim();
      const mEmail = (member.email || "").toLowerCase().trim();
      const mBranch = (member.branch || member.region || "").toLowerCase().trim();
      const mRole = String(member.role || "").toLowerCase().trim();

      // Exclude IT, Admin, Marketing, and Managers from the Sales Team list
      if (
        mRole === "it" ||
        mRole.includes("admin") ||
        mRole.includes("market") ||
        mRole.includes("it ") ||
        mRole.includes("tech") ||
        mRole.includes("manager")
      ) {
        return false;
      }

      // 1. Designated salesperson match from branchInfo
      if (designatedNames.includes(mName) || designatedEmails.includes(mEmail)) {
        return true;
      }

      // 2. Exact match on branch name, region, or branch code
      if (mBranch === branchLower || mBranch === regionLower || mBranch === codeLower) {
        return true;
      }

      // 3. Keyword matching (mumbai, west, delhi, north, bengaluru, south, kolkata, east)
      const keywords = ["mumbai", "west", "delhi", "north", "bengaluru", "south", "kolkata", "east"];
      for (const kw of keywords) {
        if ((branchLower.includes(kw) || regionLower.includes(kw)) && mBranch.includes(kw)) {
          return true;
        }
      }

      return false;
    });
  }, [managedBranch, managedRegion, branchInfo, dbEmployees]);

  const branchTeamNames = useMemo(
    () => Array.from(new Set([...branchTeam.map((member) => member.name), ...(branchInfo.salespersons || [])])),
    [branchTeam, branchInfo]
  );

  const branchClients = useMemo(() => {
    if (!clients || clients.length === 0) return [];

    const salesNamesLower = (branchInfo.salespersons || []).map((s) => s.toLowerCase().trim());
    const salesEmailsLower = (branchInfo.salesEmails || []).map((s) => s.toLowerCase().trim());
    const managedBranchLower = (managedBranch || "").toLowerCase().trim();
    const managedRegionLower = (managedRegion || "").toLowerCase().trim();

    return clients.filter((client) => {
      if (!client) return false;
      const rep = (client.salesRep || client.assignedSalesPerson || client.salesPerson || client.owner || "").toLowerCase().trim();
      const repEmail = (client.salesPersonEmail || client.ownerEmail || "").toLowerCase().trim();
      const clientBranch = (client.branch || client.region || "").toLowerCase().trim();

      const isRepMatch =
        (rep && (salesNamesLower.includes(rep) || branchTeamNames.some((n) => n.toLowerCase().trim() === rep))) ||
        (repEmail && salesEmailsLower.includes(repEmail));

      const isBranchMatch =
        !clientBranch ||
        managedBranchLower.includes(clientBranch) ||
        clientBranch.includes(managedBranchLower) ||
        managedRegionLower.includes(clientBranch) ||
        clientBranch.includes(managedRegionLower) ||
        (clientBranch.includes("west") && managedBranchLower.includes("west")) ||
        (clientBranch.includes("north") && managedBranchLower.includes("north")) ||
        (clientBranch.includes("south") && managedBranchLower.includes("south")) ||
        (clientBranch.includes("east") && managedBranchLower.includes("east"));

      return isRepMatch || isBranchMatch;
    });
  }, [clients, branchTeamNames, branchInfo, managedBranch, managedRegion]);

  const salesPeople = useMemo(
    () => branchTeam.map((member) => ({ id: member.id, name: member.name })),
    [branchTeam]
  );



  return (
    <main className={`owner-dashboard ${dark ? "dashboard-dark" : ""}`}>
      <DashboardSidebar
        navItems={navItems}
        activeNav={activeNav}
        onNavChange={handleNavChange}
        dark={dark}
        onToggleDark={() => setDark((value) => !value)}
        onSignOut={onSignOut}
        IconComponent={Icon}
        brandName={<strong>Agni CRM</strong>}
        navLabel="Manager dashboard navigation"
      />

      <section className="dashboard-content">
        <DashboardHeader
          eyebrow="Manager workspace"
          title={`Welcome back, ${managerName}`}
          copy="Monitor your team, track pipeline momentum, and keep client work moving forward."
          className="owner-dashboard-top"
        >
          <div className="top-actions owner-top-actions">
            <NotificationBell
              role="Manager"
              userEmail={userEmail || currentUser?.email || branchInfo.managerEmail}
              userName={managerName}
              branch={managedBranch}
            />
            <UserProfileMenu
              user={{
                name: managerName || "Enterprise Manager",
                email: userEmail || currentUser?.email || branchInfo.managerEmail || "manager@agnicrm.com",
                phone: currentUser?.phone || "+91 98111 22335",
                branch: managedBranch,
                designation: "Enterprise Sales Manager",
                empId: "EMP-MGR-2004",
                reportingManager: `${branchInfo.branchManagerName} (Branch Manager)`,
              }}
              role="Manager"
              roleBadge="Manager"
              initials={managerName ? managerName.split(" ").filter(Boolean).map((n) => n[0]).join("").toUpperCase().substring(0, 2) : "M"}
              avatarColor="linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)"
              onSignOut={onSignOut}
              showToast={(msg) => alert(msg)}
            />
          </div>
        </DashboardHeader>

        {/* Nested Routes for Manager Dashboard */}
        <Routes>
          <Route
            index
            element={<ManagerOverviewPage dark={dark} onNavigate={handleNavChange} branchTeam={branchTeam} clients={branchClients} />}
          />
          <Route
            path="dashboard"
            element={<ManagerOverviewPage dark={dark} onNavigate={handleNavChange} branchTeam={branchTeam} clients={branchClients} />}
          />
          <Route
            path="overview"
            element={<ManagerOverviewPage dark={dark} onNavigate={handleNavChange} branchTeam={branchTeam} clients={branchClients} />}
          />
          <Route
            path="team"
            element={
              <ManagerTeamPage
                branchTeam={branchTeam}
                clients={branchClients}
                managedRegion={managedRegion}
                managerName={managerName}
                branchManagerName={branchInfo.branchManagerName}
              />
            }
          />
          <Route
            path="employees"
            element={
              <ManagerTeamPage
                branchTeam={branchTeam}
                clients={branchClients}
                managedRegion={managedRegion}
                managerName={managerName}
                branchManagerName={branchInfo.branchManagerName}
              />
            }
          />
          <Route
            path="clients"
            element={
              <ManagerClientsPage
                clients={branchClients}
                setClients={setClients}
                salesPeople={salesPeople}
              />
            }
          />
          <Route
            path="client"
            element={
              <ManagerClientsPage
                clients={branchClients}
                setClients={setClients}
                salesPeople={salesPeople}
              />
            }
          />
          <Route
            path="requests"
            element={
              <ManagerRequestsPage
                branchTeamNames={branchTeamNames}
                managedRegion={managedRegion}
                branchTeam={branchTeam}
                clients={branchClients}
              />
            }
          />
          <Route
            path="request"
            element={
              <ManagerRequestsPage
                branchTeamNames={branchTeamNames}
                managedRegion={managedRegion}
                branchTeam={branchTeam}
                clients={branchClients}
              />
            }
          />
          <Route
            path="revenue"
            element={
              <ManagerRevenuePage
                branchTeam={branchTeam}
                managedRegion={managedRegion}
                managedBranch={managedBranch}
                clients={branchClients}
              />
            }
          />
          <Route
            path="revenues"
            element={
              <ManagerRevenuePage
                branchTeam={branchTeam}
                managedRegion={managedRegion}
                managedBranch={managedBranch}
                clients={branchClients}
              />
            }
          />
          <Route
            path="reports"
            element={<ManagerReportsPage branchTeam={branchTeam} clients={branchClients} />}
          />
          <Route
            path="report"
            element={<ManagerReportsPage branchTeam={branchTeam} clients={branchClients} />}
          />
          <Route
            path="analytics"
            element={<ManagerReportsPage branchTeam={branchTeam} clients={branchClients} />}
          />
          <Route
            path="*"
            element={<Navigate to="/manager/dashboard" replace />}
          />
        </Routes>
      </section>
    </main>
  );
}
