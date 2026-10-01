import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Icon from "../Icon";
import { apiFetch } from "../../services/apiClient";
import "./NotificationBell.css";

// ── Role-Specific Default Notifications ──
const ROLE_DEFAULT_NOTIFICATIONS = {
  Owner: [
    {
      id: "owner-notif-1",
      title: "High-Value Payment Received",
      detail: "₹1,50,000 received for Zenith Logistics (Tax Invoice #INV-2026-042). Verified by Finance.",
      tone: "green",
      time: "12m ago",
      issuer: "Finance",
      isRead: false,
    },
    {
      id: "owner-notif-2",
      title: "Scheme Request Awaiting Decision",
      detail: "GreenTech Solutions submitted PMEGP scheme application. Awaiting executive sign-off.",
      tone: "coral",
      time: "45m ago",
      issuer: "Sales Ops",
      isRead: false,
    },
    {
      id: "owner-notif-3",
      title: "Branch Target Achieved",
      detail: "West Zone (Mumbai) reached 85% of monthly revenue target (₹1.02 Cr / ₹1.20 Cr).",
      tone: "violet",
      time: "2h ago",
      issuer: "Operations",
      isRead: true,
    },
    {
      id: "owner-notif-4",
      title: "New Client Enrolled",
      detail: "Apex Healthcare AI registered with 3 active service tracks by East Zone team.",
      tone: "green",
      time: "4h ago",
      issuer: "Sales",
      isRead: true,
    },
    {
      id: "owner-notif-5",
      title: "System Compliance & Backup",
      detail: "Quarterly GST & CRM audit reports compiled and ready for review.",
      tone: "blue",
      time: "1d ago",
      issuer: "IT Ops",
      isRead: true,
    },
  ],
  Sales: [
    {
      id: "sales-notif-1",
      title: "Scheme Request Approved",
      detail: "Manager approved PMEGP Scheme for Apex Traders. Client status moved to Active.",
      tone: "green",
      time: "15m ago",
      issuer: "Manager",
      isRead: false,
    },
    {
      id: "sales-notif-2",
      title: "Client Milestone Completed",
      detail: "Client Rajesh Verma (Workshala) reached 'Sanction' stage. 80% milestone reached.",
      tone: "blue",
      time: "1h ago",
      issuer: "Admin",
      isRead: false,
    },
    {
      id: "sales-notif-3",
      title: "New Lead Assigned",
      detail: "4 qualified SME leads in your territory assigned to your sales queue.",
      tone: "violet",
      time: "2h ago",
      issuer: "CRM Dispatch",
      isRead: false,
    },
    {
      id: "sales-notif-4",
      title: "Quota Pace Alert",
      detail: "You are 18% ahead of your monthly quota pace! Keep it up.",
      tone: "amber",
      time: "5h ago",
      issuer: "System",
      isRead: true,
    },
    {
      id: "sales-notif-5",
      title: "Payment Confirmed",
      detail: "Online payment ₹35,000 confirmed for Horizon BioPharma.",
      tone: "green",
      time: "1d ago",
      issuer: "Accounts",
      isRead: true,
    },
  ],
  Manager: [
    {
      id: "manager-notif-1",
      title: "New Scheme Approval Request",
      detail: "Sales Officer submitted PMEGP scheme application for GreenTech Solutions for your approval.",
      tone: "coral",
      time: "10m ago",
      issuer: "Sales Ops",
      isRead: false,
    },
    {
      id: "manager-notif-2",
      title: "Client Registration Review",
      detail: "2 new client onboarding submissions require manager review and assignment.",
      tone: "amber",
      time: "30m ago",
      issuer: "System",
      isRead: false,
    },
    {
      id: "manager-notif-3",
      title: "Rep Quota Milestone",
      detail: "Sales Officer Amit Kumar achieved 100% of monthly sales target (₹80,000).",
      tone: "green",
      time: "3h ago",
      issuer: "Performance",
      isRead: false,
    },
    {
      id: "manager-notif-4",
      title: "Daily Standup Ready",
      detail: "Review today's pipeline agenda and pending approvals before the morning call.",
      tone: "violet",
      time: "5h ago",
      issuer: "Manager Desk",
      isRead: true,
    },
  ],
  "Branch Manager": [
    {
      id: "bm-notif-1",
      title: "Branch Revenue Milestone",
      detail: "Branch achieved ₹94,80,000 (79%) against monthly target of ₹1,20,00,000.",
      tone: "green",
      time: "25m ago",
      issuer: "Branch Finance",
      isRead: false,
    },
    {
      id: "bm-notif-2",
      title: "New Branch Client Onboarded",
      detail: "Metro BioPharma onboarded with 2 active services in West Zone.",
      tone: "blue",
      time: "1h ago",
      issuer: "Sales Team",
      isRead: false,
    },
    {
      id: "bm-notif-3",
      title: "Compliance Audit Passed",
      detail: "Branch Admin verified 14 client documentation files with zero exceptions.",
      tone: "green",
      time: "4h ago",
      issuer: "Admin Dept",
      isRead: true,
    },
    {
      id: "bm-notif-4",
      title: "Inter-Branch Transfer Notice",
      detail: "Client transfer from North Zone completed and assigned to local branch executive.",
      tone: "violet",
      time: "1d ago",
      issuer: "Operations",
      isRead: true,
    },
  ],
  Admin: [
    {
      id: "admin-notif-1",
      title: "Document Verification Queue",
      detail: "3 client profiles (Crest Pharma, Apex Labs) waiting for document verification & KYC audit.",
      tone: "coral",
      time: "18m ago",
      issuer: "Client Portal",
      isRead: false,
    },
    {
      id: "admin-notif-2",
      title: "Digital Agreement Dispatched",
      detail: "Client agreement generated and sent for e-signature for Sun Pharma Ltd.",
      tone: "blue",
      time: "1h ago",
      issuer: "Legal Engine",
      isRead: false,
    },
    {
      id: "admin-notif-3",
      title: "Workflow Stage Updated",
      detail: "Client TechCorp advanced from Reports to Sanction stage (80% complete).",
      tone: "green",
      time: "3h ago",
      issuer: "Pipeline",
      isRead: true,
    },
    {
      id: "admin-notif-4",
      title: "Branch Compliance Alert",
      detail: "GSTIN and PAN verifications cleared for all active clients this week.",
      tone: "violet",
      time: "1d ago",
      issuer: "Compliance",
      isRead: true,
    },
  ],
  Marketing: [
    {
      id: "mkt-notif-1",
      title: "New Marketing Client Onboarded",
      detail: "Apex Healthcare AI enrolled for multi-channel performance ads.",
      tone: "green",
      time: "20m ago",
      issuer: "Acquisitions",
      isRead: false,
    },
    {
      id: "mkt-notif-2",
      title: "Sales Marketing Pitch Received",
      detail: "East branch rep pitched B2B Funnels to Eastern Steel Infra.",
      tone: "coral",
      time: "1h ago",
      issuer: "Sales Ops",
      isRead: false,
    },
    {
      id: "mkt-notif-3",
      title: "Ad Campaign Milestone",
      detail: "Q3 Google & Meta Ads performance campaign crossed 4.2x ROAS target.",
      tone: "violet",
      time: "3h ago",
      issuer: "Analytics",
      isRead: true,
    },
    {
      id: "mkt-notif-4",
      title: "Service Catalog Live",
      detail: "6 enterprise marketing service lines available with 18% GST auto-calc.",
      tone: "blue",
      time: "1d ago",
      issuer: "Catalog Ops",
      isRead: true,
    },
  ],
  IT: [
    {
      id: "it-notif-1",
      title: "Core Services Operational",
      detail: "All CRM Core Services & API Gateways operating at 99.98% SLA uptime.",
      tone: "green",
      time: "10m ago",
      issuer: "System Monitor",
      isRead: false,
    },
    {
      id: "it-notif-2",
      title: "New IT Client Onboarded",
      detail: "Horizon FinTech Labs configured on 24/7 SLA infrastructure retainer.",
      tone: "blue",
      time: "1h ago",
      issuer: "Solutions Arch",
      isRead: false,
    },
    {
      id: "it-notif-3",
      title: "Sales IT Pitch Received",
      detail: "East branch rep pitched Cybersecurity Audit to Bengal BioPharma.",
      tone: "coral",
      time: "2h ago",
      issuer: "Sales Desk",
      isRead: false,
    },
    {
      id: "it-notif-4",
      title: "Security & Database Backup",
      detail: "Automated incremental database snapshot verified and synced to offsite storage.",
      tone: "violet",
      time: "1d ago",
      issuer: "Security Bot",
      isRead: true,
    },
  ],
  Client: [
    {
      id: "client-notif-1",
      title: "CRM Account Active",
      detail: "Your account is verified and operational.",
      tone: "green",
      time: "1h ago",
      issuer: "System",
      isRead: false,
    },
    {
      id: "client-notif-2",
      title: "Service Pipeline Active",
      detail: "Primary consultancy scheme is active and progressing through stages.",
      tone: "blue",
      time: "3h ago",
      issuer: "Operations",
      isRead: true,
    },
  ],
};

function normalizeTone(tone) {
  if (!tone) return "violet";
  if (tone.includes("#10b981") || tone.includes("#88cda4") || tone === "green" || tone === "approval") return "green";
  if (tone.includes("#ef4444") || tone === "red" || tone === "rejection") return "red";
  if (tone.includes("#f59e0b") || tone.includes("#f2aa38") || tone === "amber" || tone === "coral" || tone === "alert") return "coral";
  if (tone.includes("#0ea5e9") || tone.includes("#38bdf8") || tone === "blue" || tone === "info") return "blue";
  return "violet";
}

export default function NotificationBell({
  role = "Owner",
  userEmail = "",
  userName = "",
  branch = "",
  className = "",
  customNotifications = null,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'unread'
  const containerRef = useRef(null);
  const listRef = useRef(null);

  const roleKey = useMemo(() => {
    return (role || "owner").toLowerCase().replace(/\s+/g, "_");
  }, [role]);

  const storageKey = `agni_${roleKey}_notifications`;

  // Initialize notifications from localStorage or defaults
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {}

    // Fallback to role defaults
    const defaults = customNotifications || ROLE_DEFAULT_NOTIFICATIONS[role] || ROLE_DEFAULT_NOTIFICATIONS.Owner;
    return defaults.map((item) => ({
      ...item,
      isRead: item.isRead ?? false,
      tone: normalizeTone(item.tone),
    }));
  });

  // Persist notifications to localStorage
  const persistNotifications = useCallback((updatedList) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(updatedList));
    } catch (e) {}
  }, [storageKey]);

  // Unread count
  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  // Filtered list based on active tab
  const displayedNotifications = useMemo(() => {
    if (activeTab === "unread") {
      return notifications.filter((n) => !n.isRead);
    }
    return notifications;
  }, [notifications, activeTab]);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // ── Sync with Backend API if Token Exists ──
  useEffect(() => {
    const fetchApiNotifs = async () => {
      const token = localStorage.getItem("agni_token");
      if (!token) return;

      try {
        const res = await apiFetch("/notifications");
        if (res.ok) {
          const result = await res.json();
          if (result.success && Array.isArray(result.data) && result.data.length > 0) {
            setNotifications((prev) => {
              const apiItems = result.data.map((item) => ({
                id: item.id,
                title: item.title,
                detail: item.detail,
                issuer: item.issuer || "System",
                tone: normalizeTone(item.tone),
                time: "Recently",
                isRead: !!item.isRead,
                createdAt: item.createdAt,
              }));

              // Merge API items without duplicating existing IDs
              const existingIds = new Set(prev.map((p) => p.id));
              const newItems = apiItems.filter((a) => !existingIds.has(a.id));
              if (newItems.length > 0) {
                const merged = [...newItems, ...prev];
                persistNotifications(merged);
                return merged;
              }
              return prev;
            });
          }
        }
      } catch (e) {
        // Fall back gracefully to localStorage
      }
    };

    fetchApiNotifs();
  }, [persistNotifications]);

  // ── Real-time Event Listeners ──
  useEffect(() => {
    // 1. agni_notifications_updated
    const handleNotifUpdate = (e) => {
      const detail = e?.detail;
      if (!detail) return;
      const newNotif = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        title: detail.title || "New CRM Notification",
        detail: detail.message || detail.detail || "You have an update in your dashboard.",
        issuer: detail.issuer || role,
        tone: normalizeTone(detail.tone || detail.type),
        time: "Just now",
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      setNotifications((prev) => {
        // Prevent exact duplicate in rapid fire
        if (prev.length > 0 && prev[0].title === newNotif.title && prev[0].detail === newNotif.detail) {
          return prev;
        }
        const updated = [newNotif, ...prev.slice(0, 49)];
        persistNotifications(updated);
        return updated;
      });
    };

    // 2. agni_toast_notification
    const handleToast = (e) => {
      const msg = typeof e?.detail === "string" ? e.detail : e?.detail?.message;
      if (!msg) return;

      const newNotif = {
        id: `toast-${Date.now()}`,
        title: "Activity Update",
        detail: msg,
        issuer: "System",
        tone: msg.includes("✓") || msg.includes("success") || msg.includes("approved") ? "green" : msg.includes("✕") || msg.includes("reject") ? "red" : "violet",
        time: "Just now",
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      setNotifications((prev) => {
        if (prev.some((p) => p.detail === msg)) return prev;
        const updated = [newNotif, ...prev.slice(0, 49)];
        persistNotifications(updated);
        return updated;
      });
    };

    // 3. Storage sync across tabs
    const handleStorage = (e) => {
      if (e.key === storageKey) {
        try {
          const parsed = JSON.parse(e.newValue || "[]");
          if (Array.isArray(parsed)) {
            setNotifications(parsed);
          }
        } catch (err) {}
      }
    };

    window.addEventListener("agni_notifications_updated", handleNotifUpdate);
    window.addEventListener("agni_toast_notification", handleToast);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("agni_notifications_updated", handleNotifUpdate);
      window.removeEventListener("agni_toast_notification", handleToast);
      window.removeEventListener("storage", handleStorage);
    };
  }, [role, storageKey, persistNotifications]);

  // ── Handlers ──
  const markAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    setNotifications((prev) => {
      const updated = prev.map((item) => (item.id === id ? { ...item, isRead: true } : item));
      persistNotifications(updated);
      return updated;
    });

    const token = localStorage.getItem("agni_token");
    if (token) {
      try {
        await apiFetch(`/notifications/${id}/read`, { method: "PATCH" });
      } catch (err) {}
    }
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => {
      const updated = prev.map((item) => ({ ...item, isRead: true }));
      persistNotifications(updated);
      return updated;
    });

    const token = localStorage.getItem("agni_token");
    if (token) {
      try {
        await apiFetch("/notifications/all/read", { method: "PATCH" });
      } catch (err) {}
    }
  };

  const dismissNotification = (id, e) => {
    if (e) e.stopPropagation();
    setNotifications((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      persistNotifications(updated);
      return updated;
    });
  };

  const clearAll = () => {
    setNotifications([]);
    persistNotifications([]);
  };

  return (
    <div className={`notification-wrap ${className}`.trim()} ref={containerRef}>
      {/* Bell Trigger Button */}
      <button
        className="notification-trigger-btn"
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={`${role} Notifications`}
        title={`${role} Notifications (${unreadCount} unread)`}
      >
        <Icon name="bell" size={17} />
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <section className="notifications-popover-dropdown" aria-label="Notifications Panel">
          {/* Header */}
          <header className="notif-popover-header">
            <div className="notif-title-row">
              <h2>{role} Alerts</h2>
              {unreadCount > 0 ? (
                <span className="notif-unread-pill">{unreadCount} new</span>
              ) : (
                <span className="notif-all-read-pill">All caught up</span>
              )}
            </div>
            <div className="notif-header-actions">
              {unreadCount > 0 && (
                <button
                  type="button"
                  className="notif-action-btn"
                  onClick={markAllAsRead}
                  title="Mark all notifications as read"
                >
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  className="notif-action-btn secondary"
                  onClick={clearAll}
                  title="Clear all notifications"
                >
                  Clear all
                </button>
              )}
            </div>
          </header>

          {/* Filter Tabs */}
          {notifications.length > 0 && (
            <div className="notif-popover-tabs">
              <button
                type="button"
                className={`notif-tab ${activeTab === "all" ? "active" : ""}`}
                onClick={() => setActiveTab("all")}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                className={`notif-tab ${activeTab === "unread" ? "active" : ""}`}
                onClick={() => setActiveTab("unread")}
              >
                Unread ({unreadCount})
              </button>
            </div>
          )}

          {/* List Scroll */}
          <div className="notif-popover-scroll" ref={listRef}>
            {displayedNotifications.length === 0 ? (
              <div className="notif-empty-state">
                <div className="notif-empty-icon">
                  <Icon name="bell" size={20} />
                </div>
                <h3>No notifications right now</h3>
                <p>
                  {activeTab === "unread"
                    ? "You've read all your notifications!"
                    : "New alerts and real-time activities will appear here."}
                </p>
              </div>
            ) : (
              displayedNotifications.map((notice) => (
                <article
                  key={notice.id}
                  className={`notif-item ${!notice.isRead ? "unread" : ""}`}
                  onClick={() => !notice.isRead && markAsRead(notice.id)}
                >
                  <span className={`notif-tone-dot ${notice.tone || "violet"}`} />
                  <div className="notif-content">
                    <div className="notif-header-line">
                      <h4 className="notif-title">{notice.title}</h4>
                      <time className="notif-time">{notice.time}</time>
                    </div>
                    <p className="notif-detail">{notice.detail}</p>
                    <div className="notif-footer-meta">
                      {notice.issuer && (
                        <span className="notif-issuer-badge">{notice.issuer}</span>
                      )}
                      <div className="notif-item-actions">
                        {!notice.isRead && (
                          <button
                            type="button"
                            className="notif-mark-one-btn"
                            onClick={(e) => markAsRead(notice.id, e)}
                            title="Mark as read"
                          >
                            Mark read
                          </button>
                        )}
                        <button
                          type="button"
                          className="notif-dismiss-btn"
                          onClick={(e) => dismissNotification(notice.id, e)}
                          title="Dismiss notification"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      )}
    </div>
  );
}
