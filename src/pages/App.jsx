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
  const docSubmittedKey = `agni_client_doc_submitted_${emailKey}`;

  // "loading" = checking DB, "done" = check complete
  const [status, setStatus] = React.useState("loading");
  const [hasCompletedSetup, setHasCompletedSetup] = React.useState(false);

  React.useEffect(() => {
    if (!emailKey) {
      setHasCompletedSetup(false);
      setStatus("done");
      return;
    }

    // ── Offline / localStorage fast-path ──────────────────────────────────────
    // Check localStorage FIRST for immediate UX. If we find a valid submission
    // flag + data, we can skip the doc form immediately while the DB check runs.
    const localFlag = localStorage.getItem(docSubmittedKey) === "true";
    const localDataRaw = localStorage.getItem(`agni_client_doc_data_${emailKey}`);
    let localHasData = false;
    if (localDataRaw) {
      try {
        const p = JSON.parse(localDataRaw);
        if (p && (p.companyName || p.representativeName || p.panNumber || p.aadharNumber)) {
          localHasData = true;
        }
      } catch (e) { }
    }
    // If localStorage already confirmed submission, show dashboard immediately
    // while the DB check runs in the background (DB result can only confirm or upgrade, never downgrade)
    if (localFlag && localHasData) {
      setHasCompletedSetup(true);
      setStatus("done");
    }

    // ── PostgreSQL authoritative check ────────────────────────────────────────
    // The DB is the source of truth for documentStatus after approval.
    async function checkDbDocumentStatus() {
      const token = localStorage.getItem("agni_token");
      if (!token) {
        // No token — fall back to localStorage result
        if (!(localFlag && localHasData)) {
          setHasCompletedSetup(false);
        }
        setStatus("done");
        return;
      }

      try {
        const res = await apiFetch("/clients/my-profile");

        if (res.ok) {
          const data = await res.json();
          const docStatus = data?.data?.documentStatus;
          // DB says SUBMITTED or VERIFIED → client has filled the form
          if (docStatus === "SUBMITTED" || docStatus === "VERIFIED") {
            // Persist the flag to localStorage so subsequent loads skip the DB check
            localStorage.setItem(docSubmittedKey, "true");
            setHasCompletedSetup(true);
            setStatus("done");
            return;
          }
          // DB says NOT_SUBMITTED → show document form regardless of localStorage state
          if (docStatus === "NOT_SUBMITTED") {
            // Clear any stale localStorage flag to keep state consistent
            localStorage.removeItem(docSubmittedKey);
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
          localStorage.removeItem(docSubmittedKey);
          if (onSignOut) onSignOut();
          window.dispatchEvent(new CustomEvent("agni_auth_changed"));
          return;
        }
      } catch (e) {
        // Network error — fall back to localStorage result already set above
      }

      // DB check failed or returned unexpected status — use localStorage result
      if (!(localFlag && localHasData)) {
        setHasCompletedSetup(false);
      }
      setStatus("done");
    }

    checkDbDocumentStatus();
  }, [emailKey, docSubmittedKey]);

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
          localStorage.setItem(docSubmittedKey, "true");
          setHasCompletedSetup(true);
        }}
      />
    );
  }

  return <ClientDashboard onSignOut={onSignOut} userEmail={userEmail} />;
}


export function clearAllSavedClients() {
  // ── SCOPE: This function ONLY removes mock/test data entries. ─────────────────
  // It must NOT wipe agni_client_doc_submitted_*, agni_client_doc_data_* for real
  // client emails, nor clear agni_sales_clients / agni_branch_clients entirely.
  // PostgreSQL is the source of truth after client approval. localStorage is only
  // used as a read-through cache and for the pending approval queue.

  const MOCK_EMAIL_FRAGMENTS = [
    "121221@gmail.com", "sharmaji@gmail.com", "vanshikayadavji@gmail.com",
    "mishraji@gmail.com",
  ];
  const MOCK_NAME_FRAGMENTS = [
    "workshala", "yash ear", "bright retail", "urban foods", "nova textiles",
    "peak logistics", "crest pharma", "riverstone", "acme", "techsolutions",
    "nexus", "starlight", "zenith", "summit", "horizon",
    "community", "microsoft", "yadav dairy farm", "vanshika",
    "abhishek", "sengar", "bar",
  ];

  const isMockEmail = (email) => {
    if (!email) return false;
    const e = email.trim().toLowerCase();
    return MOCK_EMAIL_FRAGMENTS.some((f) => e.includes(f));
  };

  const isTestItem = (item) => {
    if (!item) return false;
    const str = `${item.company || ""} ${item.name || ""} ${item.companyName || ""} ${item.clientName || ""} ${item.email || ""} ${item.clientEmail || ""}`.toLowerCase();
    return MOCK_NAME_FRAGMENTS.some((m) => str.includes(m)) || isMockEmail(item.email || item.clientEmail || "");
  };

  try {
    // ── Only remove per-email localStorage keys for known mock emails ──────────
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) || "";
      const keyLower = key.toLowerCase();
      // NEVER remove scheme stages, even for mock emails, so testing works
      if (keyLower.includes("agni_scheme_stages_")) continue;

      const isMockKey = MOCK_EMAIL_FRAGMENTS.some((f) => keyLower.includes(f));
      // Also remove kshitiz007 session
      const isStaleSession = keyLower.includes("kshitiz007") || keyLower.includes("community_") || keyLower.includes("microsoft_");
      if (isMockKey || isStaleSession) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));

    // ── Filter mock/test entries from client list caches — preserve real clients ─
    ["agni_sales_clients", "agni_branch_clients", "agni_pending_client_creations",
      "agni_pending_scheme_requests", "agni_sales_invoices", "agni_sales_payments", "agni_clients",
      "agni_client_requests", "agni_client_enrolled_schemes_db"
    ].forEach((listKey) => {
      try {
        const saved = localStorage.getItem(listKey);
        if (!saved) return;
        const parsed = JSON.parse(saved);
        if (!Array.isArray(parsed)) return;

        const filtered = parsed.filter((c) => !isTestItem(c));
        const unique = [];
        filtered.forEach((item) => {
          const isDup = unique.some(
            (u) =>
              (u.id && item.id && String(u.id).toLowerCase() === String(item.id).toLowerCase()) ||
              (u.email && item.email && u.email.trim().toLowerCase() === item.email.trim().toLowerCase() &&
                (u.company || u.name) && (item.company || item.name) &&
                (u.company || u.name).trim().toLowerCase() === (item.company || item.name).trim().toLowerCase())
          );
          if (!isDup) unique.push(item);
        });
        localStorage.setItem(listKey, JSON.stringify(unique));
      } catch (e) { }
    });

    // ── Remove stale kshitiz007 session if active ──────────────────────────────
    try {
      const activeEmail = (localStorage.getItem("agni_user_email") || "").toLowerCase().trim();
      if (activeEmail.includes("kshitiz007")) {
        localStorage.removeItem("agni_token");
        localStorage.removeItem("agni_user_email");
        localStorage.removeItem("agni_user_role");
        localStorage.removeItem("agni_remember_email");
      }
    } catch (e) { }

    repairClientStorageData();

    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new Event("agni_clients_updated"));
    window.dispatchEvent(new Event("agni_pending_updated"));
  } catch (e) { }
}

export default function App() {
  const navigate = useNavigate();

  const [userRole, setUserRole] = React.useState(
    () => localStorage.getItem("agni_user_role") || ""
  );
  const [userEmail, setUserEmail] = React.useState(
    () => localStorage.getItem("agni_user_email") || ""
  );

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

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      window.clearAllCreatedClients = clearAllSavedClients;
    }

    const checkAuth = () => {
      // If user directly visits /auth or /login with an intent to authenticate or switch accounts,
      // allow them to see the auth screen cleanly without forced bounce-back
      if (window.location.pathname === "/auth") {
        localStorage.removeItem("agni_user_email");
        localStorage.removeItem("agni_user_role");
        localStorage.removeItem("agni_role");
        localStorage.removeItem("agni_user");
        localStorage.removeItem("agni_email");
        localStorage.removeItem("agni_token");
        setUserRole("");
        setUserEmail("");
        return;
      }

      const storedRole = localStorage.getItem("agni_user_role");
      const storedEmail = localStorage.getItem("agni_user_email");

      if (storedRole && storedEmail) {
        setUserRole(storedRole);
        setUserEmail(storedEmail);
        if (window.location.pathname === "/" || window.location.pathname === "/login") {
          const targetPath = rolePathMap[storedRole] || "/login";
          navigate(targetPath, { replace: true });
        }
      } else {
        setUserRole("");
        setUserEmail("");
        if (window.location.pathname !== "/login" && window.location.pathname !== "/auth") {
          navigate("/login", { replace: true });
        }
      }
    };

    // Check on initial mount
    checkAuth();

    // Listen for global auth changes (like 401 Unauthorized from apiClient)
    window.addEventListener("agni_auth_changed", checkAuth);
    window.addEventListener("storage", checkAuth);

    return () => {
      window.removeEventListener("agni_auth_changed", checkAuth);
      window.removeEventListener("storage", checkAuth);
    };
  }, [navigate]);

  // Manage real-time SSE stream lifecycle based on login status
  React.useEffect(() => {
    const token = localStorage.getItem("agni_token");
    if (token && userRole) {
      initRealtimeService();
    } else {
      closeRealtimeService();
    }
    return () => {
      // Keep connection alive across route transitions
    };
  }, [userRole]);

  function handleLogin(email, role, token) {
    // Clear any stale session before writing the new one so an old
    // cached role can never leak into this login.
    localStorage.removeItem("agni_user_email");
    localStorage.removeItem("agni_user_role");
    localStorage.removeItem("agni_role");
    localStorage.removeItem("agni_user");
    localStorage.removeItem("agni_email");
    localStorage.removeItem("agni_token");

    localStorage.setItem("agni_user_email", email);
    localStorage.setItem("agni_user_role", role);
    if (token) {
      localStorage.setItem("agni_token", token);
      initRealtimeService();
    }
    
    setUserEmail(email);
    setUserRole(role);
    const targetPath = rolePathMap[role] || "/login";
    navigate(targetPath, { replace: true });
  }

  function handleSignOut() {
    closeRealtimeService();
    localStorage.removeItem("agni_user_email");
    localStorage.removeItem("agni_user_role");
    localStorage.removeItem("agni_role");
    localStorage.removeItem("agni_user");
    localStorage.removeItem("agni_email");
    localStorage.removeItem("agni_token");
    setUserRole("");
    setUserEmail("");
    navigate("/auth");
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
