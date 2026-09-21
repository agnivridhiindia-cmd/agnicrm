import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../services/apiClient";

export function useApiNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("agni_token");
      if (!token) {
        setNotifications([]);
        setUnreadCount(0);
        setLoading(false);
        return;
      }

      const response = await apiFetch("/notifications");

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setNotifications(result.data);
        setUnreadCount(result.unreadCount || 0);
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Failed to fetch notifications from API:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = async (id = "all") => {
    try {
      await apiFetch(`/notifications/${id}/read`, {
        method: "PATCH",
      });

      fetchNotifications();
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  return { notifications, unreadCount, loading, error, refreshNotifications: fetchNotifications, markAsRead };
}
