// Real-Time Server-Sent Events (SSE) Client Service for Agni CRM
// Subscribes to real-time events from Express backend (/api/v1/events/stream)
// and updates salesperson, manager, and admin screens immediately without background polling loops.

import { API_BASE_URL } from "./apiClient";

let eventSourceInstance = null;
let reconnectTimer = null;
let reconnectAttempts = 0;

/**
 * Initializes the singleton EventSource connection
 */
export function initRealtimeService() {
  const token = localStorage.getItem("agni_token");
  if (!token) {
    return;
  }

  if (eventSourceInstance && (eventSourceInstance.readyState === EventSource.OPEN || eventSourceInstance.readyState === EventSource.CONNECTING)) {
    return;
  }

  try {
    const streamUrl = `${API_BASE_URL}/events/stream?token=${encodeURIComponent(token)}`;
    const es = new EventSource(streamUrl);
    eventSourceInstance = es;

    es.onopen = () => {
      reconnectAttempts = 0;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      console.log("[SSE] Real-time event stream connected.");
    };

    es.onmessage = (event) => {
      try {
        if (!event.data) return;
        const data = JSON.parse(event.data);

        if (data.type === "CONNECTED") {
          return;
        }

        // Handle Workflow Decisions (Approval / Rejection of Transfers, Edits, Deletions)
        if (data.type === "REQUEST_APPROVED" || data.type === "REQUEST_REJECTED") {
          const payload = data.payload || {};
          const isApproved = data.type === "REQUEST_APPROVED";
          const title = isApproved
            ? `Request ${payload.requestCode || ""} Approved`
            : `Request ${payload.requestCode || ""} Rejected`;
          const msg = isApproved
            ? `✓ ${payload.requestType ? payload.requestType.replace(/_/g, " ") : "Request"} for ${payload.clientName || "Client"} was approved by ${payload.reviewerRole || "Management"}!`
            : `✕ ${payload.requestType ? payload.requestType.replace(/_/g, " ") : "Request"} for ${payload.clientName || "Client"} was rejected: ${payload.managerRemarks || "No remarks"}`;

          // Determine if the current logged-in user is the intended recipient of this personal approval alert
          let isRecipient = true;
          try {
            const rawUser = localStorage.getItem("agni_user");
            const currentUser = rawUser ? JSON.parse(rawUser) : null;
            const currentUserId = currentUser?.id || currentUser?.userId || null;
            const currentUserEmail = (localStorage.getItem("agni_user_email") || currentUser?.email || "").toLowerCase().trim();
            const currentUserRole = (localStorage.getItem("agni_user_role") || currentUser?.role || "").toLowerCase();

            // When the user is a salesperson, ONLY notify the specific representative who owns/requested the client
            if (currentUserRole.includes("sales")) {
              const targetUserIds = [payload.requesterId, payload.targetSalesPersonId].filter(Boolean);
              const targetEmails = [payload.requesterEmail, payload.targetSalesPersonEmail].filter(Boolean).map((e) => e.toLowerCase().trim());

              const matchesId = currentUserId && targetUserIds.some((id) => String(id) === String(currentUserId));
              const matchesEmail = currentUserEmail && targetEmails.some((e) => e === currentUserEmail);

              isRecipient = Boolean(matchesId || matchesEmail);
            }
          } catch (e) {
            isRecipient = true;
          }

          if (isRecipient) {
            // Save notification to local storage for the notification bell
            try {
              const savedNotifs = JSON.parse(localStorage.getItem("agni_sales_notifications") || "[]");
              const newNotif = {
                id: Date.now(),
                title,
                message: msg,
                time: "Just now",
                read: false,
                type: isApproved ? "approval" : "rejection",
                createdAt: new Date().toISOString(),
              };
              localStorage.setItem("agni_sales_notifications", JSON.stringify([newNotif, ...savedNotifs.slice(0, 49)]));
            } catch (e) {}

            // Dispatch notification events ONLY for the intended recipient
            window.dispatchEvent(new CustomEvent("agni_notifications_updated", { detail: { title, message: msg } }));
            window.dispatchEvent(new CustomEvent("agni_toast_notification", { detail: msg }));
          }

          // Always dispatch data update events so live lists/tables remain in sync for all roles
          window.dispatchEvent(new CustomEvent("agni_requests_updated", { detail: payload }));
          window.dispatchEvent(new CustomEvent("agni_clients_updated", { detail: payload }));
          window.dispatchEvent(new CustomEvent("agni_pending_updated", { detail: payload }));
        }

        // Handle Milestone / Stage Progress Updates
        else if (data.type === "MILESTONE_UPDATED") {
          const payload = data.payload || {};
          const msg = `⭐ Milestone Updated: ${payload.clientName || "Client"} reached ${payload.applicationStatus || "Stage"} (${payload.progressPercent || 0}%)`;

          // Only display personal milestone toast if the rep owns the client or is a management role
          let shouldToast = true;
          try {
            const rawUser = localStorage.getItem("agni_user");
            const currentUser = rawUser ? JSON.parse(rawUser) : null;
            const currentUserId = currentUser?.id || currentUser?.userId || null;
            const currentUserRole = (localStorage.getItem("agni_user_role") || currentUser?.role || "").toLowerCase();

            if (currentUserRole.includes("sales") && payload.salesPersonId && currentUserId) {
              shouldToast = String(payload.salesPersonId) === String(currentUserId);
            }
          } catch (e) {
            shouldToast = true;
          }

          if (shouldToast) {
            window.dispatchEvent(new CustomEvent("agni_toast_notification", { detail: msg }));
          }
          window.dispatchEvent(new CustomEvent("agni_clients_updated", { detail: payload }));
          window.dispatchEvent(new CustomEvent("agni_pending_updated", { detail: payload }));
        }

        // Handle Newly Created Requests (e.g. Client secondary scheme application)
        else if (data.type === "REQUEST_CREATED") {
          const payload = data.payload || {};
          window.dispatchEvent(new CustomEvent("agni_requests_updated", { detail: payload }));
          window.dispatchEvent(new CustomEvent("agni_clients_updated", { detail: payload }));
          window.dispatchEvent(new CustomEvent("agni_pending_updated", { detail: payload }));
          window.dispatchEvent(new Event("agni_requests_updated"));
          window.dispatchEvent(new Event("agni_clients_updated"));
          window.dispatchEvent(new Event("agni_pending_updated"));
          window.dispatchEvent(new Event("storage"));
        }

        // Handle Generic Client Record Updates
        else if (data.type === "CLIENT_UPDATED" || data.type === "CLIENT_CREATED" || data.type === "CLIENT_DELETED") {
          window.dispatchEvent(new CustomEvent("agni_clients_updated", { detail: data.payload }));
          window.dispatchEvent(new CustomEvent("agni_pending_updated", { detail: data.payload }));
          window.dispatchEvent(new Event("agni_clients_updated"));
          window.dispatchEvent(new Event("agni_pending_updated"));
          window.dispatchEvent(new Event("storage"));
        }
      } catch (err) {
        console.warn("[SSE] Error handling incoming SSE payload:", err);
      }
    };

    es.onerror = (err) => {
      console.warn("[SSE] Stream disconnected or encountered error:", err);
      // If token expired or unauthorized, close
      const currentToken = localStorage.getItem("agni_token");
      if (!currentToken) {
        closeRealtimeService();
        return;
      }

      // Exponential backoff reconnect
      if (es.readyState === EventSource.CLOSED) {
        closeRealtimeService();
        const backoffMs = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
        reconnectAttempts++;
        reconnectTimer = setTimeout(() => {
          initRealtimeService();
        }, backoffMs);
      }
    };
  } catch (err) {
    console.warn("[SSE] Failed to initialize EventSource:", err);
  }
}

/**
 * Closes the active EventSource connection
 */
export function closeRealtimeService() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (eventSourceInstance) {
    try {
      eventSourceInstance.close();
    } catch (e) {}
    eventSourceInstance = null;
  }
}
