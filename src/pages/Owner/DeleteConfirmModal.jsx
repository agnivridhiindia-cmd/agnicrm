import React, { useState } from "react";
import Icon from "../../components/Icon";

export default function DeleteConfirmModal({
  employee,
  onClose,
  onConfirm,
  dark,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!employee) return null;

  const handleConfirm = async () => {
    setLoading(true);
    setError("");
    try {
      await onConfirm(employee);
    } catch (err) {
      setError(err?.message || "Failed to delete employee. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="cem-backdrop" style={{ zIndex: 1200 }}>
      <div
        className={`cem-modal ${dark ? "cem-dark" : ""}`}
        style={{ maxWidth: 480 }}
      >
        <div className="cem-header">
          <div
            className="cem-header-icon"
            style={{
              background: "linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.25))",
              color: "#ef4444",
            }}
          >
            <Icon name="trash" size={20} />
          </div>
          <div className="cem-header-text">
            <h2 className="cem-title" style={{ fontSize: 18, color: "#ef4444" }}>
              Soft-Delete Employee
            </h2>
            <p className="cem-subtitle">
              Move employee to the archived database section.
            </p>
          </div>
          <button
            type="button"
            className="cem-close"
            onClick={onClose}
            disabled={loading}
            aria-label="Close"
          >
            <Icon name="close" size={15} />
          </button>
        </div>

        <div style={{ padding: "0 26px 18px" }}>
          {/* Employee Card Preview */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 14px",
              background: dark ? "rgba(255,255,255,0.04)" : "#f8fafc",
              border: dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
              borderRadius: 12,
              marginBottom: 14,
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                color: "#fff",
                display: "grid",
                placeItems: "center",
                fontWeight: 800,
                fontSize: 15,
                flexShrink: 0,
              }}
            >
              {(employee.name || employee.fullName || "E").substring(0, 2).toUpperCase()}
            </div>
            <div>
              <strong style={{ fontSize: 14, color: dark ? "#f8fafc" : "#0f172a", display: "block" }}>
                {employee.name || employee.fullName}
              </strong>
              <span style={{ fontSize: 12, color: "#64748b" }}>
                {employee.role || employee.rawRole} • {employee.branch || "Branch Lead"}
              </span>
              <span style={{ fontSize: 11.5, color: "#94a3b8", display: "block", marginTop: 2 }}>
                {employee.email}
              </span>
            </div>
          </div>

          {/* Database Preservation Notice */}
          <div
            style={{
              padding: "12px 14px",
              background: dark ? "rgba(99, 102, 241, 0.08)" : "rgba(99, 102, 241, 0.06)",
              border: "1px solid rgba(99, 102, 241, 0.2)",
              borderRadius: 10,
              fontSize: 12.5,
              color: dark ? "#c7d2fe" : "#3730a3",
              lineHeight: 1.5,
              marginBottom: 14,
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <span style={{ color: "#6366f1", fontSize: 16 }}>🛡️</span>
              <div>
                <strong>Safe Archival Guarantee:</strong>
                <p style={{ margin: "2px 0 0", color: dark ? "#94a3b8" : "#475569", fontSize: 12 }}>
                  This action is a <strong>soft delete</strong>. All clients, schemes, and registered services under this employee will be safely captured and stored in the dedicated <strong>Deleted Employees database section</strong>. You can view the full portfolio or restore them anytime.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="cem-error" style={{ marginBottom: 12 }}>
              <Icon name="alert" size={14} />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="cem-footer" style={{ padding: "0 26px 20px" }}>
          <button
            type="button"
            className="cem-btn cem-btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="cem-btn"
            style={{
              background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
              color: "#fff",
              boxShadow: "0 4px 14px rgba(239, 68, 68, 0.35)",
            }}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="cem-spinner" />
                Archiving &amp; Deleting...
              </>
            ) : (
              <>
                <Icon name="trash" size={14} />
                Confirm Soft Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
