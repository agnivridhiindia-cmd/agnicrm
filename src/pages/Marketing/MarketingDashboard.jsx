import React, { useState, useMemo, useRef, useEffect } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import DashboardSidebar from "../../components/dashboard/DashboardSidebar";
import DashboardHeader from "../../components/dashboard/DashboardHeader";
import HeaderSearch from "../../components/dashboard/HeaderSearch";
import UserProfileMenu from "../../components/dashboard/UserProfileMenu";
import Icon from "../../components/Icon";

// Modular Sub-pages
import MarketingOverviewPage from "./MarketingOverviewPage";
import MarketingClientFormPage from "./MarketingClientFormPage";
import MarketingClientDetailsPage from "./MarketingClientDetailsPage";
import MarketingServicesCatalogPage from "./MarketingServicesCatalogPage";
import "./MarketingDashboard.css";

// Mock Data
import {
  navItems,
  initialMarketingCreatedClients,
  initialSalesPitchedMarketingClients,
} from "./mockMarketingData";

export default function MarketingDashboard({ onSignOut, userEmail }) {
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
    navigate(`/marketing/${slug}`);
  };

  const [dark, setDark] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsAutoScrollPaused, setNotificationsAutoScrollPaused] = useState(false);
  const [query, setQuery] = useState("");

  // Shared state for Marketing clients
  const [createdClients, setCreatedClients] = useState(initialMarketingCreatedClients);
  const [salesPitchedClients, setSalesPitchedClients] = useState(initialSalesPitchedMarketingClients);
  const [preselectedService, setPreselectedService] = useState(null);

  const handleCreateClientWithService = (serviceOrName) => {
    setPreselectedService(serviceOrName);
    handleNavChange("Client");
  };

  const notificationWrapRef = useRef(null);
  const notificationsListRef = useRef(null);
  const notificationsPauseTimer = useRef(null);

  const marketingLeadName = useMemo(() => {
    if (!userEmail) return "Marketing Lead";
    let raw = userEmail.split("@")[0];
    raw = raw.replace(/\d+$/, "");
    const parts = raw.split(/[^a-zA-Z]+/).filter(Boolean);
    if (parts.length === 0) return "Marketing Lead";
    return parts
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");
  }, [userEmail]);

  const handleClientCreated = (newClient) => {
    setCreatedClients((prev) => [newClient, ...prev]);
  };

  // Notifications outside click handler
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
      if (list.scrollTop >= maxScroll - 4) {
        list.scrollTop = 0;
      } else {
        list.scrollTop += 1;
      }
    }, 45);

    return () => window.clearInterval(intervalId);
  }, [notificationsOpen, notificationsAutoScrollPaused]);

  const [departmentNotifs, setDepartmentNotifs] = useState([]);

  useEffect(() => {
    function syncMarketingData() {
      try {
        const savedClients = localStorage.getItem("agni_marketing_clients");
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
            setDepartmentNotifs(parsed.filter((n) => n.department === "Marketing" && !n.read));
          }
        }
      } catch (e) {}
    }
    syncMarketingData();
    window.addEventListener("storage", syncMarketingData);
    window.addEventListener("agni_dept_assigned", syncMarketingData);
    const interval = setInterval(syncMarketingData, 30000);
    return () => {
      window.removeEventListener("storage", syncMarketingData);
      window.removeEventListener("agni_dept_assigned", syncMarketingData);
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
          setDepartmentNotifs(updated.filter((n) => n.department === "Marketing" && !n.read));
        }
      }
    } catch (e) {}
  };

  const handleNotificationsListScroll = () => {
    setNotificationsAutoScrollPaused(true);
    if (notificationsPauseTimer.current) {
      window.clearTimeout(notificationsPauseTimer.current);
    }
    notificationsPauseTimer.current = window.setTimeout(() => {
      setNotificationsAutoScrollPaused(false);
    }, 2000);
  };

  return (
    <main className={`owner-dashboard marketing-dashboard ${dark ? "dashboard-dark" : ""}`}>
      {/* ── Sidebar ── */}
      <DashboardSidebar
        navItems={navItems}
        activeNav={activeNav}
        onNavChange={handleNavChange}
        dark={dark}
        onToggleDark={() => setDark((prev) => !prev)}
        onSignOut={onSignOut}
        navLabel="Marketing navigation"
      />

      {/* ── Main Content Area ── */}
      <section className="dashboard-content">
        {/* ── Header ── */}
        <DashboardHeader
          title={`Hello, ${marketingLeadName}`}
          subtitle="Corporate marketing operations, client acquisitions, and enterprise growth campaigns."
          eyebrow="MARKETING OPERATIONS &amp; CLIENT SERVICES"
        >
          <div className="owner-top-actions">
            <HeaderSearch
              query={query}
              setQuery={setQuery}
              isOpen={searchOpen}
              setIsOpen={setSearchOpen}
              placeholder="Search marketing services, clients..."
            />
            <div className="notification-wrap">
              <button
                className="notification"
                type="button"
                onClick={() => setNotificationsOpen((open) => !open)}
                aria-label="Notifications"
              >
                <Icon name="bell" size={16} />
                <i />
              </button>
              {notificationsOpen && (
                <section className="notifications-popover" aria-label="Notifications">
                  <header>
                    <h2>Marketing Alerts</h2>
                    <span>3 active</span>
                  </header>
                  <div
                    className="notifications-scroll"
                    ref={notificationsListRef}
                    onScroll={handleNotificationsListScroll}
                  >
                    <article>
                      <span className="notice-dot green" />
                      <div>
                        <strong>New Marketing Client Onboarded</strong>
                        <p>Apex Healthcare AI enrolled for multi-channel performance ads.</p>
                      </div>
                    </article>
                    <article>
                      <span className="notice-dot coral" />
                      <div>
                        <strong>Sales Marketing Pitch Received</strong>
                        <p>East branch rep pitched B2B Funnels to Eastern Steel Infra.</p>
                      </div>
                    </article>
                    <article>
                      <span className="notice-dot violet" />
                      <div>
                        <strong>Service Catalog Live</strong>
                        <p>6 enterprise marketing service lines available with 18% GST auto-calc.</p>
                      </div>
                    </article>
                  </div>
                </section>
              )}
            </div>

            <UserProfileMenu
              user={{
                name: marketingLeadName || "Pooja Hegde",
                email: "pooja.marketing@agnicrm.com",
                phone: "+91 98206 99001",
                branch: "Enterprise HQ (Mumbai)",
                designation: "Chief Marketing Strategist",
                empId: "EMP-MKT-5001",
                reportingManager: "Yashvardhan Trivedi (Owner)",
              }}
              role="Marketing Lead"
              roleBadge="Marketing Lead"
              initials="MK"
              avatarColor="linear-gradient(135deg, #ec4899 0%, #d946ef 100%)"
              onSignOut={onSignOut}
              showToast={(msg) => alert(msg)}
            />
          </div>
        </DashboardHeader>

        {departmentNotifs.length > 0 && (
          <div style={{
            background: "linear-gradient(135deg, rgba(68, 191, 176, 0.15) 0%, rgba(16, 185, 129, 0.15) 100%)",
            border: "1px solid rgba(68, 191, 176, 0.4)",
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

        {/* Nested Routes for Marketing Dashboard */}
        <Routes>
          <Route
            index
            element={
              <MarketingOverviewPage
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
              <MarketingOverviewPage
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
              <MarketingOverviewPage
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
              <MarketingClientFormPage
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
              <MarketingClientFormPage
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
              <MarketingClientDetailsPage
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
              <MarketingClientDetailsPage
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
              <MarketingServicesCatalogPage
                dark={dark}
                onPitchService={handleCreateClientWithService}
              />
            }
          />
          <Route
            path="service"
            element={
              <MarketingServicesCatalogPage
                dark={dark}
                onPitchService={handleCreateClientWithService}
              />
            }
          />
          <Route
            path="*"
            element={<Navigate to="/marketing/dashboard" replace />}
          />
        </Routes>
      </section>
    </main>
  );
}
