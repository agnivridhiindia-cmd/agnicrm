import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Icon from "../Icon";
import { apiFetch } from "../../services/apiClient";
import "./UserProfileMenu.css";

export default function UserProfileMenu({
  user = {},
  role = "Staff",
  roleBadge = "",
  initials = "U",
  avatarColor = "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
  onSignOut,
  showToast = (msg) => alert(msg),
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  const menuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  // Lock background scroll when any modal is open
  useEffect(() => {
    if (profileModalOpen || passwordModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [profileModalOpen, passwordModalOpen]);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const [passwordLoading, setPasswordLoading] = useState(false);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      setPasswordError("Please enter your current password.");
      return;
    }
    if (!newPassword) {
      setPasswordError("Please enter a new password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and retype password do not match.");
      return;
    }

    setPasswordLoading(true);
    setPasswordError("");

    try {
      const storedEmail = localStorage.getItem("agni_user_email") || localStorage.getItem("agni_email");
      const activeEmail = user?.email || storedEmail;

      const response = await apiFetch("/auth/change-password", {
        method: "POST",
        body: {
          currentPassword,
          newPassword,
          confirmPassword,
          email: activeEmail,
          role: role,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        setPasswordError(data.message || "Failed to update password. Please check your current password.");
        setPasswordLoading(false);
        return;
      }

      // Success
      setPasswordModalOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordError("");
      setPasswordLoading(false);
      showToast("✓ Password changed successfully! You can now use your new password to log in.");
    } catch (err) {
      console.error("Change password error:", err);
      setPasswordError(err.message || "Failed to connect to server. Please try again.");
      setPasswordLoading(false);
    }
  };

  // Compute password strength
  const getPasswordStrength = () => {
    if (!newPassword) return { score: 0, label: "None", color: "#94a3b8" };
    let score = 0;
    if (newPassword.length >= 8) score += 1;
    if (/[A-Z]/.test(newPassword)) score += 1;
    if (/[0-9]/.test(newPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) score += 1;

    if (score <= 1) return { score: 25, label: "Weak", color: "#f43f5e" };
    if (score === 2 || score === 3) return { score: 70, label: "Medium", color: "#f59e0b" };
    return { score: 100, label: "Strong", color: "#10b981" };
  };

  const strength = getPasswordStrength();

  const storedUser = React.useMemo(() => {
    try {
      const raw = localStorage.getItem("agni_user");
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }, []);

  const resolvedName = user?.name || storedUser?.fullName || "User";
  const resolvedEmail = user?.email || storedUser?.email || localStorage.getItem("agni_user_email") || "";
  const resolvedPhone = user?.phone || storedUser?.phone || "+91 98201 54321";
  const resolvedBranch = (typeof user?.branch === "string" ? user.branch : user?.branch?.name) || storedUser?.branch?.name || (role === "Owner" ? "Global (All Zones)" : "West Zone (Mumbai)");
  const resolvedManager = (typeof user?.reportingManager === "string" ? user.reportingManager : user?.reportingManager?.fullName) || storedUser?.reportingManager?.fullName || (role.toLowerCase().includes("owner") ? "Board of Directors" : role.toLowerCase().includes("branch manager") ? "Enterprise Owner" : "Eli Brooks");

  return (
    <div className="user-profile-menu-container" ref={menuRef} style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      {/* Role Pill Badge Menu Trigger */}
      <button
        type="button"
        className="role-badge"
        onClick={() => setDropdownOpen((prev) => !prev)}
        aria-label="User Profile Menu"
        aria-expanded={dropdownOpen}
      >
        <span>{roleBadge || role || "Profile"}</span>
      </button>

      {/* DROPDOWN MENU */}
      {dropdownOpen && (
        <div
          className="user-profile-dropdown"
          style={{
            position: "absolute",
            top: "calc(100% + 12px)",
            right: 0,
            zIndex: 9999,
            width: 270,
            background: "rgba(255, 255, 255, 0.96)",
            backdropFilter: "blur(28px)",
            WebkitBackdropFilter: "blur(28px)",
            border: "1px solid rgba(154, 116, 233, 0.22)",
            borderRadius: 18,
            boxShadow: "0 20px 48px rgba(15, 23, 42, 0.18), 0 4px 12px rgba(154, 116, 233, 0.12)",
            padding: "14px",
            animation: "slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {/* User Header Summary */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 12, borderBottom: "1px solid rgba(154, 116, 233, 0.14)" }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: avatarColor,
                color: "#ffffff",
                display: "grid",
                placeItems: "center",
                fontWeight: 800,
                fontSize: 14,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <strong style={{ fontSize: 14, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>
                  {resolvedName}
                </strong>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", flexShrink: 0 }} />
              </div>
              <span style={{ fontSize: 11.5, color: "#64748b", display: "block", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {resolvedEmail}
              </span>
            </div>
          </div>

          {/* Menu Items */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 10 }}>
            {/* View Profile */}
            <button
              type="button"
              className="user-profile-menu-item"
              onClick={() => {
                setDropdownOpen(false);
                setProfileModalOpen(true);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "9px 12px",
                border: "none",
                borderRadius: 10,
                background: "transparent",
                color: "#1e293b",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(78, 124, 255, 0.08)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <Icon name="document" size={16} />
              <span>View Profile</span>
            </button>

            {/* Change Password */}
            <button
              type="button"
              className="user-profile-menu-item"
              onClick={() => {
                setDropdownOpen(false);
                setPasswordError("");
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
                setPasswordModalOpen(true);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "9px 12px",
                border: "none",
                borderRadius: 10,
                background: "transparent",
                color: "#1e293b",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(78, 124, 255, 0.08)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <Icon name="settings" size={16} />
              <span>Change Password</span>
            </button>

            {/* Sign Out if provided */}
            {onSignOut && (
              <button
                type="button"
                className="user-profile-menu-item"
                onClick={() => {
                  setDropdownOpen(false);
                  onSignOut();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  padding: "9px 12px",
                  border: "none",
                  borderRadius: 10,
                  background: "transparent",
                  color: "#f43f5e",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  textAlign: "left",
                  marginTop: 4,
                  borderTop: "1px solid rgba(244, 63, 94, 0.15)",
                  paddingTop: 10,
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(244, 63, 94, 0.08)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <Icon name="history" size={16} />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 1. ROLE-SPECIFIC PROFILE MODAL (PORTAL TO DOCUMENT BODY) */}
      {profileModalOpen &&
        createPortal(
          <div
            className="upm-modal-backdrop"
            onClick={() => setProfileModalOpen(false)}
          >
            <div
              className="upm-modal-card hide-scrollbar"
              style={{ maxWidth: 680 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Banner */}
              <div className="upm-modal-header">
                <div className="upm-modal-user-meta">
                  <div
                    className="upm-modal-avatar"
                    style={{ background: avatarColor }}
                  >
                    {initials}
                  </div>
                  <div>
                    <div className="upm-modal-title-row">
                      <h2 className="upm-modal-title">
                        {resolvedName}
                      </h2>
                      <span className="upm-modal-status-badge">
                        <span className="upm-status-dot" />
                        Active Duty
                      </span>
                    </div>
                    <span className="upm-modal-subtitle">
                      {user.designation || role} • Emp ID: {user.empId || (storedUser?.id ? `EMP-${storedUser.id.slice(0, 6).toUpperCase()}` : "EMP-SLS-2024")}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="upm-modal-close-btn"
                  onClick={() => setProfileModalOpen(false)}
                  title="Close modal"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              {/* General Identity & Contact Section */}
              <div style={{ marginBottom: 20 }}>
                <span className="upm-section-kicker">
                  Official Contact &amp; Department Credentials
                </span>
                <div className="upm-grid-2">
                  <div className="upm-subcard">
                    <span className="upm-metric-label">Official Email</span>
                    <strong className="upm-metric-value">
                      {resolvedEmail}
                    </strong>
                  </div>
                  <div className="upm-subcard">
                    <span className="upm-metric-label">Contact Number</span>
                    <strong className="upm-metric-value">
                      {resolvedPhone}
                    </strong>
                  </div>
                  <div className="upm-subcard">
                    <span className="upm-metric-label">Primary Branch / Zone</span>
                    <strong className="upm-metric-value accent-indigo">
                      {resolvedBranch}
                    </strong>
                  </div>
                  <div className="upm-subcard">
                    <span className="upm-metric-label">Reporting Authority</span>
                    <strong className="upm-metric-value">
                      {resolvedManager}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Role-Specific Operational Metrics */}
              <div style={{ marginBottom: 20 }}>
                <span className="upm-section-kicker">
                  {role.toUpperCase()} OPERATIONAL SCOPE &amp; AUTHORIZATION
                </span>

                {/* SALES PROFILE METRICS */}
                {role.toLowerCase().includes("sales") && (
                  <div className="upm-grid-3">
                    <div className="upm-subcard">
                      <span className="upm-metric-label">Quarterly Quota</span>
                      <strong className="upm-metric-value accent-indigo" style={{ fontSize: 16 }}>
                        {user.quota || "₹80,000"}
                      </strong>
                    </div>
                    <div className="upm-subcard">
                      <span className="upm-metric-label">Quota Achieved</span>
                      <strong className="upm-metric-value accent-green" style={{ fontSize: 16 }}>
                        {user.achieved || "₹50,000 (63%)"}
                      </strong>
                    </div>
                    <div className="upm-subcard">
                      <span className="upm-metric-label">Commission Tier</span>
                      <strong className="upm-metric-value accent-amber" style={{ fontSize: 16 }}>
                        Tier 1 (4.5%)
                      </strong>
                    </div>
                  </div>
                )}

                {/* BRANCH MANAGER PROFILE METRICS */}
                {role.toLowerCase().includes("branch manager") && (
                  <div className="upm-grid-3">
                    <div className="upm-subcard">
                      <span className="upm-metric-label">Branch Oversight</span>
                      <strong className="upm-metric-value accent-indigo" style={{ fontSize: 16 }}>
                        {user.branch || "West Zone"}
                      </strong>
                    </div>
                    <div className="upm-subcard">
                      <span className="upm-metric-label">Team Size</span>
                      <strong className="upm-metric-value accent-green" style={{ fontSize: 16 }}>
                        18 Personnel
                      </strong>
                    </div>
                    <div className="upm-subcard">
                      <span className="upm-metric-label">Approval Authority</span>
                      <strong className="upm-metric-value accent-amber" style={{ fontSize: 16 }}>
                        Tier A (Full Reversal)
                      </strong>
                    </div>
                  </div>
                )}

                {/* ADMIN PROFILE METRICS */}
                {role.toLowerCase().includes("admin") && !role.toLowerCase().includes("it") && (
                  <div className="upm-grid-3">
                    <div className="upm-subcard">
                      <span className="upm-metric-label">Audit Clearance</span>
                      <strong className="upm-metric-value accent-indigo" style={{ fontSize: 16 }}>
                        5-Point Milestone Level
                      </strong>
                    </div>
                    <div className="upm-subcard">
                      <span className="upm-metric-label">Registered Schemes</span>
                      <strong className="upm-metric-value accent-green" style={{ fontSize: 16 }}>
                        Scheme A, B, C &amp; D
                      </strong>
                    </div>
                    <div className="upm-subcard">
                      <span className="upm-metric-label">Reversal Authority</span>
                      <strong className="upm-metric-value accent-amber" style={{ fontSize: 16 }}>
                        Petition Mode Only
                      </strong>
                    </div>
                  </div>
                )}

                {/* MANAGER PROFILE METRICS */}
                {role.toLowerCase() === "manager" && (
                  <div className="upm-grid-3">
                    <div className="upm-subcard">
                      <span className="upm-metric-label">Department</span>
                      <strong className="upm-metric-value accent-indigo" style={{ fontSize: 16 }}>
                        Enterprise Sales &amp; CRM
                      </strong>
                    </div>
                    <div className="upm-subcard">
                      <span className="upm-metric-label">Direct Reps</span>
                      <strong className="upm-metric-value accent-green" style={{ fontSize: 16 }}>
                        8 Sales Reps
                      </strong>
                    </div>
                    <div className="upm-subcard">
                      <span className="upm-metric-label">Pipeline Active</span>
                      <strong className="upm-metric-value accent-amber" style={{ fontSize: 16 }}>
                        ₹84,50,000
                      </strong>
                    </div>
                  </div>
                )}

                {/* OWNER PROFILE METRICS */}
                {role.toLowerCase().includes("owner") && (
                  <div className="upm-grid-3">
                    <div className="upm-subcard">
                      <span className="upm-metric-label">Enterprise Access</span>
                      <strong className="upm-metric-value accent-indigo" style={{ fontSize: 16 }}>
                        Global Super Admin
                      </strong>
                    </div>
                    <div className="upm-subcard">
                      <span className="upm-metric-label">Branches Governed</span>
                      <strong className="upm-metric-value accent-green" style={{ fontSize: 16 }}>
                        All Zones (West, North, South)
                      </strong>
                    </div>
                    <div className="upm-subcard">
                      <span className="upm-metric-label">Corporate CIN</span>
                      <strong className="upm-metric-value accent-purple" style={{ fontSize: 16 }}>
                        U74999MH2022PTC123456
                      </strong>
                    </div>
                  </div>
                )}

                {/* IT ADMIN METRICS */}
                {role.toLowerCase().includes("it") && (
                  <div className="upm-grid-3">
                    <div className="upm-subcard">
                      <span className="upm-metric-label">Infrastructure Scope</span>
                      <strong className="upm-metric-value accent-indigo" style={{ fontSize: 16 }}>
                        Cloud, MDM &amp; DevOps
                      </strong>
                    </div>
                    <div className="upm-subcard">
                      <span className="upm-metric-label">Retainers Managed</span>
                      <strong className="upm-metric-value accent-green" style={{ fontSize: 16 }}>
                        14 Enterprise Retainers
                      </strong>
                    </div>
                    <div className="upm-subcard">
                      <span className="upm-metric-label">SLA Uptime</span>
                      <strong className="upm-metric-value accent-green" style={{ fontSize: 16 }}>
                        99.98%
                      </strong>
                    </div>
                  </div>
                )}

                {/* MARKETING LEAD METRICS */}
                {role.toLowerCase().includes("marketing") && (
                  <div className="upm-grid-3">
                    <div className="upm-subcard">
                      <span className="upm-metric-label">Live Campaigns</span>
                      <strong className="upm-metric-value accent-indigo" style={{ fontSize: 16 }}>
                        8 Active Ad Sets
                      </strong>
                    </div>
                    <div className="upm-subcard">
                      <span className="upm-metric-label">Monthly Inflow</span>
                      <strong className="upm-metric-value accent-green" style={{ fontSize: 16 }}>
                        420 MQLs
                      </strong>
                    </div>
                    <div className="upm-subcard">
                      <span className="upm-metric-label">Avg CAC</span>
                      <strong className="upm-metric-value accent-amber" style={{ fontSize: 16 }}>
                        ₹1,850 / Deal
                      </strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Security Clearance */}
              <div className="upm-security-strip">
                <div className="upm-security-status">
                  <Icon name="checkCircle" size={17} style={{ color: "#34d399", flexShrink: 0 }} />
                  <span>
                    Two-Factor Authentication: <strong>Enabled (Hardware &amp; SMS)</strong>
                  </span>
                </div>
                <span className="upm-session-ip-badge">
                  Session IP: 192.168.1.104
                </span>
              </div>

              {/* Footer Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 22, paddingTop: 16, borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
                <button
                  type="button"
                  className="upm-btn-secondary"
                  onClick={() => {
                    setProfileModalOpen(false);
                    setPasswordModalOpen(true);
                  }}
                >
                  Change Password
                </button>
                <button
                  type="button"
                  className="upm-btn-primary"
                  onClick={() => setProfileModalOpen(false)}
                >
                  Done
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* 2. CHANGE PASSWORD MODAL (PORTAL TO DOCUMENT BODY) */}
      {passwordModalOpen &&
        createPortal(
          <div
            className="upm-modal-backdrop"
            onClick={() => setPasswordModalOpen(false)}
          >
            <div
              className="upm-modal-card hide-scrollbar"
              style={{ maxWidth: 480 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="upm-modal-header" style={{ marginBottom: 18 }}>
                <div>
                  <span className="upm-section-kicker" style={{ marginBottom: 4 }}>
                    ACCOUNT SECURITY &amp; CREDENTIALS
                  </span>
                  <h2 className="upm-modal-title" style={{ fontSize: 20 }}>
                    Change Password
                  </h2>
                </div>
                <button
                  type="button"
                  className="upm-modal-close-btn"
                  onClick={() => setPasswordModalOpen(false)}
                  title="Close modal"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              {passwordError && (
                <div className="upm-error-banner">
                  <Icon name="alertCircle" size={16} style={{ flexShrink: 0 }} />
                  <span>{passwordError}</span>
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Current Password */}
                <div className="upm-form-group">
                  <label className="upm-form-label">Current Password</label>
                  <div className="upm-input-wrap">
                    <input
                      type={showCurrent ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="upm-form-input"
                      required
                    />
                    <button
                      type="button"
                      className="upm-input-toggle-btn"
                      onClick={() => setShowCurrent(!showCurrent)}
                    >
                      {showCurrent ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="upm-form-group">
                  <label className="upm-form-label">New Password</label>
                  <div className="upm-input-wrap">
                    <input
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="upm-form-input"
                      required
                    />
                    <button
                      type="button"
                      className="upm-input-toggle-btn"
                      onClick={() => setShowNew(!showNew)}
                    >
                      {showNew ? "Hide" : "Show"}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {newPassword && (
                    <div className="upm-strength-meter">
                      <div className="upm-strength-label-row">
                        <span style={{ color: "#94a3b8" }}>
                          Strength: <strong style={{ color: strength.color }}>{strength.label}</strong>
                        </span>
                        <span style={{ color: strength.color, fontWeight: 700 }}>● {strength.label}</span>
                      </div>
                      <div className="upm-strength-track">
                        <div
                          className="upm-strength-fill"
                          style={{
                            width: `${strength.score}%`,
                            background: strength.color,
                            boxShadow: `0 0 8px ${strength.color}66`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Retype Password */}
                <div className="upm-form-group">
                  <label className="upm-form-label">Retype Password</label>
                  <div className="upm-input-wrap">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Retype new password"
                      className="upm-form-input"
                      required
                    />
                    <button
                      type="button"
                      className="upm-input-toggle-btn"
                      onClick={() => setShowConfirm(!showConfirm)}
                    >
                      {showConfirm ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 10, paddingTop: 14, borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
                  <button
                    type="button"
                    className="upm-btn-secondary"
                    onClick={() => {
                      setPasswordModalOpen(false);
                      setPasswordError("");
                    }}
                    disabled={passwordLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="upm-btn-primary"
                    disabled={passwordLoading}
                  >
                    {passwordLoading ? "Updating Password..." : "Update Password"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
