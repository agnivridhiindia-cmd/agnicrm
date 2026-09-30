import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Icon from "../Icon";
import { apiFetch } from "../../services/apiClient";

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
                  {user.name || "User"}
                </strong>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", flexShrink: 0 }} />
              </div>
              <span style={{ fontSize: 11.5, color: "#64748b", display: "block", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user.email || `${role.toLowerCase().replace(/\s+/g, "")}@agnicrm.com`}
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
            className="admin-modal-backdrop-wrap"
            onClick={() => setProfileModalOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              width: "100vw",
              height: "100vh",
              zIndex: 999999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(15, 23, 42, 0.75)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              padding: "20px 16px",
              animation: "fadeIn 0.2s ease-out",
              boxSizing: "border-box",
            }}
          >
            <div
              className="admin-panel-card admin-modal-card-container hide-scrollbar"
              style={{
                width: "100%",
                maxWidth: 680,
                maxHeight: "90vh",
                overflowY: "auto",
                scrollbarWidth: "none",
                position: "relative",
                animation: "slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.12)",
                padding: "26px 30px",
                margin: "auto",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Banner */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 16,
                      background: avatarColor,
                      color: "#ffffff",
                      display: "grid",
                      placeItems: "center",
                      fontWeight: 800,
                      fontSize: 20,
                      boxShadow: "0 8px 24px rgba(79, 70, 229, 0.35)",
                      border: "2px solid rgba(255, 255, 255, 0.6)",
                    }}
                  >
                    {initials}
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#0f172a" }}>
                        {user.name || "User Profile"}
                      </h2>
                      <span className="admin-badge" style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10b981", fontSize: 11, fontWeight: 750 }}>
                        ● Active Duty
                      </span>
                    </div>
                    <span style={{ fontSize: 12.5, color: "#64748b", marginTop: 2, display: "block" }}>
                      {user.designation || role} • Emp ID: {user.empId || `EMP-${Math.floor(1000 + Math.random() * 9000)}`}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="admin-btn-secondary admin-modal-close-circle"
                  onClick={() => setProfileModalOpen(false)}
                >
                  ✕
                </button>
              </div>

              {/* General Identity & Contact Section */}
              <div style={{ marginBottom: 18 }}>
                <span className="admin-kicker" style={{ fontSize: 11, display: "block", marginBottom: 8 }}>
                  Official Contact &amp; Department Credentials
                </span>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="admin-subcard" style={{ padding: "10px 14px" }}>
                    <span className="admin-modal-metric-label">Official Email</span>
                    <strong style={{ fontSize: 13, marginTop: 2, display: "block", color: "#0f172a" }}>
                      {user.email || `${role.toLowerCase().replace(/\s+/g, "")}@agnicrm.com`}
                    </strong>
                  </div>
                  <div className="admin-subcard" style={{ padding: "10px 14px" }}>
                    <span className="admin-modal-metric-label">Contact Number</span>
                    <strong style={{ fontSize: 13, marginTop: 2, display: "block", color: "#0f172a" }}>
                      {user.phone || "+91 98200 12345"}
                    </strong>
                  </div>
                  <div className="admin-subcard" style={{ padding: "10px 14px" }}>
                    <span className="admin-modal-metric-label">Primary Branch / Zone</span>
                    <strong style={{ fontSize: 13, marginTop: 2, display: "block", color: "#4f46e5" }}>
                      {user.branch || "West Zone (Mumbai)"}
                    </strong>
                  </div>
                  <div className="admin-subcard" style={{ padding: "10px 14px" }}>
                    <span className="admin-modal-metric-label">Reporting Authority</span>
                    <strong style={{ fontSize: 13, marginTop: 2, display: "block", color: "#0f172a" }}>
                      {user.reportingManager || (role === "Owner" ? "Board of Directors" : role === "Branch Manager" ? "Enterprise Owner" : "Branch Manager")}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Role-Specific Operational Metrics */}
              <div style={{ marginBottom: 18 }}>
                <span className="admin-kicker" style={{ fontSize: 11, display: "block", marginBottom: 8 }}>
                  {role.toUpperCase()} OPERATIONAL SCOPE &amp; AUTHORIZATION
                </span>

                {/* SALES PROFILE METRICS */}
                {role.toLowerCase().includes("sales") && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                    <div className="admin-subcard" style={{ padding: "10px 12px" }}>
                      <span className="admin-modal-metric-label">Quarterly Quota</span>
                      <strong style={{ fontSize: 14, color: "#4f46e5", marginTop: 2, display: "block" }}>
                        {user.quota || "₹15,00,000"}
                      </strong>
                    </div>
                    <div className="admin-subcard" style={{ padding: "10px 12px" }}>
                      <span className="admin-modal-metric-label">Quota Achieved</span>
                      <strong style={{ fontSize: 14, color: "#10b981", marginTop: 2, display: "block" }}>
                        {user.achieved || "₹11,40,000 (76%)"}
                      </strong>
                    </div>
                    <div className="admin-subcard" style={{ padding: "10px 12px" }}>
                      <span className="admin-modal-metric-label">Commission Tier</span>
                      <strong style={{ fontSize: 14, color: "#f59e0b", marginTop: 2, display: "block" }}>
                        Tier 1 (4.5%)
                      </strong>
                    </div>
                  </div>
                )}

                {/* BRANCH MANAGER PROFILE METRICS */}
                {role.toLowerCase().includes("branch manager") && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                    <div className="admin-subcard" style={{ padding: "10px 12px" }}>
                      <span className="admin-modal-metric-label">Branch Oversight</span>
                      <strong style={{ fontSize: 14, color: "#4f46e5", marginTop: 2, display: "block" }}>
                        {user.branch || "West Zone"}
                      </strong>
                    </div>
                    <div className="admin-subcard" style={{ padding: "10px 12px" }}>
                      <span className="admin-modal-metric-label">Team Size</span>
                      <strong style={{ fontSize: 14, color: "#10b981", marginTop: 2, display: "block" }}>
                        18 Personnel
                      </strong>
                    </div>
                    <div className="admin-subcard" style={{ padding: "10px 12px" }}>
                      <span className="admin-modal-metric-label">Approval Authority</span>
                      <strong style={{ fontSize: 14, color: "#f59e0b", marginTop: 2, display: "block" }}>
                        Tier A (Full Reversal)
                      </strong>
                    </div>
                  </div>
                )}

                {/* ADMIN PROFILE METRICS */}
                {role.toLowerCase().includes("admin") && !role.toLowerCase().includes("it") && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                    <div className="admin-subcard" style={{ padding: "10px 12px" }}>
                      <span className="admin-modal-metric-label">Audit Clearance</span>
                      <strong style={{ fontSize: 14, color: "#4f46e5", marginTop: 2, display: "block" }}>
                        5-Point Milestone Level
                      </strong>
                    </div>
                    <div className="admin-subcard" style={{ padding: "10px 12px" }}>
                      <span className="admin-modal-metric-label">Registered Schemes</span>
                      <strong style={{ fontSize: 14, color: "#10b981", marginTop: 2, display: "block" }}>
                        Scheme A, B, C &amp; D
                      </strong>
                    </div>
                    <div className="admin-subcard" style={{ padding: "10px 12px" }}>
                      <span className="admin-modal-metric-label">Reversal Authority</span>
                      <strong style={{ fontSize: 14, color: "#f59e0b", marginTop: 2, display: "block" }}>
                        Petition Mode Only
                      </strong>
                    </div>
                  </div>
                )}

                {/* MANAGER PROFILE METRICS */}
                {role.toLowerCase() === "manager" && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                    <div className="admin-subcard" style={{ padding: "10px 12px" }}>
                      <span className="admin-modal-metric-label">Department</span>
                      <strong style={{ fontSize: 14, color: "#4f46e5", marginTop: 2, display: "block" }}>
                        Enterprise Sales &amp; CRM
                      </strong>
                    </div>
                    <div className="admin-subcard" style={{ padding: "10px 12px" }}>
                      <span className="admin-modal-metric-label">Direct Reps</span>
                      <strong style={{ fontSize: 14, color: "#10b981", marginTop: 2, display: "block" }}>
                        8 Sales Reps
                      </strong>
                    </div>
                    <div className="admin-subcard" style={{ padding: "10px 12px" }}>
                      <span className="admin-modal-metric-label">Pipeline Active</span>
                      <strong style={{ fontSize: 14, color: "#f59e0b", marginTop: 2, display: "block" }}>
                        ₹84,50,000
                      </strong>
                    </div>
                  </div>
                )}

                {/* OWNER PROFILE METRICS */}
                {role.toLowerCase().includes("owner") && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                    <div className="admin-subcard" style={{ padding: "10px 12px" }}>
                      <span className="admin-modal-metric-label">Enterprise Access</span>
                      <strong style={{ fontSize: 14, color: "#4f46e5", marginTop: 2, display: "block" }}>
                        Global Super Admin
                      </strong>
                    </div>
                    <div className="admin-subcard" style={{ padding: "10px 12px" }}>
                      <span className="admin-modal-metric-label">Branches Governed</span>
                      <strong style={{ fontSize: 14, color: "#10b981", marginTop: 2, display: "block" }}>
                        All Zones (West, North, South)
                      </strong>
                    </div>
                    <div className="admin-subcard" style={{ padding: "10px 12px" }}>
                      <span className="admin-modal-metric-label">Corporate CIN</span>
                      <strong style={{ fontSize: 14, color: "#8c5ff8", marginTop: 2, display: "block" }}>
                        U74999MH2022PTC123456
                      </strong>
                    </div>
                  </div>
                )}

                {/* IT ADMIN METRICS */}
                {role.toLowerCase().includes("it") && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                    <div className="admin-subcard" style={{ padding: "10px 12px" }}>
                      <span className="admin-modal-metric-label">Infrastructure Scope</span>
                      <strong style={{ fontSize: 14, color: "#4f46e5", marginTop: 2, display: "block" }}>
                        Cloud, MDM &amp; DevOps
                      </strong>
                    </div>
                    <div className="admin-subcard" style={{ padding: "10px 12px" }}>
                      <span className="admin-modal-metric-label">Retainers Managed</span>
                      <strong style={{ fontSize: 14, color: "#10b981", marginTop: 2, display: "block" }}>
                        14 Enterprise Retainers
                      </strong>
                    </div>
                    <div className="admin-subcard" style={{ padding: "10px 12px" }}>
                      <span className="admin-modal-metric-label">SLA Uptime</span>
                      <strong style={{ fontSize: 14, color: "#10b981", marginTop: 2, display: "block" }}>
                        99.98%
                      </strong>
                    </div>
                  </div>
                )}

                {/* MARKETING LEAD METRICS */}
                {role.toLowerCase().includes("marketing") && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                    <div className="admin-subcard" style={{ padding: "10px 12px" }}>
                      <span className="admin-modal-metric-label">Live Campaigns</span>
                      <strong style={{ fontSize: 14, color: "#4f46e5", marginTop: 2, display: "block" }}>
                        8 Active Ad Sets
                      </strong>
                    </div>
                    <div className="admin-subcard" style={{ padding: "10px 12px" }}>
                      <span className="admin-modal-metric-label">Monthly Inflow</span>
                      <strong style={{ fontSize: 14, color: "#10b981", marginTop: 2, display: "block" }}>
                        420 MQLs
                      </strong>
                    </div>
                    <div className="admin-subcard" style={{ padding: "10px 12px" }}>
                      <span className="admin-modal-metric-label">Avg CAC</span>
                      <strong style={{ fontSize: 14, color: "#f59e0b", marginTop: 2, display: "block" }}>
                        ₹1,850 / Deal
                      </strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Security Clearance */}
              <div className="admin-subcard" style={{ padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon name="checkCircle" size={16} />
                  <span style={{ fontSize: 12, color: "#64748b" }}>
                    Two-Factor Authentication: <strong style={{ color: "#10b981" }}>Enabled (Hardware &amp; SMS)</strong>
                  </span>
                </div>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>
                  Session IP: 192.168.1.104
                </span>
              </div>

              {/* Footer Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={() => {
                    setProfileModalOpen(false);
                    setPasswordModalOpen(true);
                  }}
                >
                  Change Password
                </button>
                <button
                  type="button"
                  className="admin-btn-primary"
                  onClick={() => setProfileModalOpen(false)}
                  style={{ padding: "8px 24px" }}
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
            className="admin-modal-backdrop-wrap"
            onClick={() => setPasswordModalOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              width: "100vw",
              height: "100vh",
              zIndex: 999999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(15, 23, 42, 0.75)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              padding: "20px 16px",
              animation: "fadeIn 0.2s ease-out",
              boxSizing: "border-box",
            }}
          >
            <div
              className="admin-panel-card admin-modal-card-container hide-scrollbar"
              style={{
                width: "100%",
                maxWidth: 480,
                padding: "26px 30px",
                maxHeight: "90vh",
                overflowY: "auto",
                scrollbarWidth: "none",
                position: "relative",
                animation: "slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.12)",
                margin: "auto",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <span className="admin-kicker" style={{ fontSize: 11, display: "block", marginBottom: 4 }}>
                    ACCOUNT SECURITY &amp; CREDENTIALS
                  </span>
                  <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: "#0f172a" }}>
                    Change Password
                  </h2>
                </div>
                <button
                  type="button"
                  className="admin-btn-secondary admin-modal-close-circle"
                  onClick={() => setPasswordModalOpen(false)}
                >
                  ✕
                </button>
              </div>

              {passwordError && (
                <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(244, 63, 94, 0.1)", border: "1px solid rgba(244, 63, 94, 0.3)", color: "#f43f5e", fontSize: 12.5, marginBottom: 14 }}>
                  {passwordError}
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Current Password */}
                <div>
                  <label className="admin-form-label" style={{ marginBottom: 5 }}>Current Password</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showCurrent ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="admin-form-input"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 12 }}
                    >
                      {showCurrent ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="admin-form-label" style={{ marginBottom: 5 }}>New Password</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="admin-form-input"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 12 }}
                    >
                      {showNew ? "Hide" : "Show"}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {newPassword && (
                    <div style={{ marginTop: 6 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, marginBottom: 4 }}>
                        <span style={{ color: "#64748b" }}>Strength: <strong style={{ color: strength.color }}>{strength.label}</strong></span>
                        <span style={{ color: strength.color }}>● {strength.label}</span>
                      </div>
                      <div style={{ height: 4, width: "100%", background: "rgba(0,0,0,0.06)", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${strength.score}%`, background: strength.color, transition: "all 0.25s ease" }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Retype Password */}
                <div>
                  <label className="admin-form-label" style={{ marginBottom: 5 }}>Retype Password</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Retype new password"
                      className="admin-form-input"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 12 }}
                    >
                      {showConfirm ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                  <button
                    type="button"
                    className="admin-btn-secondary"
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
                    className="admin-btn-primary"
                    style={{ padding: "8px 20px" }}
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
