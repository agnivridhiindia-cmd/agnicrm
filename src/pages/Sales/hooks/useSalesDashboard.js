import { useState, useMemo, useRef, useEffect } from "react";
import { notifications as defaultNotifications } from "../mockSalesData";
import { normalizeSalesPersonName } from "../../../utils/branchHelper";
import { apiFetch } from "../../../services/apiClient";
import { useAuth } from "../../../context/AuthContext";

export function useSalesDashboard(userEmail, currentUser = null) {
  const { user, userEmail: authEmail, userName: authName } = useAuth();
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [dark, setDark] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  const [notificationsList, setNotificationsList] = useState(defaultNotifications);

  useEffect(() => {
    async function syncNotifications() {
      try {
        const res = await apiFetch("/notifications");
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            const apiNotifs = json.data.map((n) => ({
              id: n.id,
              title: n.title,
              detail: n.message || n.detail,
              message: n.message,
              time: n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Recent",
              read: n.isRead,
              isRead: n.isRead,
              tone: n.type === "PAYMENT" ? "green" : n.type === "REQUEST" ? "coral" : "blue",
              issuer: "System",
            }));
            setNotificationsList([...apiNotifs, ...defaultNotifications]);
            return;
          }
        }
      } catch (e) {}
    }

    syncNotifications();

    const handleToast = (e) => {
      if (e?.detail) {
        showToast(typeof e.detail === "string" ? e.detail : e.detail.message || "Notification received");
      }
      syncNotifications();
    };

    window.addEventListener("agni_notifications_updated", syncNotifications);
    window.addEventListener("agni_toast_notification", handleToast);
    const interval = setInterval(syncNotifications, 45000);
    return () => {
      window.removeEventListener("agni_notifications_updated", syncNotifications);
      window.removeEventListener("agni_toast_notification", handleToast);
      clearInterval(interval);
    };
  }, []);

  const notificationWrapRef = useRef(null);
  const notificationsListRef = useRef(null);
  const notificationsPauseTimer = useRef(null);

  const salesPersonName = useMemo(() => {
    // 1. Authoritative backend user profile from /auth/me
    if (currentUser?.fullName?.trim()) return currentUser.fullName.trim();
    if (currentUser?.name?.trim()) return currentUser.name.trim();

    // 2. AuthContext active user
    if (user?.fullName?.trim()) return user.fullName.trim();
    if (user?.name?.trim()) return user.name.trim();

    // 3. Stored userName from AuthContext ONLY if valid and not a mismatched fallback
    const activeEmail = (currentUser?.email || userEmail || authEmail || user?.email || "").toLowerCase().trim();
    if (authName && typeof authName === "string" && authName.trim()) {
      const emailPrefix = activeEmail.split("@")[0].toLowerCase();
      // Guard against stale cross-user leakage (e.g. "Ruhi Srivastava" while logged in as "kshitiz")
      const isMismatch = (activeEmail && !emailPrefix.includes("ruhi") && authName.toLowerCase().includes("ruhi")) ||
                         (emailPrefix && !authName.toLowerCase().includes(emailPrefix) && !emailPrefix.includes(authName.toLowerCase().split(" ")[0]));
      if (!isMismatch) {
        return authName.trim();
      }
    }

    // 4. Derive from email address
    if (!activeEmail) return "Sales Representative";
    const normByEmail = normalizeSalesPersonName(activeEmail);
    if (normByEmail && normByEmail !== activeEmail && normByEmail !== "Sales Representative") return normByEmail;
    const raw = activeEmail.split("@")[0];
    const cleaned = raw.replace(/\d+$/, "");
    const parts = cleaned.split(/[^a-zA-Z]+/).filter(Boolean);
    if (!parts.length) return "Sales Representative";
    const parsedName = parts.map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join(" ");
    return normalizeSalesPersonName(parsedName);
  }, [userEmail, authEmail, authName, user, currentUser]);

  const showToast = (message, duration = 5000) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(""), duration);
  };

  // Close notifications on outside click
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

  // Notifications auto-scroller
  useEffect(() => {
    if (!notificationsOpen) return undefined;
    const list = notificationsListRef.current;
    if (!list) return undefined;

    const intervalId = window.setInterval(() => {
      const maxScroll = list.scrollHeight - list.clientHeight;
      if (maxScroll <= 0) return;
      const nextScrollTop = Math.min(list.scrollTop + 76, maxScroll);
      list.scrollTo({ top: nextScrollTop, behavior: "smooth" });
      if (list.scrollTop >= maxScroll - 2) {
        list.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 2600);

    return () => window.clearInterval(intervalId);
  }, [notificationsOpen]);

  // Cleanup pause timer
  useEffect(() => {
    return () => {
      if (notificationsPauseTimer.current) {
        window.clearTimeout(notificationsPauseTimer.current);
      }
    };
  }, []);

  function handleNotificationsListScroll() {
    if (notificationsPauseTimer.current) {
      window.clearTimeout(notificationsPauseTimer.current);
    }
    notificationsPauseTimer.current = window.setTimeout(() => {
      notificationsPauseTimer.current = null;
    }, 3000);
  }

  return {
    activeNav,
    setActiveNav,
    dark,
    setDark,
    searchOpen,
    setSearchOpen,
    notificationsOpen,
    setNotificationsOpen,
    query,
    setQuery,
    toastMessage,
    setToastMessage,
    showToast,
    salesPersonName,
    notificationsList,
    setNotificationsList,
    notificationWrapRef,
    notificationsListRef,
    handleNotificationsListScroll,
  };
}

export default useSalesDashboard;
