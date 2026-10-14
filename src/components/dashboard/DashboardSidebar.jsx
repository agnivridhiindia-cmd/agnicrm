import React from "react";
import Icon from "../Icon";
import { apiFetch } from "../../services/apiClient";

export default function DashboardSidebar({
  navItems = [],
  activeNav,
  onNavChange,
  dark,
  onToggleDark,
  onSignOut,
  IconComponent = Icon,
  navLabel = "Dashboard navigation",
  brandMark,
  brandName,
  badges = {},
}) {
  const [hasNewRequest, setHasNewRequest] = React.useState(false);

  const checkPendingRequests = React.useCallback(async () => {
    try {
      const token = localStorage.getItem("agni_token");
      if (!token) return;

      const res = await apiFetch("/requests");
      if (!res.ok) return;

      const result = await res.json();
      if (result.success && Array.isArray(result.data)) {
        const pending = result.data.filter((r) => r.status === "PENDING");
        const lastViewed = Number(localStorage.getItem("agni_last_viewed_requests_time") || 0);

        const hasUnviewed = pending.some((r) => {
          const t = new Date(r.createdAt).getTime();
          return !lastViewed || t > lastViewed;
        });

        if (hasUnviewed || (pending.length > 0 && !lastViewed)) {
          setHasNewRequest(true);
        }
      }
    } catch (e) {
      // Ignore network errors silently
    }
  }, []);

  React.useEffect(() => {
    checkPendingRequests();

    const handleNewRequest = () => {
      if (activeNav?.toLowerCase() !== "requests") {
        setHasNewRequest(true);
      }
    };

    window.addEventListener("agni_new_request_received", handleNewRequest);
    window.addEventListener("agni_requests_updated", checkPendingRequests);

    return () => {
      window.removeEventListener("agni_new_request_received", handleNewRequest);
      window.removeEventListener("agni_requests_updated", checkPendingRequests);
    };
  }, [checkPendingRequests, activeNav]);

  React.useEffect(() => {
    if (activeNav?.toLowerCase() === "requests") {
      setHasNewRequest(false);
      localStorage.setItem("agni_last_viewed_requests_time", Date.now().toString());
    }
  }, [activeNav]);

  const items = navItems.map((item) => {
    if (Array.isArray(item)) {
      const [icon, label] = item;
      return { icon, label };
    }
    return item;
  });

  return (
    <aside className="client-sidebar">
      {/* ── Brand Logo ── */}
      <div className="client-brand">
        <span
          className="client-brand-mark"
          style={{
            background: "#ffffff",
            padding: "2px",
            overflow: "hidden",
            boxShadow: "0 4px 14px rgba(0, 0, 0, 0.18)",
            border: "1px solid rgba(255, 255, 255, 0.6)",
          }}
        >
          {brandMark && typeof brandMark !== "string" ? (
            brandMark
          ) : (
            <img
              src="/icons/icon-192.png"
              alt="Agnivridhi"
              style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "10px" }}
            />
          )}
        </span>
        <span className="client-brand-text">
          {brandName ?? (
            <>
              Agni<span>CRM</span>
            </>
          )}
        </span>
      </div>

      {/* ── Section Label ── */}
      <span className="sidebar-section-label">NAVIGATION</span>

      {/* ── Nav Items ── */}
      <nav aria-label={navLabel}>
        {items.map((item) => {
          const isRequest = item.label?.toLowerCase() === "requests" || item.label?.toLowerCase().includes("request");
          const showDot = badges[item.label] ?? (isRequest ? hasNewRequest : Boolean(item.hasDot || item.badge));

          return (
            <button
              key={item.label}
              type="button"
              className={activeNav === item.label ? "selected" : ""}
              aria-label={item.label}
              aria-current={activeNav === item.label ? "page" : undefined}
              onClick={() => {
                if (isRequest) {
                  setHasNewRequest(false);
                  localStorage.setItem("agni_last_viewed_requests_time", Date.now().toString());
                }
                onNavChange(item.label);
              }}
            >
              <span className="sidebar-nav-icon-wrap">
                <IconComponent name={item.icon} size={18} />
              </span>
              <span>{item.label}</span>
              {showDot && (
                <span
                  className="sidebar-nav-badge-dot"
                  title="New request"
                  aria-label="New request indicator"
                />
              )}
              {activeNav === item.label && <span className="sidebar-active-indicator" />}
            </button>
          );
        })}
      </nav>

      {/* ── Bottom Controls ── */}
      <div className="sidebar-bottom">
        <div className="theme-toggle">
          <span>
            <Icon name="moon" size={15} />
            {dark ? "Light mode" : "Dark mode"}
          </span>
          <button
            className={dark ? "on" : ""}
            onClick={onToggleDark}
            type="button"
            aria-label="Toggle dark mode"
          >
            <i />
          </button>
        </div>
        <button className="sign-out" type="button" onClick={onSignOut}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Sign out
        </button>
      </div>
    </aside>
  );
}
