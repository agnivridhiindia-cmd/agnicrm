import React, { useState, useEffect, Suspense, lazy } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import AuthScreen from "./Auth/AuthScreen";
import { apiFetch } from "../services/apiClient";
import { useAuth } from "../context/AuthContext";
import { initRealtimeService, closeRealtimeService } from "../services/realtimeService";
import { repairClientStorageData } from "../utils/branchHelper";

const ClientDashboard = lazy(() => import("../ClientDashboard"));
const DocumentForm = lazy(() => import("./Documents/DocumentForm"));
const OwnerDashboard = lazy(() => import("./Owner/OwnerDashboard"));
const ManagerDashboard = lazy(() => import("./Manager/ManagerDashboard"));
const BranchManagerDashboard = lazy(() => import("./BranchManager/BranchManagerDashboard"));
const SalesDashboard = lazy(() => import("./Sales/SalesDashboard"));
const AdminDashboard = lazy(() => import("./Admin/AdminDashboard"));
const MarketingDashboard = lazy(() => import("./Marketing/MarketingDashboard"));
const ITDashboard = lazy(() => import("./IT/ITDashboard"));

function ClientRouteWrapper({ userEmail, onSignOut }) {
  const emailKey = (userEmail || "").trim().toLowerCase();

  // "loading" = checking DB, "done" = check complete
  const [status, setStatus] = React.useState("loading");
  const [hasCompletedSetup, setHasCompletedSetup] = React.useState(false);

  React.useEffect(() => {
    if (!emailKey) {
      setHasCompletedSetup(false);
      setStatus("done");
      return;
    }

    // ── PostgreSQL authoritative check ────────────────────────────────────────
    async function checkDbDocumentStatus() {
      const token = localStorage.getItem("agni_token");
      if (!token) {
        setHasCompletedSetup(false);
        setStatus("done");
        return;
      }

      try {
        const res = await apiFetch("/clients/my-profile");

        if (res.ok) {
          const data = await res.json();
          const docStatus = data?.data?.documentStatus || data?.documentStatus;
          // DB says SUBMITTED or VERIFIED → client has filled the form
          if (docStatus === "SUBMITTED" || docStatus === "VERIFIED") {
            setHasCompletedSetup(true);
            setStatus("done");
            return;
          }
          // DB says NOT_SUBMITTED → show document form
          if (docStatus === "NOT_SUBMITTED") {
            setHasCompletedSetup(false);
            setStatus("done");
            return;
          }
        } else if (res.status === 404 || res.status === 401) {
          // Client profile not found in database (e.g. client removed/deleted)
          console.warn("Client profile not found in DB. Clearing session.");
          localStorage.removeItem("agni_token");
          localStorage.removeItem("agni_user");
          localStorage.removeItem("agni_user_role");
          localStorage.removeItem("agni_role");
          localStorage.removeItem("agni_user_email");
          localStorage.removeItem("agni_email");
          if (onSignOut) onSignOut();
          window.dispatchEvent(new CustomEvent("agni_auth_changed"));
          return;
        }
      } catch (e) {
        console.warn("Could not check document status from database:", e);
      }

      setStatus("done");
    }

    checkDbDocumentStatus();

    const handleClientsUpdated = () => {
      checkDbDocumentStatus();
    };
    window.addEventListener("agni_clients_updated", handleClientsUpdated);
    return () => {
      window.removeEventListener("agni_clients_updated", handleClientsUpdated);
    };
  }, [emailKey]);

  // ── Loading spinner while DB check is in progress ─────────────────────────
  if (status === "loading") {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: "100vh", background: "#0f1117", color: "#a0aec0",
        flexDirection: "column", gap: "16px",
      }}>
        <div style={{
          width: 40, height: 40, border: "3px solid #2d3748",
          borderTop: "3px solid #f97316", borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
        <p style={{ fontSize: 14, margin: 0 }}>Verifying your profile…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!hasCompletedSetup) {
    return (
      <DocumentForm
        email={userEmail}
        onSignOut={onSignOut}
        onComplete={() => {
          setHasCompletedSetup(true);
        }}
      />
    );
  }

  return <ClientDashboard onSignOut={onSignOut} userEmail={userEmail} />;
}


export function clearAllSavedClients() {
  const legacyKeys = [
    "agni_sales_clients", "agni_branch_clients", "agni_pending_client_creations",
    "agni_sales_invoices", "agni_sales_payments", "agni_clients",
    "agni_client_requests", "agni_pending_scheme_requests", "agni_crm_agreements_v4",
    "agni_sales_notifications", "agni_manager_notifications", "agni_department_notifications",
    "agni_client_notifications", "agni_db_team_hierarchy", "agni_client_doc_data_active",
    "agni_owner_notifications", "agni_branch_manager_notifications", "agni_admin_notifications",
    "agni_marketing_notifications", "agni_it_notifications"
  ];
  legacyKeys.forEach((k) => {
    try {
      localStorage.removeItem(k);
    } catch (e) {}
  });

  // Remove stale mock sessions if active
  try {
    const activeEmail = (localStorage.getItem("agni_user_email") || "").toLowerCase().trim();
    if (
      activeEmail.includes("feedus") ||
      activeEmail.includes("rajput") ||
      activeEmail.includes("yash") ||
      activeEmail.includes("bar@") ||
      activeEmail.includes("kshitiz007")
    ) {
      localStorage.removeItem("agni_token");
      localStorage.removeItem("agni_user");
      localStorage.removeItem("agni_user_name");
      localStorage.removeItem("agni_user_email");
      localStorage.removeItem("agni_user_role");
      localStorage.removeItem("agni_role");
      localStorage.removeItem("agni_email");
      localStorage.removeItem("agni_remember_email");
    }
  } catch (e) {}

  try {
    window.dispatchEvent(new Event("agni_clients_updated"));
    window.dispatchEvent(new Event("agni_pending_updated"));
  } catch (e) {}
}

const ROLE_MAP = {
  OWNER: "Owner",
  ADMIN: "Admin",
  BRANCH_MANAGER: "Branch Manager",
  MANAGER: "Manager",
  SALES_PERSON: "Sales Person",
  IT: "IT",
  MARKETING: "Marketing",
  CLIENT: "Client",
};

export default function App() {
  const navigate = useNavigate();

  const initialToken = typeof window !== "undefined" ? localStorage.getItem("agni_token") : null;
  const initialRole = typeof window !== "undefined" ? localStorage.getItem("agni_user_role") : null;
  const initialEmail = typeof window !== "undefined" ? localStorage.getItem("agni_user_email") : null;

  // If no token exists, auth is immediately ready (unauthenticated) to avoid any loading flash
  const [isAuthReady, setIsAuthReady] = React.useState(() => !initialToken);
  const [userRole, setUserRole] = React.useState(() => (initialToken ? initialRole || "" : ""));
  const [userEmail, setUserEmail] = React.useState(() => (initialToken ? initialEmail || "" : ""));

  const isCheckingRef = React.useRef(false);

  const rolePathMap = {
    "Admin": "/admin",
    "Owner": "/owner",
    "Client": "/client",
    "Manager": "/manager",
    "Sales Person": "/sales",
    "Branch Manager": "/branch-manager",
    "Marketing": "/marketing",
    "IT": "/it",
  };

  const checkAuth = React.useCallback(async () => {
    if (isCheckingRef.current) return;
    isCheckingRef.current = true;

    const storedToken = localStorage.getItem("agni_token");
    const storedRole = localStorage.getItem("agni_user_role");
    const storedEmail = (localStorage.getItem("agni_user_email") || "").toLowerCase().trim();

    // Without token or with mock email, wipe and mark ready
    if (
      !storedToken ||
      !storedRole ||
      !storedEmail ||
      storedEmail.includes("feedus") ||
      storedEmail.includes("rajput") ||
      storedEmail.includes("yash@") ||
      storedEmail.includes("bar@")
    ) {
      localStorage.removeItem("agni_user_email");
      localStorage.removeItem("agni_user_role");
      localStorage.removeItem("agni_role");
      localStorage.removeItem("agni_user");
      localStorage.removeItem("agni_email");
      localStorage.removeItem("agni_token");
      setUserRole("");
      setUserEmail("");
      setIsAuthReady(true);
      isCheckingRef.current = false;
      if (window.location.pathname !== "/login" && window.location.pathname !== "/auth") {
        navigate("/login", { replace: true });
      }
      return;
    }

    // Authoritative verification against PostgreSQL backend
    try {
      const res = await apiFetch("/auth/me");
      if (!res.ok) {
        // Token is invalid or user no longer exists in DB
        localStorage.removeItem("agni_user_name");
        localStorage.removeItem("agni_user_email");
        localStorage.removeItem("agni_user_role");
        localStorage.removeItem("agni_role");
        localStorage.removeItem("agni_user");
        localStorage.removeItem("agni_email");
        localStorage.removeItem("agni_token");
        setUserRole("");
        setUserEmail("");
        setIsAuthReady(true);
        isCheckingRef.current = false;
        if (window.location.pathname !== "/login" && window.location.pathname !== "/auth") {
          navigate("/login", { replace: true });
        }
        return;
      }

      const data = await res.json();
      if (data.success && data.user) {
        const rawRole = data.user.role;
        const mappedRole = ROLE_MAP[rawRole] || rawRole || storedRole;
        setUserRole(mappedRole);
        setUserEmail(data.user.email);
        localStorage.setItem("agni_user", JSON.stringify(data.user));
        if (data.user.fullName || data.user.name) {
          localStorage.setItem("agni_user_name", data.user.fullName || data.user.name);
        }
        if (data.user.branch?.name) {
          localStorage.setItem("agni_user_branch", data.user.branch.name);
        }
        // NOTE: Do not dispatch agni_auth_changed here to prevent recursive loop with the listener
        if (window.location.pathname === "/" || window.location.pathname === "/login" || window.location.pathname === "/auth") {
          const targetPath = rolePathMap[mappedRole] || "/login";
          navigate(targetPath, { replace: true });
        }
      }
    } catch (err) {
      // Network failure fallback
      setUserRole(storedRole);
      setUserEmail(storedEmail);
      if (window.location.pathname === "/" || window.location.pathname === "/login" || window.location.pathname === "/auth") {
        const targetPath = rolePathMap[storedRole] || "/login";
        navigate(targetPath, { replace: true });
      }
    } finally {
      setIsAuthReady(true);
      isCheckingRef.current = false;
    }
  }, [navigate]);

  React.useEffect(() => {
    // Purge mock clients and stale sessions on mount
    clearAllSavedClients();

    if (typeof window !== "undefined") {
      window.clearAllCreatedClients = clearAllSavedClients;
    }

    checkAuth();

    // Listen for global auth changes (like 401 Unauthorized from apiClient)
    const handleAuthChange = () => {
      checkAuth();
    };
    const handleStorageChange = (e) => {
      if (!e || !e.key || e.key === "agni_token" || e.key === "agni_user_role") {
        checkAuth();
      }
    };

    window.addEventListener("agni_auth_changed", handleAuthChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("agni_auth_changed", handleAuthChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [checkAuth]);

  // Manage real-time SSE stream lifecycle based on login status
  React.useEffect(() => {
    const token = localStorage.getItem("agni_token");
    if (token && userRole) {
      initRealtimeService();
    } else {
      closeRealtimeService();
    }
  }, [userRole]);

  const handleLogin = React.useCallback((email, role, token, user = null) => {
    // Clear any stale session before writing the new one so an old
    // cached role or user name can never leak into this login.
    localStorage.removeItem("agni_user_name");
    localStorage.removeItem("agni_user_email");
    localStorage.removeItem("agni_user_role");
    localStorage.removeItem("agni_role");
    localStorage.removeItem("agni_user");
    localStorage.removeItem("agni_user_branch");
    localStorage.removeItem("agni_email");
    localStorage.removeItem("agni_token");

    localStorage.setItem("agni_user_email", email);
    localStorage.setItem("agni_user_role", role);
    if (token) {
      localStorage.setItem("agni_token", token);
      initRealtimeService();
    }
    if (user) {
      localStorage.setItem("agni_user", JSON.stringify(user));
      if (user.fullName || user.name) {
        localStorage.setItem("agni_user_name", user.fullName || user.name);
      }
      if (user.branch?.name) {
        localStorage.setItem("agni_user_branch", user.branch.name);
      }
    }
    
    setUserEmail(email);
    setUserRole(role);
    setIsAuthReady(true);
    window.dispatchEvent(new CustomEvent("agni_auth_changed"));

    const targetPath = rolePathMap[role] || "/login";
    navigate(targetPath, { replace: true });
  }, [navigate]);

  const handleSignOut = React.useCallback(() => {
    closeRealtimeService();
    localStorage.removeItem("agni_user_name");
    localStorage.removeItem("agni_user_email");
    localStorage.removeItem("agni_user_role");
    localStorage.removeItem("agni_role");
    localStorage.removeItem("agni_user");
    localStorage.removeItem("agni_user_branch");
    localStorage.removeItem("agni_email");
    localStorage.removeItem("agni_token");
    setUserRole("");
    setUserEmail("");
    setIsAuthReady(true);
    window.dispatchEvent(new CustomEvent("agni_auth_changed"));
    navigate("/login", { replace: true });
  }, [navigate]);

  if (!isAuthReady) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "transparent" }}>
        <div style={{ width: 38, height: 38, border: "3px solid rgba(99, 102, 241, 0.2)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "transparent" }}>
          <div style={{ width: 38, height: 38, border: "3px solid rgba(99, 102, 241, 0.2)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
        </div>
      }
    >
      <Routes>
      <Route
        path="/login"
        element={<AuthScreen onLogin={handleLogin} />}
      />
      <Route
        path="/auth"
        element={<AuthScreen onLogin={handleLogin} />}
      />

      <Route
        path="/admin/*"
        element={
          userRole === "Admin" ? (
            <AdminDashboard onSignOut={handleSignOut} userEmail={userEmail} />
          ) : (
            <Navigate to={userRole ? (rolePathMap[userRole] || "/login") : "/login"} replace />
          )
        }
      />

      <Route
        path="/owner/*"
        element={
          userRole === "Owner" ? (
            <OwnerDashboard onSignOut={handleSignOut} userEmail={userEmail} />
          ) : (
            <Navigate to={userRole ? (rolePathMap[userRole] || "/login") : "/login"} replace />
          )
        }
      />

      <Route
        path="/branch-manager/*"
        element={
          userRole === "Branch Manager" ? (
            <BranchManagerDashboard onSignOut={handleSignOut} userEmail={userEmail} />
          ) : (
            <Navigate to={userRole ? (rolePathMap[userRole] || "/login") : "/login"} replace />
          )
        }
      />

      <Route
        path="/manager/*"
        element={
          userRole === "Manager" ? (
            <ManagerDashboard onSignOut={handleSignOut} userEmail={userEmail} />
          ) : (
            <Navigate to={userRole ? (rolePathMap[userRole] || "/login") : "/login"} replace />
          )
        }
      />

      <Route
        path="/sales/*"
        element={
          userRole === "Sales Person" ? (
            <SalesDashboard onSignOut={handleSignOut} userEmail={userEmail} />
          ) : (
            <Navigate to={userRole ? (rolePathMap[userRole] || "/login") : "/login"} replace />
          )
        }
      />

      <Route
        path="/marketing/*"
        element={
          userRole === "Marketing" ? (
            <MarketingDashboard onSignOut={handleSignOut} userEmail={userEmail} />
          ) : (
            <Navigate to={userRole ? (rolePathMap[userRole] || "/login") : "/login"} replace />
          )
        }
      />

      <Route
        path="/it/*"
        element={
          userRole === "IT" ? (
            <ITDashboard onSignOut={handleSignOut} userEmail={userEmail} />
          ) : (
            <Navigate to={userRole ? (rolePathMap[userRole] || "/login") : "/login"} replace />
          )
        }
      />

      <Route
        path="/client/*"
        element={
          userRole === "Client" ? (
            <ClientRouteWrapper key={userEmail || "client-route"} userEmail={userEmail} onSignOut={handleSignOut} />
          ) : (
            <Navigate to={userRole ? (rolePathMap[userRole] || "/login") : "/login"} replace />
          )
        }
      />

      <Route
        path="*"
        element={
          <Navigate to={userRole ? (rolePathMap[userRole] || "/login") : "/login"} replace />
        }
      />
      </Routes>
    </Suspense>
  );
}
