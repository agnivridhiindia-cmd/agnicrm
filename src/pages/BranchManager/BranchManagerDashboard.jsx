import React, { useState, useMemo, useEffect } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import DashboardSidebar from "../../components/dashboard/DashboardSidebar";
import DashboardHeader from "../../components/dashboard/DashboardHeader";
import HeaderSearch from "../../components/dashboard/HeaderSearch";
import UserProfileMenu from "../../components/dashboard/UserProfileMenu";
import Icon from "../../components/Icon";

// Modular Page Components
import BranchManagerOverviewPage from "./BranchManagerOverviewPage";
import BranchManagerClientsPage from "./BranchManagerClientsPage";
import BranchManagerEmployeesPage from "./BranchManagerEmployeesPage";
import BranchManagerRevenuePage from "./BranchManagerRevenuePage";
import BranchManagerReportsPage from "./BranchManagerReportsPage";
import BranchManagerAdminPage from "./BranchManagerAdminPage";
import BranchManagerITPage from "./BranchManagerITPage";
import BranchManagerMarketingPage from "./BranchManagerMarketingPage";
import BranchManagerRequestsPage from "./BranchManagerRequestsPage";
import "./branchmanagerdashboard.css";

import { getTrackerState } from "../../utils/schemeTracker";
import { getManagerBranchDetails, normalizeSalesPersonName, sanitizeClientRecord, mergeSecondaryClients } from "../../utils/branchHelper";
import { apiFetch } from "../../services/apiClient";

// Mock & Initial Data
import {
  initialBranchAdmins,
  initialBranchIT,
  initialBranchMarketing,
  initialEmployeesList,
} from "./mockBranchManagerData";

const navItems = [
  { icon: "dashboard", label: "Dashboard" },
  { icon: "clients", label: "Clients" },
  { icon: "team", label: "Employees" },
  { icon: "requests", label: "Requests" },
  { icon: "revenue", label: "Revenue" },
  { icon: "reports", label: "Reports" },
  { icon: "settings", label: "Admin" },
  { icon: "overview", label: "IT" },
  { icon: "leads", label: "Marketing" },
];

export default function BranchManagerDashboard({ onSignOut, userEmail }) {
  const navigate = useNavigate();
  const location = useLocation();

  const urlToNavMap = useMemo(() => ({
    dashboard: "Dashboard",
    overview: "Dashboard",
    clients: "Clients",
    employees: "Employees",
    team: "Employees",
    requests: "Requests",
    revenue: "Revenue",
    reports: "Reports",
    admin: "Admin",
    settings: "Admin",
    it: "IT",
    marketing: "Marketing",
    leads: "Marketing",
  }), []);

  const pathParts = location.pathname.split("/").filter(Boolean);
  const currentSlug = pathParts[1] || "dashboard";
  const activeNav = urlToNavMap[currentSlug.toLowerCase()] || "Dashboard";

  const handleNavChange = (label) => {
    const slug = label.toLowerCase();
    navigate(`/branch-manager/${slug}`);
  };

  const [dark, setDark] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  // States
  const [clients, setClients] = useState([]);
  const [branchAdmins] = useState(initialBranchAdmins);
  const [branchIT] = useState(initialBranchIT);
  const [branchMarketing] = useState(initialBranchMarketing);
  const [employeesList] = useState(initialEmployeesList);

  const branchInfo = useMemo(() => getManagerBranchDetails(userEmail), [userEmail]);
  const branchManagerName = branchInfo.branchManagerName;
  const managedRegion = branchInfo.region;
  const managedBranch = branchInfo.branchName;

  const salesPersonName = useMemo(() => {
    return branchManagerName || "Ariana Lee";
  }, [branchManagerName]);

  // Branch scope
  const myBranch = managedRegion || "West Zone";

  // Live Fetch Clients from PostgreSQL Backend API
  useEffect(() => {
    async function fetchBranchManagerClientsFromDB() {
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
                branch: c.branch?.name || managedBranch,
                region: c.branch?.region || managedRegion,
                scheme: c.serviceName,
                serviceType: c.serviceType,
                assignedSalesPerson: c.salesPerson?.fullName || c.owner || "Mia Rose",
                salesRep: c.salesPerson?.fullName || c.owner || "Mia Rose",
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
                createdAt: c.createdAt,
                lastUpdated: c.updatedAt
                  ? new Date(c.updatedAt).toISOString().replace("T", " ").substring(0, 16)
                  : new Date().toISOString().replace("T", " ").substring(0, 16),
                invoices: c.invoices || [],
                documents: c.documents || [],
              });
            });

            const fullDbClients = mergeSecondaryClients(mappedDbClients);
            setClients(fullDbClients);
          }
        }
      } catch (err) {
        console.warn("Could not fetch branch manager clients from DB:", err);
      }
    }

    fetchBranchManagerClientsFromDB();

    window.addEventListener("agni_clients_updated", fetchBranchManagerClientsFromDB);
    return () => {
      window.removeEventListener("agni_clients_updated", fetchBranchManagerClientsFromDB);
    };
  }, [managedBranch, managedRegion]);

  return (
    <main className={`owner-dashboard branch-manager-dashboard ${dark ? "dashboard-dark" : ""}`}>
      <DashboardSidebar
        navItems={navItems}
        activeNav={activeNav}
        onNavChange={handleNavChange}
        dark={dark}
        onToggleDark={() => setDark((value) => !value)}
        onSignOut={onSignOut}
        IconComponent={Icon}
        brandMark="BM"
        navLabel="Branch manager navigation"
      />

      <section className="dashboard-content">
        <DashboardHeader
          eyebrow="Branch manager workspace"
          title={`Hello, ${salesPersonName}`}
          className="sales-dashboard-top"
        >
          <div className="top-actions">
            <HeaderSearch
              query={query}
              setQuery={setQuery}
              isOpen={searchOpen}
              setIsOpen={setSearchOpen}
              placeholder="Search clients, leads, or deals..."
            />
            <UserProfileMenu
              user={{
                name: salesPersonName,
                email: branchInfo.branchManagerEmail || "ariana@agni.com",
                phone: "+91 98200 98765",
                branch: managedBranch,
                designation: "Branch Director & Manager",
                empId: "EMP-BM-1002",
                quota: "₹1,20,00,000",
                achieved: "₹94,80,000 (79%)",
                reportingManager: "Yashvardhan Trivedi (Owner)",
              }}
              role="Branch Manager"
              roleBadge="Branch Manager"
              initials="BM"
              avatarColor="linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)"
              onSignOut={onSignOut}
              showToast={(msg) => alert(msg)}
            />
          </div>
        </DashboardHeader>

        {/* Nested Routes for Branch Manager Dashboard */}
        <Routes>
          <Route
            index
            element={
              <BranchManagerOverviewPage
                dark={dark}
                onNavigate={handleNavChange}
                clients={clients}
                managedBranch={managedBranch}
                managedRegion={managedRegion}
                branchManagerName={branchManagerName}
                employeesList={employeesList}
                branchAdmins={branchAdmins}
                branchIT={branchIT}
                branchMarketing={branchMarketing}
              />
            }
          />
          <Route
            path="dashboard"
            element={
              <BranchManagerOverviewPage
                dark={dark}
                onNavigate={handleNavChange}
                clients={clients}
                managedBranch={managedBranch}
                managedRegion={managedRegion}
                branchManagerName={branchManagerName}
                employeesList={employeesList}
                branchAdmins={branchAdmins}
                branchIT={branchIT}
                branchMarketing={branchMarketing}
              />
            }
          />
          <Route
            path="overview"
            element={
              <BranchManagerOverviewPage
                dark={dark}
                onNavigate={handleNavChange}
                clients={clients}
                managedBranch={managedBranch}
                managedRegion={managedRegion}
                branchManagerName={branchManagerName}
                employeesList={employeesList}
                branchAdmins={branchAdmins}
                branchIT={branchIT}
                branchMarketing={branchMarketing}
              />
            }
          />
          <Route
            path="clients"
            element={
              <BranchManagerClientsPage
                clients={clients}
                setClients={setClients}
                employeesList={employeesList}
              />
            }
          />
          <Route
            path="employees"
            element={
              <BranchManagerEmployeesPage
                employeesList={employeesList}
                branchManagerName={branchManagerName}
                managedRegion={managedRegion}
              />
            }
          />
          <Route
            path="team"
            element={
              <BranchManagerEmployeesPage
                employeesList={employeesList}
                branchManagerName={branchManagerName}
                managedRegion={managedRegion}
              />
            }
          />
          <Route
            path="requests"
            element={
              <BranchManagerRequestsPage
                employeesList={employeesList}
                branchAdmins={branchAdmins}
                branchIT={branchIT}
                branchMarketing={branchMarketing}
                myBranch={myBranch}
                clients={clients}
              />
            }
          />
          <Route
            path="revenue"
            element={
              <BranchManagerRevenuePage
                myBranch={myBranch}
                clients={clients}
              />
            }
          />
          <Route
            path="reports"
            element={
              <BranchManagerReportsPage
                myBranch={myBranch}
              />
            }
          />
          <Route
            path="admin"
            element={
              <BranchManagerAdminPage
                branchAdmins={branchAdmins}
                branchManagerName={branchManagerName}
                managedRegion={managedRegion}
              />
            }
          />
          <Route
            path="settings"
            element={
              <BranchManagerAdminPage
                branchAdmins={branchAdmins}
                branchManagerName={branchManagerName}
                managedRegion={managedRegion}
              />
            }
          />
          <Route
            path="it"
            element={
              <BranchManagerITPage
                branchIT={branchIT}
                branchManagerName={branchManagerName}
                managedRegion={managedRegion}
              />
            }
          />
          <Route
            path="marketing"
            element={
              <BranchManagerMarketingPage
                branchMarketing={branchMarketing}
                branchManagerName={branchManagerName}
                managedRegion={managedRegion}
              />
            }
          />
          <Route
            path="leads"
            element={
              <BranchManagerMarketingPage
                branchMarketing={branchMarketing}
                branchManagerName={branchManagerName}
                managedRegion={managedRegion}
              />
            }
          />
          <Route
            path="*"
            element={<Navigate to="/branch-manager/dashboard" replace />}
          />
        </Routes>
      </section>
    </main>
  );
}
