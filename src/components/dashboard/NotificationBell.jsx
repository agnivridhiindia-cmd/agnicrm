import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Icon from "../Icon";
import { apiFetch } from "../../services/apiClient";
import "./NotificationBell.css";

// ── Role-Specific Default Notifications (Empty by default: PostgreSQL is source of truth) ──
const ROLE_DEFAULT_NOTIFICATIONS = {
  Owner: [],
  Sales: [],
  Manager: [],
  "Branch Manager": [],
  Admin: [],
  Marketing: [],
  IT: [],
  Client: [],
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
        if (Array.isArray(parsed)) {
          // Filter out any legacy mock notifications with hardcoded mock ids
          const clean = parsed.filter(
            (item) =>
              item &&
              item.id &&
              !String(item.id).startsWith("owner-notif-") &&
              !String(item.id).startsWith("sales-notif-") &&
              !String(item.id).startsWith("manager-notif-") &&
              !String(item.id).startsWith("bm-notif-") &&
              !String(item.id).startsWith("admin-notif-") &&
              !String(item.id).startsWith("mkt-notif-") &&
              !String(item.id).startsWith("it-notif-") &&
              !String(item.id).startsWith("client-notif-")
          );
          return clean;
        }
      }
    } catch (e) {}

    // Fallback: only customNotifications if explicitly provided, else empty array []
    const defaults = customNotifications || [];
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
    let isMounted = true;
    const fetchApiNotifs = async () => {
      const token = localStorage.getItem("agni_token");
      if (!token) {
        if (isMounted) {
          setNotifications([]);
          persistNotifications([]);
        }
        return;
      }

      try {
        const res = await apiFetch("/notifications");
        if (res.ok) {
          const result = await res.json();
          if (result.success && Array.isArray(result.data) && isMounted) {
            const apiItems = result.data.map((item) => ({
              id: item.id,
              title: item.title,
              detail: item.detail || item.message,
              issuer: item.issuer || "System",
              tone: normalizeTone(item.tone),
              time: item.createdAt
                ? new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "Recently",
              isRead: !!item.isRead,
              createdAt: item.createdAt,
            }));

            setNotifications(apiItems);
            persistNotifications(apiItems);
          }
        }
      } catch (e) {
        // Fall back gracefully to localStorage
      }
    };

    fetchApiNotifs();
    const interval = setInterval(fetchApiNotifs, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
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
