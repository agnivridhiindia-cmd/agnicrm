import React, { useState, useEffect } from "react";

export default function ApiErrorToast() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    function handleApiError(event) {
      const { message, status } = event.detail || {};
      const newToast = {
        id: Date.now() + Math.random(),
        message: message || "Backend API request failed.",
        status: status || 0,
      };

      setToasts((prev) => [newToast, ...prev].slice(0, 4));

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 6000);
    }

    window.addEventListener("agni_api_error", handleApiError);
    return () => window.removeEventListener("agni_api_error", handleApiError);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        maxWidth: "380px",
        width: "calc(100vw - 48px)",
        pointerEvents: "none",
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            pointerEvents: "auto",
            background: "#1e1e2d",
            color: "#ffffff",
            borderLeft: "4px solid #f43f5e",
            borderRadius: "12px",
            padding: "12px 16px",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3)",
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
            fontSize: "13px",
            lineHeight: "1.5",
            animation: "fadeInUp 0.3s ease-out forwards",
          }}
        >
          <span style={{ fontSize: "16px", flexShrink: 0, marginTop: "1px" }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <strong style={{ display: "block", color: "#f43f5e", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              API Notice {toast.status ? `(${toast.status})` : ""}
            </strong>
            <span>{toast.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
            style={{
              background: "none",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              fontSize: "14px",
              padding: "0 2px",
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
