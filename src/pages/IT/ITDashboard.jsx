import React, { useState, useMemo, useRef, useEffect } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import DashboardSidebar from "../../components/dashboard/DashboardSidebar";
import DashboardHeader from "../../components/dashboard/DashboardHeader";
import NotificationBell from "../../components/dashboard/NotificationBell";
import UserProfileMenu from "../../components/dashboard/UserProfileMenu";
import Icon from "../../components/Icon";

// Modular Sub-pages
import ITOverviewPage from "./ITOverviewPage";
import ITClientFormPage from "./ITClientFormPage";
import ITClientDetailsPage from "./ITClientDetailsPage";
import ITServicesCatalogPage from "./ITServicesCatalogPage";
import "./ITDashboard.css";

// Mock Data
import {
  navItems,
  initialITCreatedClients,
  initialSalesPitchedITClients,
} from "./mockITData";

export default function ITDashboard({ onSignOut, userEmail }) {
  const navigate = useNavigate();
  const location = useLocation();

  const urlToNavMap = useMemo(
    () => ({
      dashboard: "Dashboard",
      overview: "Dashboard",
      client: "Client",
      "new-client": "Client",
      details: "Details",
      clients: "Details",
      services: "Services",
      service: "Services",
    }),
    []
  );

  const pathParts = location.pathname.split("/").filter(Boolean);
  const currentSlug = pathParts[1] || "dashboard";
  const activeNav = urlToNavMap[currentSlug.toLowerCase()] || "Dashboard";

  const handleNavChange = (label) => {
    const slug = label.toLowerCase();
    navigate(`/it/${slug}`);
  };

  const [dark, setDark] = useState(false);

  // Shared state for IT clients
  const [createdClients, setCreatedClients] = useState(initialITCreatedClients);
  const [salesPitchedClients, setSalesPitchedClients] = useState(initialSalesPitchedITClients);
  const [preselectedService, setPreselectedService] = useState(null);

  const handleCreateClientWithService = (serviceOrName) => {
    setPreselectedService(serviceOrName);
    handleNavChange("Client");
  };

  const itLeadName = useMemo(() => {
    if (!userEmail) return "IT Administrator";
    let raw = userEmail.split("@")[0];
    // Strip trailing digits if any
    raw = raw.replace(/\d+$/, "");
    const parts = raw.split(/[^a-zA-Z]+/).filter(Boolean);
    if (parts.length === 0) return "IT Administrator";
    return parts
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");
  }, [userEmail]);

  const handleClientCreated = (newClient) => {
    setCreatedClients((prev) => [newClient, ...prev]);
  };



  const [departmentNotifs, setDepartmentNotifs] = useState([]);

  useEffect(() => {
    function syncITData() {
      try {
        const savedClients = localStorage.getItem("agni_it_clients");
        if (savedClients) {
          const parsed = JSON.parse(savedClients);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSalesPitchedClients(parsed);
          }
        }
        const savedNotifs = localStorage.getItem("agni_department_notifications");
        if (savedNotifs) {
          const parsed = JSON.parse(savedNotifs);
          if (Array.isArray(parsed)) {
            setDepartmentNotifs(parsed.filter((n) => n.department === "IT" && !n.read));
          }
        }
      } catch (e) {}
    }
    syncITData();
    window.addEventListener("storage", syncITData);
    window.addEventListener("agni_dept_assigned", syncITData);
    const interval = setInterval(syncITData, 30000);
    return () => {
      window.removeEventListener("storage", syncITData);
      window.removeEventListener("agni_dept_assigned", syncITData);
      clearInterval(interval);
    };
  }, []);

  const handleDismissNotif = (notifId) => {
    try {
      const saved = localStorage.getItem("agni_department_notifications");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const updated = parsed.map((n) => (n.id === notifId ? { ...n, read: true } : n));
          localStorage.setItem("agni_department_notifications", JSON.stringify(updated));
          setDepartmentNotifs(updated.filter((n) => n.department === "IT" && !n.read));
        }
      }
    } catch (e) {}
  };



  return (
    <main className={`owner-dashboard it-dashboard ${dark ? "dashboard-dark" : ""}`}>
      <DashboardSidebar
        navItems={navItems}
        activeNav={activeNav}
        onNavChange={handleNavChange}
        dark={dark}
        onToggleDark={() => setDark((val) => !val)}
        onSignOut={onSignOut}
        IconComponent={Icon}
        brandMark="IT"
        brandName={<strong>Agni CRM</strong>}
        navLabel="IT dashboard navigation"
      />

      <section className="dashboard-content">
        <DashboardHeader
          eyebrow="IT Operations &amp; Client Services"
          title={`Hello, ${itLeadName}`}
          copy="Enterprise IT client onboarding, branch sales request tracking, and company IT service catalog."
          className="owner-dashboard-top"
        >
          <div className="top-actions owner-top-actions">
            <NotificationBell
              role="IT"
              userEmail={userEmail}
              userName={itLeadName}
            />
            <UserProfileMenu
              user={{
                name: itLeadName || "Aakash Varma",
                email: "aakash.it@agnicrm.com",
                phone: "+91 98205 77889",
                branch: "Enterprise HQ (Mumbai)",
                designation: "Lead Enterprise Solutions Architect",
                empId: "EMP-IT-4001",
                reportingManager: "Yashvardhan Trivedi (Owner)",
              }}
              role="IT Admin"
              roleBadge="IT Admin"
              initials="IT"
              avatarColor="linear-gradient(135deg, #059669 0%, #10b981 100%)"
              onSignOut={onSignOut}
              showToast={(msg) => alert(msg)}
            />
          </div>
        </DashboardHeader>

        {departmentNotifs.length > 0 && (
          <div style={{
            background: "linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(56, 189, 248, 0.15) 100%)",
            border: "1px solid rgba(16, 185, 129, 0.4)",
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

        {/* Nested Routes for IT Dashboard */}
        <Routes>
          <Route
            index
            element={
              <ITOverviewPage
                dark={dark}
                onNavigate={handleNavChange}
                onPitchService={handleCreateClientWithService}
                createdClients={createdClients}
                salesPitchedClients={salesPitchedClients}
              />
            }
          />
          <Route
            path="dashboard"
            element={
              <ITOverviewPage
                dark={dark}
                onNavigate={handleNavChange}
                onPitchService={handleCreateClientWithService}
                createdClients={createdClients}
                salesPitchedClients={salesPitchedClients}
              />
            }
          />
          <Route
            path="overview"
            element={
              <ITOverviewPage
                dark={dark}
                onNavigate={handleNavChange}
                onPitchService={handleCreateClientWithService}
                createdClients={createdClients}
                salesPitchedClients={salesPitchedClients}
              />
            }
          />
          <Route
            path="client"
            element={
              <ITClientFormPage
                dark={dark}
                preselectedService={preselectedService}
                onClearPreselectedService={() => setPreselectedService(null)}
                onClientCreated={handleClientCreated}
                onNavigateToDetails={() => handleNavChange("Details")}
              />
            }
          />
          <Route
            path="new-client"
            element={
              <ITClientFormPage
                dark={dark}
                preselectedService={preselectedService}
                onClearPreselectedService={() => setPreselectedService(null)}
                onClientCreated={handleClientCreated}
                onNavigateToDetails={() => handleNavChange("Details")}
              />
            }
          />
          <Route
            path="details"
            element={
              <ITClientDetailsPage
                dark={dark}
                createdClients={createdClients}
                salesPitchedClients={salesPitchedClients}
                onNavigateToCreateClient={() => {
                  setPreselectedService(null);
                  handleNavChange("Client");
                }}
              />
            }
          />
          <Route
            path="clients"
            element={
              <ITClientDetailsPage
                dark={dark}
                createdClients={createdClients}
                salesPitchedClients={salesPitchedClients}
                onNavigateToCreateClient={() => {
                  setPreselectedService(null);
                  handleNavChange("Client");
                }}
              />
            }
          />
          <Route
            path="services"
            element={
              <ITServicesCatalogPage
                dark={dark}
                onPitchService={handleCreateClientWithService}
              />
            }
          />
          <Route
            path="service"
            element={
              <ITServicesCatalogPage
                dark={dark}
                onPitchService={handleCreateClientWithService}
              />
            }
          />
          <Route
            path="*"
            element={<Navigate to="/it/dashboard" replace />}
          />
        </Routes>
      </section>
    </main>
  );
}
