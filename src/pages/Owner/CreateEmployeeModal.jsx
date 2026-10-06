import React, { useState, useEffect, useMemo } from "react";
import Icon from "../../components/Icon";
import { apiFetch } from "../../services/apiClient";

const ROLE_OPTIONS = [
  { value: "BRANCH_MANAGER", label: "Branch Manager" },
  { value: "MANAGER", label: "Sales Manager" },
  { value: "SALES_PERSON", label: "Sales Person" },
  { value: "ADMIN", label: "Admin" },
  { value: "IT", label: "IT Lead" },
  { value: "MARKETING", label: "Marketing" },
];

const ROLE_DESCRIPTIONS = {
  BRANCH_MANAGER: "Oversees an entire branch, manages regional teams and performance.",
  MANAGER: "Manages a sales team, reviews client acquisition and pipeline.",
  SALES_PERSON: "Front-line sales executive handling client accounts directly.",
  ADMIN: "Administrative staff handling documentation and coordination.",
  IT: "IT professional managing technical operations and systems.",
  MARKETING: "Marketing staff handling campaigns and brand outreach.",
};

const DEFAULT_PASSWORD = "password123";

const INITIAL_FORM = {
  fullName: "",
  email: "",
  phone: "",
  role: "SALES_PERSON",
  branchId: "",
  region: "",
  reportingManagerId: "",
};

export default function CreateEmployeeModal({ onClose, onCreated, dark }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [branches, setBranches] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const [step, setStep] = useState(1); // 1=form, 2=success
  const [branchMode, setBranchMode] = useState("choose"); // "choose" | "make"
  const [newBranch, setNewBranch] = useState({ name: "", city: "", region: "" });
  const [branchCreating, setBranchCreating] = useState(false);
  const [branchMessage, setBranchMessage] = useState("");

  // Fetch branches on mount
  useEffect(() => {
    async function loadBranches() {
      setBranchesLoading(true);
      try {
        const res = await apiFetch("/employees/branches");
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.branches)) {
            setBranches(data.branches);
          }
        }
      } catch (err) {
        console.warn("Could not load branches:", err);
      } finally {
        setBranchesLoading(false);
      }
    }

    async function loadManagers() {
      try {
        const res = await apiFetch("/auth/users");
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.users)) {
            const mgrs = data.users.filter((u) => {
              const r = (u.rawRole || u.role || "").toUpperCase();
              return r === "BRANCH_MANAGER" || r === "MANAGER";
            });
            setManagers(mgrs);
          }
        }
      } catch (err) {
        console.warn("Could not load managers:", err);
      }
    }

    loadBranches();
    loadManagers();
  }, []);

  // Auto-fill region when branch is selected
  useEffect(() => {
    if (form.branchId) {
      const branch = branches.find((b) => b.id === form.branchId);
      if (branch) {
        setForm((prev) => ({ ...prev, region: branch.region || "" }));
      }
    }
  }, [form.branchId, branches]);

  // Instantaneously auto-select Reporting Manager based on role and branch:
  // - Sales Person -> Sales Manager (MANAGER) of that branch
  // - Sales Manager -> Branch Manager (BRANCH_MANAGER) of that branch
  // - Branch Manager -> Owner (Direct)
  // - IT / Marketing / Admin -> Branch Manager (BRANCH_MANAGER) of that branch
  useEffect(() => {
    if (form.role === "BRANCH_MANAGER") {
      setForm((prev) =>
        prev.reportingManagerId !== "__OWNER__"
          ? { ...prev, reportingManagerId: "__OWNER__" }
          : prev
      );
      return;
    }

    // Role mapping:
    // Sales Person reports to Sales Manager (MANAGER)
    // Sales Manager, IT, Marketing, Admin report to Branch Manager (BRANCH_MANAGER)
    const targetRole = form.role === "SALES_PERSON" ? "MANAGER" : "BRANCH_MANAGER";

    if (!form.branchId) {
      // If no branch is selected yet, clear reporting manager
      setForm((prev) =>
        prev.reportingManagerId === "__OWNER__"
          ? { ...prev, reportingManagerId: "" }
          : prev
      );
      return;
    }

    const matched = managers.find((m) => {
      const r = (m.rawRole || m.role || "").toUpperCase().replace(/[\s_]+/g, "_");
      return r === targetRole && m.branchId === form.branchId;
    });

    if (matched) {
      setForm((prev) =>
        prev.reportingManagerId !== matched.id
          ? { ...prev, reportingManagerId: matched.id }
          : prev
      );
    } else {
      setForm((prev) =>
        prev.reportingManagerId !== "" && prev.reportingManagerId !== "__OWNER__"
          ? { ...prev, reportingManagerId: "" }
          : prev
      );
    }
  }, [form.role, form.branchId, managers]);

  // Filter eligible managers for current role:
  // - Sales Person: only Sales Managers (MANAGER)
  // - Sales Manager, IT, Marketing, Admin: only Branch Managers (BRANCH_MANAGER)
  // - Branch Manager: Owner only
  const eligibleManagers = useMemo(() => {
    if (form.role === "BRANCH_MANAGER") {
      return [{ id: "__OWNER__", name: "Devika Shah", fullName: "Devika Shah (Owner)", role: "Owner" }];
    }

    const targetRole = form.role === "SALES_PERSON" ? "MANAGER" : "BRANCH_MANAGER";
    const filtered = managers.filter((m) => {
      const r = (m.rawRole || m.role || "").toUpperCase().replace(/[\s_]+/g, "_");
      return r === targetRole;
    });

    if (form.branchId) {
      const branchMatches = filtered.filter((m) => m.branchId === form.branchId);
      const otherMatches = filtered.filter((m) => m.branchId !== form.branchId);
      return [...branchMatches, ...otherMatches];
    }

    return filtered;
  }, [form.role, form.branchId, managers]);

  const selectedManagerObj = useMemo(() => {
    if (form.role === "BRANCH_MANAGER" || form.reportingManagerId === "__OWNER__") {
      return { name: "Devika Shah", fullName: "Devika Shah", role: "Owner" };
    }
    return managers.find((m) => m.id === form.reportingManagerId) || null;
  }, [form.role, form.reportingManagerId, managers]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleNewBranchChange = (e) => {
    const { name, value } = e.target;
    setNewBranch((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleCreateBranchQuick = async (e) => {
    if (e) e.preventDefault();
    if (!newBranch.name.trim()) {
      setError("Please enter a branch name to create.");
      return;
    }
    setBranchCreating(true);
    setError("");
    try {
      const res = await apiFetch("/employees/branches", {
        method: "POST",
        body: {
          name: newBranch.name.trim(),
          city: newBranch.city.trim() || newBranch.name.trim(),
          region: newBranch.region.trim() || newBranch.name.trim(),
        },
      });
      const data = await res.json();
      if (res.ok && data.success && data.branch) {
        setBranches((prev) => {
          const exists = prev.some((b) => b.id === data.branch.id);
          return exists ? prev : [...prev, data.branch];
        });
        setForm((prev) => ({
          ...prev,
          branchId: data.branch.id,
          region: data.branch.region || prev.region,
        }));
        setBranchMessage(`✓ Branch "${data.branch.name}" created and chosen!`);
        setTimeout(() => setBranchMessage(""), 4500);
        setBranchMode("choose");
        setNewBranch({ name: "", city: "", region: "" });
      } else {
        setError(data.message || "Failed to create branch.");
      }
    } catch (err) {
      setError("Network error while creating branch.");
    } finally {
      setBranchCreating(false);
    }
  };

  const validate = () => {
    if (!form.fullName.trim() || form.fullName.trim().length < 2)
      return "Full name must be at least 2 characters.";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      return "Please enter a valid email address.";
    if (!form.role)
      return "Please select a role for the employee.";
    if (form.phone && form.phone.trim() && form.phone.trim().replace(/\D/g, "").length < 8)
      return "Phone number must be at least 8 digits.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");

    try {
      let targetBranchId = form.branchId || undefined;

      // If user is on "make a branch" mode and typed a branch name, create it and link
      if (branchMode === "make" && newBranch.name.trim()) {
        const bRes = await apiFetch("/employees/branches", {
          method: "POST",
          body: {
            name: newBranch.name.trim(),
            city: newBranch.city.trim() || newBranch.name.trim(),
            region: newBranch.region.trim() || newBranch.name.trim(),
          },
        });
        const bData = await bRes.json();
        if (bData.success && bData.branch) {
          targetBranchId = bData.branch.id;
          setBranches((prev) => [...prev, bData.branch]);
        }
      }

      const payload = {
        fullName: form.fullName.trim(),
        email: form.email.toLowerCase().trim(),
        phone: form.phone.trim() || undefined,
        role: form.role,
        branchId: targetBranchId,
        region: form.region.trim() || undefined,
        reportingManagerId:
          form.reportingManagerId && form.reportingManagerId !== "__OWNER__"
            ? form.reportingManagerId
            : undefined,
      };

      const res = await apiFetch("/employees", {
        method: "POST",
        body: payload,
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(data.employee);
        setStep(2);
        if (onCreated) onCreated(data.employee);
      } else {
        setError(data.message || "Failed to create employee. Please try again.");
      }
    } catch (err) {
      setError("Network error — please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const selectedBranch = branches.find((b) => b.id === form.branchId);
  const roleDesc = ROLE_DESCRIPTIONS[form.role] || "";

  // ── SUCCESS SCREEN ──────────────────────────────────────────────────
  if (step === 2 && success) {
    const roleLabel = ROLE_OPTIONS.find((r) => r.value === success.role)?.label || success.role;
    return (
      <div className="cem-backdrop">
        <div className={`cem-modal ${dark ? "cem-dark" : ""}`}>
          {/* Success Header */}
          <div className="cem-success-header">
            <div className="cem-success-icon">
              <Icon name="check" size={30} />
            </div>
            <h2 className="cem-success-title">Employee Created!</h2>
            <p className="cem-success-sub">
              {success.fullName} has been added to the system and can now log in.
            </p>
          </div>

          {/* Credential Card */}
          <div className="cem-cred-card">
            <div className="cem-cred-badge">
              <Icon name="user" size={14} />
              <span>Login Credentials</span>
            </div>
            <div className="cem-cred-grid">
              <div className="cem-cred-item">
                <span className="cem-cred-label">Name</span>
                <span className="cem-cred-value">{success.fullName}</span>
              </div>
              <div className="cem-cred-item">
                <span className="cem-cred-label">Email</span>
                <span className="cem-cred-value cem-mono">{success.email}</span>
              </div>
              <div className="cem-cred-item">
                <span className="cem-cred-label">Role</span>
                <span className="cem-cred-value">{roleLabel}</span>
              </div>
              {success.branch && (
                <div className="cem-cred-item">
                  <span className="cem-cred-label">Branch</span>
                  <span className="cem-cred-value">{success.branch.name}</span>
                </div>
              )}
              {success.reportingManager && (
                <div className="cem-cred-item">
                  <span className="cem-cred-label">Reporting Manager</span>
                  <span className="cem-cred-value">{success.reportingManager}</span>
                </div>
              )}
              <div className="cem-cred-item cem-cred-item-full">
                <span className="cem-cred-label">Default Password</span>
                <div className="cem-password-reveal">
                  <span className="cem-cred-value cem-mono cem-password-text">{DEFAULT_PASSWORD}</span>
                  <span className="cem-pass-note">Employee should change this after first login</span>
                </div>
              </div>
            </div>
          </div>

          <div className="cem-success-actions">
            <button
              type="button"
              className="cem-btn cem-btn-primary"
              onClick={() => {
                setForm(INITIAL_FORM);
                setStep(1);
                setSuccess(null);
              }}
            >
              <Icon name="plus" size={14} />
              Create Another Employee
            </button>
            <button
              type="button"
              className="cem-btn cem-btn-secondary"
              onClick={onClose}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── FORM SCREEN ──────────────────────────────────────────────────────
  return (
    <div className="cem-backdrop">
      <div className={`cem-modal ${dark ? "cem-dark" : ""}`}>
        {/* Header */}
        <div className="cem-header">
          <div className="cem-header-icon">
            <Icon name="employees" size={20} />
          </div>
          <div className="cem-header-text">
            <h2 className="cem-title">Create New Employee</h2>
            <p className="cem-subtitle">
              Add a staff member to the system. They'll receive a default password to log in.
            </p>
          </div>
          <button
            type="button"
            className="cem-close"
            onClick={onClose}
            aria-label="Close"
          >
            <Icon name="close" size={15} />
          </button>
        </div>

        {/* Form */}
        <form className="cem-form" onSubmit={handleSubmit}>

          {/* Section: Personal Info */}
          <div className="cem-section-label">Personal Information</div>
          <div className="cem-form-grid">
            <div className="cem-field">
              <label className="cem-label" htmlFor="cem-fullName">
                Full Name <span className="cem-required">*</span>
              </label>
              <div className="cem-input-wrap">
                <span className="cem-input-icon"><Icon name="user" size={14} /></span>
                <input
                  id="cem-fullName"
                  className="cem-input"
                  type="text"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="e.g. Rahul Sharma"
                  required
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="cem-field">
              <label className="cem-label" htmlFor="cem-email">
                Email Address <span className="cem-required">*</span>
              </label>
              <div className="cem-input-wrap">
                <span className="cem-input-icon"><Icon name="mail" size={14} /></span>
                <input
                  id="cem-email"
                  className="cem-input"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="e.g. rahul@agni.com"
                  required
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="cem-field">
              <label className="cem-label" htmlFor="cem-phone">
                Phone Number
              </label>
              <div className="cem-input-wrap">
                <span className="cem-input-icon"><Icon name="phone" size={14} /></span>
                <input
                  id="cem-phone"
                  className="cem-input"
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="e.g. +91 98765 43210"
                  autoComplete="off"
                />
              </div>
            </div>
          </div>

          {/* Section: Role & Branch */}
          <div className="cem-section-label">Role & Assignment</div>
          <div className="cem-form-grid">
            <div className="cem-field cem-field-wide">
              <label className="cem-label" htmlFor="cem-role">
                Position / Role <span className="cem-required">*</span>
              </label>
              <div className="cem-role-grid">
                {ROLE_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`cem-role-card ${form.role === opt.value ? "cem-role-card-active" : ""}`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={opt.value}
                      checked={form.role === opt.value}
                      onChange={handleChange}
                      style={{ display: "none" }}
                    />
                    <span className="cem-role-name">{opt.label}</span>
                    {form.role === opt.value && (
                      <span className="cem-role-check">✓</span>
                    )}
                  </label>
                ))}
              </div>
              {roleDesc && (
                <p className="cem-role-desc">{roleDesc}</p>
              )}
            </div>

            {/* Branch Section: Choose a Branch vs Make a Branch */}
            <div className="cem-field cem-field-wide">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <label className="cem-label" style={{ margin: 0 }}>
                  Branch Allocation <span className="cem-required">*</span>
                </label>
                {branchMessage && (
                  <span style={{ fontSize: 11.5, color: "#10b981", fontWeight: 700 }}>
                    {branchMessage}
                  </span>
                )}
              </div>

              {/* Segmented Control */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  background: dark ? "rgba(0,0,0,0.25)" : "#e2e8f0",
                  padding: 3,
                  borderRadius: 10,
                  gap: 4,
                  marginBottom: 10,
                }}
              >
                <button
                  type="button"
                  onClick={() => setBranchMode("choose")}
                  style={{
                    padding: "7px 12px",
                    borderRadius: 7,
                    border: "none",
                    fontWeight: branchMode === "choose" ? 700 : 500,
                    fontSize: 12,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    background: branchMode === "choose" ? (dark ? "#334155" : "#ffffff") : "transparent",
                    color: branchMode === "choose" ? (dark ? "#ffffff" : "#0f172a") : "#64748b",
                    boxShadow: branchMode === "choose" ? "0 2px 5px rgba(0,0,0,0.06)" : "none",
                  }}
                >
                  <Icon name="branches" size={13} />
                  <span>Choose a Branch</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBranchMode("make")}
                  style={{
                    padding: "7px 12px",
                    borderRadius: 7,
                    border: "none",
                    fontWeight: branchMode === "make" ? 700 : 500,
                    fontSize: 12,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    background: branchMode === "make" ? (dark ? "#334155" : "#ffffff") : "transparent",
                    color: branchMode === "make" ? (dark ? "#ffffff" : "#0f172a") : "#64748b",
                    boxShadow: branchMode === "make" ? "0 2px 5px rgba(0,0,0,0.06)" : "none",
                  }}
                >
                  <Icon name="plus" size={13} />
                  <span>Make a Branch</span>
                </button>
              </div>

              {/* Mode 1: Choose from existing branches */}
              {branchMode === "choose" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div className="cem-field">
                    <label className="cem-label" htmlFor="cem-branchId">
                      Select Existing Branch
                    </label>
                    <div className="cem-input-wrap">
                      <span className="cem-input-icon"><Icon name="branches" size={14} /></span>
                      <select
                        id="cem-branchId"
                        className="cem-select"
                        name="branchId"
                        value={form.branchId}
                        onChange={handleChange}
                        disabled={branchesLoading}
                      >
                        <option value="">
                          {branchesLoading ? "Loading branches..." : "— Select a branch —"}
                        </option>
                        {branches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({b.city})
                          </option>
                        ))}
                      </select>
                    </div>
                    {selectedBranch && (
                      <p className="cem-field-hint">
                        Region: <strong>{selectedBranch.region}</strong>
                      </p>
                    )}
                  </div>

                  <div className="cem-field">
                    <label className="cem-label" htmlFor="cem-region">
                      Region
                    </label>
                    <div className="cem-input-wrap">
                      <span className="cem-input-icon"><Icon name="branches" size={14} /></span>
                      <input
                        id="cem-region"
                        className="cem-input"
                        type="text"
                        name="region"
                        value={form.region}
                        onChange={handleChange}
                        placeholder="e.g. West Zone"
                        readOnly={!!form.branchId}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Mode 2: Make a branch then choose */}
              {branchMode === "make" && (
                <div
                  style={{
                    background: dark ? "rgba(255,255,255,0.03)" : "#f8fafc",
                    border: dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
                    borderRadius: 12,
                    padding: "14px 16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#6366f1" }}>
                      ✦ Make a new branch and choose it for this employee:
                    </span>
                    <button
                      type="button"
                      onClick={() => setBranchMode("choose")}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#64748b",
                        fontSize: 11.5,
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                    >
                      ← Back to choose branch
                    </button>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: 10 }}>
                    <div className="cem-field">
                      <label className="cem-label" htmlFor="new-branch-name">
                        Branch Name <span className="cem-required">*</span>
                      </label>
                      <div className="cem-input-wrap">
                        <span className="cem-input-icon"><Icon name="branches" size={14} /></span>
                        <input
                          id="new-branch-name"
                          className="cem-input"
                          type="text"
                          name="name"
                          value={newBranch.name}
                          onChange={handleNewBranchChange}
                          placeholder="e.g. Delhi Branch (North Zone)"
                        />
                      </div>
                    </div>

                    <div className="cem-field">
                      <label className="cem-label" htmlFor="new-branch-city">
                        City
                      </label>
                      <div className="cem-input-wrap">
                        <span className="cem-input-icon"><Icon name="mapPin" size={14} /></span>
                        <input
                          id="new-branch-city"
                          className="cem-input"
                          type="text"
                          name="city"
                          value={newBranch.city}
                          onChange={handleNewBranchChange}
                          placeholder="e.g. New Delhi"
                        />
                      </div>
                    </div>

                    <div className="cem-field">
                      <label className="cem-label" htmlFor="new-branch-region">
                        Region
                      </label>
                      <div className="cem-input-wrap">
                        <span className="cem-input-icon"><Icon name="globe" size={14} /></span>
                        <input
                          id="new-branch-region"
                          className="cem-input"
                          type="text"
                          name="region"
                          value={newBranch.region}
                          onChange={handleNewBranchChange}
                          placeholder="e.g. North Zone"
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      onClick={handleCreateBranchQuick}
                      disabled={branchCreating || !newBranch.name.trim()}
                      className="owner-btn-primary"
                      style={{
                        padding: "7px 16px",
                        fontSize: 12,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        opacity: !newBranch.name.trim() ? 0.6 : 1,
                      }}
                    >
                      <Icon name="check" size={13} />
                      <span>{branchCreating ? "Creating..." : "✓ Make & Choose This Branch"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="cem-field">
              <label className="cem-label" htmlFor="cem-reportingManagerId">
                Reporting Manager
                {form.role === "BRANCH_MANAGER" ? (
                  <span className="cem-auto-tag">Direct to Owner</span>
                ) : form.reportingManagerId ? (
                  <span className="cem-auto-tag">Auto-Assigned</span>
                ) : null}
              </label>
              <div className="cem-input-wrap">
                <span className="cem-input-icon"><Icon name="managers" size={14} /></span>
                {form.role === "BRANCH_MANAGER" ? (
                  <select
                    id="cem-reportingManagerId"
                    className="cem-select"
                    name="reportingManagerId"
                    value="__OWNER__"
                    disabled
                  >
                    <option value="__OWNER__">Devika Shah (Owner)</option>
                  </select>
                ) : (
                  <select
                    id="cem-reportingManagerId"
                    className="cem-select"
                    name="reportingManagerId"
                    value={form.reportingManagerId}
                    onChange={handleChange}
                  >
                    <option value="">
                      {form.branchId
                        ? "— Select reporting manager —"
                        : "— Select branch to auto-assign —"}
                    </option>
                    {eligibleManagers.map((m) => {
                      const isSameBranch = form.branchId && m.branchId === form.branchId;
                      return (
                        <option key={m.id} value={m.id}>
                          {m.name || m.fullName} ({m.role}{isSameBranch ? " • Branch Lead" : m.branch ? ` • ${m.branch}` : ""})
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>
              {form.role === "BRANCH_MANAGER" ? (
                <p className="cem-field-hint cem-hint-success">
                  ✓ Branch Managers report directly to the Company Owner (Devika Shah).
                </p>
              ) : selectedManagerObj ? (
                <p className="cem-field-hint cem-hint-success">
                  ✓ Reporting to <strong>{selectedManagerObj.name || selectedManagerObj.fullName}</strong> ({selectedManagerObj.role})
                </p>
              ) : form.branchId ? (
                <p className="cem-field-hint cem-hint-warn">
                  No {form.role === "SALES_PERSON" ? "Sales Manager" : "Branch Manager"} assigned to this branch yet.
                </p>
              ) : (
                <p className="cem-field-hint">
                  Auto-selects as soon as branch is chosen.
                </p>
              )}
            </div>
          </div>

          {/* Default Password Notice */}
          <div className="cem-password-notice">
            <div className="cem-pass-icon">
              <Icon name="checkCircle" size={15} />
            </div>
            <div className="cem-pass-info">
              <strong>Default Password:</strong>
              <span className="cem-pass-code">{DEFAULT_PASSWORD}</span>
              <span className="cem-pass-instruction">
                The employee can change this after their first login via Account Settings.
              </span>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="cem-error">
              <Icon name="alert" size={14} />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="cem-footer">
            <button
              type="button"
              className="cem-btn cem-btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="cem-btn cem-btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="cem-spinner" />
                  Creating...
                </>
              ) : (
                <>
                  <Icon name="plus" size={14} />
                  Create Employee
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
