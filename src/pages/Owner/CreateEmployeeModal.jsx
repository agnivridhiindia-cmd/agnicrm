import React, { useState, useEffect, useMemo } from "react";
import Icon from "../../components/Icon";
import { apiFetch } from "../../services/apiClient";
import { useAuth } from "../../context/AuthContext";

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
  const { user: authUser, userName: authName } = useAuth() || {};
  const [ownerInfo, setOwnerInfo] = useState(null);
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

  // Fetch branches and managers on mount
  useEffect(() => {
    async function loadBranches() {
      setBranchesLoading(true);
      try {
        const res = await apiFetch("/employees/branches");
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.branches) && data.branches.length > 0) {
            setBranches(data.branches);
            const primary = data.branches[0];
            setForm((prev) => ({
              ...prev,
              branchId: prev.branchId || primary.id,
              region: prev.region || primary.region || "",
            }));
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

    async function loadOwner() {
      try {
        const res = await apiFetch("/auth/users?role=OWNER");
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.users) && data.users.length > 0) {
            setOwnerInfo(data.users[0]);
          }
        }
      } catch (err) {
        console.warn("Could not load owner:", err);
      }
    }

    loadBranches();
    loadManagers();
    loadOwner();
  }, []);

  const resolvedOwner = useMemo(() => {
    let candidate = ownerInfo?.fullName || ownerInfo?.name || authUser?.fullName || authUser?.name || authName;
    if (candidate && candidate.toLowerCase().includes("devika")) {
      candidate = null;
    }
    const ownerName = candidate?.trim() || "Rahul Singh";
    const ownerId = ownerInfo?.id || authUser?.id || "7fbc915f-21ce-479f-a777-4a42812c109e";
    return {
      id: ownerId,
      name: ownerName,
      fullName: `${ownerName} (Owner)`,
      role: "Owner",
    };
  }, [ownerInfo, authUser, authName]);

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
      const primary = branches[0];
      setForm((prev) => ({
        ...prev,
        reportingManagerId: resolvedOwner.id,
        branchId: primary ? primary.id : prev.branchId,
        region: primary ? (primary.region || "") : prev.region,
      }));
      return;
    }

    // Role mapping:
    // Sales Person reports to Sales Manager (MANAGER)
    // Sales Manager, IT, Marketing, Admin report to Branch Manager (BRANCH_MANAGER)
    const targetRole = form.role === "SALES_PERSON" ? "MANAGER" : "BRANCH_MANAGER";

    if (!form.branchId) {
      setForm((prev) =>
        prev.reportingManagerId === resolvedOwner.id || prev.reportingManagerId === "__OWNER__"
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
        prev.reportingManagerId !== "" && prev.reportingManagerId !== resolvedOwner.id && prev.reportingManagerId !== "__OWNER__"
          ? { ...prev, reportingManagerId: "" }
          : prev
      );
    }
  }, [form.role, form.branchId, managers, branches, resolvedOwner.id]);

  // Filter eligible managers for current role:
  // - Sales Person: only Sales Managers (MANAGER)
  // - Sales Manager, IT, Marketing, Admin: only Branch Managers (BRANCH_MANAGER)
  // - Branch Manager: Owner only
  const eligibleManagers = useMemo(() => {
    if (form.role === "BRANCH_MANAGER") {
      return [resolvedOwner];
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
  }, [form.role, form.branchId, managers, resolvedOwner]);

  const selectedManagerObj = useMemo(() => {
    if (form.role === "BRANCH_MANAGER" || form.reportingManagerId === "__OWNER__" || (resolvedOwner.id && form.reportingManagerId === resolvedOwner.id)) {
      return resolvedOwner;
    }
    return managers.find((m) => m.id === form.reportingManagerId) || null;
  }, [form.role, form.reportingManagerId, resolvedOwner, managers]);

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
      let targetBranchId = form.branchId || (branches[0] ? branches[0].id : undefined);

      // If user is on "make a branch" mode and typed a branch name, create it and link (only if not BRANCH_MANAGER)
      if (form.role !== "BRANCH_MANAGER" && branchMode === "make" && newBranch.name.trim()) {
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
        region: form.region.trim() || (branches[0]?.region || undefined),
        reportingManagerId:
          form.role === "BRANCH_MANAGER"
            ? (resolvedOwner.id !== "__OWNER__" ? resolvedOwner.id : undefined)
            : (form.reportingManagerId && form.reportingManagerId !== "__OWNER__" ? form.reportingManagerId : undefined),
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

            {/* Branch Section: Single Operating Branch (Noida Branch) */}
            <div className="cem-field cem-field-wide">
              <label className="cem-label" htmlFor="cem-single-branch">
                Branch Assignment <span className="cem-auto-tag">Single Operating Branch</span>
              </label>
              <div className="cem-input-wrap">
                <span className="cem-input-icon"><Icon name="branches" size={14} /></span>
                <input
                  id="cem-single-branch"
                  className="cem-input"
                  type="text"
                  value={
                    selectedBranch
                      ? `${selectedBranch.name} (${selectedBranch.city || selectedBranch.region})`
                      : branches[0]
                      ? `${branches[0].name} (${branches[0].city || branches[0].region})`
                      : "Noida Branch (Noida, Uttar Pradesh)"
                  }
                  readOnly
                  style={{ background: dark ? "rgba(255,255,255,0.04)" : "#f8fafc", cursor: "default" }}
                />
              </div>
              <p className="cem-field-hint cem-hint-success">
                ✓ Operating under the single company branch ({selectedBranch?.name || branches[0]?.name || "Noida Branch"}).
              </p>
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
                    value={resolvedOwner.id}
                    disabled
                  >
                    <option value={resolvedOwner.id}>{resolvedOwner.fullName}</option>
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
                  ✓ Branch Managers report directly to the Company Owner ({resolvedOwner.name}).
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
