import React, { useState, useEffect } from "react";
import { apiFetch } from "../../services/apiClient";
import Brand from "../../components/Brand";
import Icon from "../../components/Icon";

// ── Official Document Format Rules & Constraints ─────────────────────────────
const CONSTRAINTS = {
  panNumber: {
    clean: (v) => (v || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 10),
    validate: (v) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v || ""),
    hint: "5 letters, 4 digits, 1 letter (e.g. ABCDE1234F)",
    error: "Invalid PAN format. Must be 5 letters, 4 digits, and 1 letter (e.g. ABCDE1234F).",
    placeholder: "e.g. ABCDE1234F",
    pattern: "[A-Z]{5}[0-9]{4}[A-Z]{1}",
    maxLength: 10,
  },
  companyPan: {
    clean: (v) => (v || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 10),
    validate: (v) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v || ""),
    hint: "Corporate PAN: 5 letters, 4 digits, 1 letter (e.g. AAACB1234C)",
    error: "Invalid Company PAN. Must be 5 letters, 4 digits, and 1 letter (e.g. AAACB1234C).",
    placeholder: "e.g. AAACB1234C",
    pattern: "[A-Z]{5}[0-9]{4}[A-Z]{1}",
    maxLength: 10,
  },
  aadharNumber: {
    clean: (v) => {
      const digits = (v || "").replace(/\D/g, "").slice(0, 12);
      return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
    },
    validate: (v) => {
      const raw = (v || "").replace(/\s/g, "");
      return /^[2-9]{1}[0-9]{11}$/.test(raw);
    },
    hint: "12-digit Aadhaar UID without 0 or 1 prefix (e.g. 2345 6789 0123)",
    error: "Invalid Aadhar number. Must be exactly 12 digits (e.g. 2345 6789 0123).",
    placeholder: "e.g. 2345 6789 0123",
    pattern: "[2-9]{1}[0-9]{3}\\s?[0-9]{4}\\s?[0-9]{4}",
    maxLength: 14,
  },
  msmeNumber: {
    clean: (v) => (v || "").toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 19),
    validate: (v) => /^UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{5,8}$/.test((v || "").trim().toUpperCase()),
    hint: "Official Udyam format: UDYAM-XX-00-0000000 (e.g. UDYAM-MH-01-0012345)",
    error: "Invalid MSME format. Must follow UDYAM-XX-00-0000000 (e.g. UDYAM-MH-01-0012345).",
    placeholder: "e.g. UDYAM-MH-01-0012345",
    pattern: "^UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{5,8}$",
    maxLength: 19,
  },
  gstNumber: {
    clean: (v) => (v || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 15),
    validate: (v) => {
      if (!v || !v.trim()) return true;
      return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(v.trim().toUpperCase());
    },
    hint: "15-character GSTIN (e.g. 27ABCDE1234F1Z5) — Optional",
    error: "Invalid GSTIN format. Must be 15 alphanumeric characters (e.g. 27ABCDE1234F1Z5).",
    placeholder: "e.g. 27ABCDE1234F1Z5 (Optional)",
    pattern: "[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}",
    maxLength: 15,
  },
  tanNumber: {
    clean: (v) => (v || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 10),
    validate: (v) => /^[A-Z]{4}[0-9]{5}[A-Z]{1}$/.test(v || ""),
    hint: "10-character TAN: 4 letters, 5 digits, 1 letter (e.g. MUMB12345A)",
    error: "Invalid TAN format. Must be 4 letters, 5 digits, and 1 letter (e.g. MUMB12345A).",
    placeholder: "e.g. MUMB12345A",
    pattern: "[A-Z]{4}[0-9]{5}[A-Z]{1}",
    maxLength: 10,
  },
  cinNumber: {
    clean: (v) => (v || "").replace(/[^a-zA-Z0-9-]/g, "").toUpperCase().slice(0, 21),
    validate: (v, isLlp) => {
      if (!v) return false;
      const val = v.trim().toUpperCase();
      if (isLlp) {
        return /^[A-Z]{3}-[0-9]{4}$|^[A-Z0-9]{7,8}$/.test(val);
      }
      return /^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/.test(val);
    },
    hint: (isLlp) => isLlp ? "LLPIN registration number (e.g. AAA-1234)" : "21-character CIN starting with L or U (e.g. U74999MH2021PTC123456)",
    error: (isLlp) => isLlp ? "Invalid LLPIN. Format: AAA-1234 or 8 alphanumeric characters." : "Invalid CIN. Must be 21 characters starting with L/U (e.g. U74999MH2021PTC123456).",
    placeholder: (isLlp) => isLlp ? "e.g. AAA-1234" : "e.g. U74999MH2021PTC123456",
    maxLength: 21,
  },
  twelveARegNumber: {
    clean: (v) => (v || "").toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 25),
    validate: (v) => (v || "").trim().length >= 4,
    hint: "Income Tax Sec 12A registration number (e.g. 12A-XXXX-YYYY)",
    error: "12A Registration number must be at least 4 characters.",
    placeholder: "e.g. 12A-XXXX-YYYY",
    maxLength: 25,
  },
  eightyGCertNumber: {
    clean: (v) => (v || "").toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 25),
    validate: (v) => (v || "").trim().length >= 4,
    hint: "Income Tax Sec 80G certificate number (e.g. 80G-XXXX-YYYY)",
    error: "80G Certificate number must be at least 4 characters.",
    placeholder: "e.g. 80G-XXXX-YYYY",
    maxLength: 25,
  },
  darpanId: {
    clean: (v) => (v || "").toUpperCase().replace(/[^A-Z0-9/]/g, "").slice(0, 20),
    validate: (v) => /^[A-Z]{2}\/[0-9]{4}\/[0-9]{4,8}$/.test((v || "").trim()),
    hint: "NITI Aayog DARPAN ID: STATE/YEAR/NUMBER (e.g. MH/2021/0123456)",
    error: "Invalid DARPAN ID. Must follow STATE/YEAR/NUMBER format (e.g. MH/2021/0123456).",
    placeholder: "e.g. MH/2021/0123456",
    pattern: "^[A-Z]{2}/[0-9]{4}/[0-9]{4,8}$",
    maxLength: 20,
  },
};

export default function DocumentForm({ email, onComplete, onSignOut }) {
  const [documentData, setDocumentData] = useState({
    companyName: "",
    representativeName: "",
    contactNumber: "",
    address: "",
    businessType: "Proprietorship",
    sector: "Manufacturing",
    companyAge: "1",
    annualTurnover: "",
    fundingRequirement: "",
    companyDescription: "",
    fundingPurpose: "",
    gstNumber: "",
    aadharNumber: "",
    panNumber: "",
    msmeNumber: "",
    companyPan: "",
    tanNumber: "",
    cinNumber: "",
    twelveARegNumber: "",
    eightyGCertNumber: "",
    darpanId: "",
  });

  const [touched, setTouched] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [formErrors, setFormErrors] = useState([]);

  // Auto-fetch profile from database
  useEffect(() => {
    async function fetchDbProfile() {
      try {
        const res = await apiFetch("/clients/my-profile");
        if (res.ok) {
          const data = await res.json();
          const p = data.profile || data?.data || data;
          if (p) {
            setDocumentData((prev) => ({
              ...prev,
              companyName: p.companyName || prev.companyName || "",
              representativeName: p.representativeName || p.contactPerson || p.fullName || prev.representativeName || "Representative",
              contactNumber: p.contactNumber || p.phone || prev.contactNumber || "+91 98765 43210",
              address: p.address || prev.address || "",
              businessType: p.businessType || prev.businessType,
              sector: p.sector || prev.sector,
              companyAge: p.companyAge ? String(p.companyAge) : prev.companyAge,
              annualTurnover: p.annualTurnover ? String(p.annualTurnover) : prev.annualTurnover,
              fundingRequirement: p.fundingRequirement ? String(p.fundingRequirement) : prev.fundingRequirement,
              companyDescription: p.companyDescription || prev.companyDescription,
              fundingPurpose: p.fundingPurpose || prev.fundingPurpose,
              gstNumber: p.gstNumber || prev.gstNumber,
              aadharNumber: p.aadharNumber || prev.aadharNumber,
              panNumber: p.panNumber || prev.panNumber,
              msmeNumber: p.msmeNumber || prev.msmeNumber,
              companyPan: p.companyPan || prev.companyPan,
              tanNumber: p.tanNumber || prev.tanNumber,
              cinNumber: p.cinNumber || prev.cinNumber,
              twelveARegNumber: p.twelveARegNumber || prev.twelveARegNumber,
              eightyGCertNumber: p.eightyGCertNumber || prev.eightyGCertNumber,
              darpanId: p.darpanId || prev.darpanId,
            }));
          }
        }
      } catch (e) { }
    }

    fetchDbProfile();
  }, [email]);

  function updateField(field, value) {
    setDocumentData((current) => ({ ...current, [field]: value }));
  }

  function updateConstrainedField(field, rawValue) {
    const rule = CONSTRAINTS[field];
    const cleaned = rule ? rule.clean(rawValue) : rawValue;
    setDocumentData((current) => ({ ...current, [field]: cleaned }));
  }

  function handleBlur(field) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  const isNewCompany = String(documentData.companyAge) === "0";
  const isCorporateEntity = ["Pvt Ltd", "OPC", "LLP", "Section 8 Company"].includes(documentData.businessType);
  const isNgo = documentData.businessType === "NGO";
  const isLlp = documentData.businessType === "LLP";

  // Cross-check PAN and GSTIN
  const activePan = isCorporateEntity ? documentData.companyPan : documentData.panNumber;
  const gstEntered = (documentData.gstNumber || "").trim();
  const gstPanMismatch = Boolean(
    gstEntered.length === 15 &&
    activePan &&
    activePan.length === 10 &&
    gstEntered.slice(2, 12).toUpperCase() !== activePan.toUpperCase()
  );

  async function submit(event) {
    event.preventDefault();
    setSubmitAttempted(true);

    // Determine required document fields for the active entity type
    const activeDocChecks = isNgo
      ? [
          { field: "panNumber", label: "NGO PAN Number", required: true },
          { field: "twelveARegNumber", label: "12A Registration Number", required: true },
          { field: "eightyGCertNumber", label: "80G Certificate Number", required: true },
          { field: "darpanId", label: "DARPAN Unique ID", required: true },
        ]
      : isCorporateEntity
      ? [
          { field: "companyPan", label: "Company PAN", required: true },
          { field: "tanNumber", label: "TAN Number", required: true },
          { field: "cinNumber", label: isLlp ? "LLPIN" : "Corporate Identity Number (CIN)", required: true },
          { field: "gstNumber", label: "GST Number", required: false },
        ]
      : [
          { field: "panNumber", label: "PAN Number", required: true },
          { field: "aadharNumber", label: "Aadhar Number", required: true },
          { field: "msmeNumber", label: "MSME / Udyam Number", required: true },
          { field: "gstNumber", label: "GST Number", required: false },
        ];

    const errors = [];
    const newTouched = { ...touched };

    activeDocChecks.forEach((item) => {
      newTouched[item.field] = true;
      const rule = CONSTRAINTS[item.field];
      const val = (documentData[item.field] || "").trim();

      if (item.required && !val) {
        errors.push(`${item.label} is mandatory.`);
        return;
      }

      if (val && rule) {
        const isValid = item.field === "cinNumber" ? rule.validate(val, isLlp) : rule.validate(val);
        if (!isValid) {
          const err = typeof rule.error === "function" ? rule.error(isLlp) : rule.error;
          errors.push(`${item.label}: ${err}`);
        }
      }
    });

    setTouched(newTouched);

    if (errors.length > 0) {
      setFormErrors(errors);
      setTimeout(() => {
        const firstErrEl = document.querySelector(".input-error, input:invalid");
        if (firstErrEl) {
          firstErrEl.scrollIntoView({ behavior: "smooth", block: "center" });
          firstErrEl.focus();
        }
      }, 50);
      return;
    }

    setFormErrors([]);

    const payload = {
      companyName: documentData.companyName,
      representativeName: documentData.representativeName,
      contactNumber: documentData.contactNumber,
      address: documentData.address || "",
      businessType: documentData.businessType,
      sector: documentData.sector,
      companyAge: documentData.companyAge,
      annualTurnover: parseFloat(documentData.annualTurnover) || 0,
      fundingRequirement: parseFloat(documentData.fundingRequirement) || 0,
      companyDescription: documentData.companyDescription || "",
      fundingPurpose: documentData.fundingPurpose || "",
      gstNumber: documentData.gstNumber || undefined,
      aadharNumber: documentData.aadharNumber,
      panNumber: documentData.panNumber,
      msmeNumber: documentData.msmeNumber,
      companyPan: documentData.companyPan,
      tanNumber: documentData.tanNumber,
      cinNumber: documentData.cinNumber,
      twelveARegNumber: documentData.twelveARegNumber,
      eightyGCertNumber: documentData.eightyGCertNumber,
      darpanId: documentData.darpanId,
    };

    try {
      const response = await apiFetch("/clients/onboard-profile", {
        method: "POST",
        body: payload,
      });

      if (response.ok) {
        const result = await response.json();
        console.log("✅ Onboarding profile saved directly to PostgreSQL:", result);
      }
    } catch (err) {
      console.warn("Could not save onboarding profile directly to backend DB:", err);
    }

    window.dispatchEvent(new Event("agni_clients_updated"));
    window.dispatchEvent(new Event("agni_requests_updated"));

    if (typeof onComplete === "function") {
      onComplete(documentData);
    }
  }

  function renderDocumentField({ field, label, required = true }) {
    const rule = CONSTRAINTS[field];
    const value = documentData[field] || "";
    const isFieldTouched = touched[field] || submitAttempted;

    let isValid = false;
    let errorText = "";
    let hintText = "";
    let placeholder = "";
    let maxLength = 50;

    if (rule) {
      isValid = field === "cinNumber" ? rule.validate(value, isLlp) : rule.validate(value);
      errorText = typeof rule.error === "function" ? rule.error(isLlp) : rule.error;
      hintText = typeof rule.hint === "function" ? rule.hint(isLlp) : rule.hint;
      placeholder = typeof rule.placeholder === "function" ? rule.placeholder(isLlp) : rule.placeholder;
      maxLength = rule.maxLength || 50;
    }

    const hasError = isFieldTouched && !isValid && (required || value.length > 0);
    const showValid = Boolean(value) && isValid;

    return (
      <label className="field-label" key={field}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>
            {label} {required ? <span className="req-star">*</span> : <span className="opt-tag">(Optional)</span>}
          </span>
          {showValid && (
            <span className="field-valid-badge">
              ✓ Verified Format
            </span>
          )}
        </div>
        <div style={{ position: "relative" }}>
          <input
            name={field}
            value={value}
            onChange={(e) => updateConstrainedField(field, e.target.value)}
            onBlur={() => handleBlur(field)}
            placeholder={placeholder}
            maxLength={maxLength}
            required={required}
            spellCheck="false"
            autoComplete="off"
            className={hasError ? "input-error" : showValid ? "input-valid" : ""}
            style={{
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              fontWeight: value ? "600" : "normal",
              letterSpacing: field === "aadharNumber" ? "1.5px" : "0.5px",
            }}
          />
        </div>
        {hasError ? (
          <span className="field-error-msg">
            ⚠ {errorText}
          </span>
        ) : (
          <span className="field-hint">
            {hintText}
          </span>
        )}
      </label>
    );
  }

  return (
    <main className="auth-page doc-form-page">
      <section className="showcase" aria-label="Client onboarding setup showcase">
        <div className="mesh mesh-one" />
        <div className="mesh mesh-two" />
        <div className="showcase-inner">
          <Brand />
          <div className="showcase-copy">
            <p className="eyebrow">
              <span /> ENTERPRISE ONBOARDING
            </p>
            <h1>Complete your company & funding profile.</h1>
            <p className="lede">
              Provide your business registration, tax IDs, and capital requirements to initialize your client workspace.
            </p>
          </div>
        </div>
      </section>

      <section className="auth-area doc-form-area" aria-labelledby="document-form-title">
        <div className="mobile-brand">
          <Brand />
        </div>

        <div className="auth-panel doc-form-panel">
          <div className="form-intro">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <p className="eyebrow">WELCOME TO AGNI CRM</p>
                <h2 id="document-form-title">Profile & Document Verification</h2>
                <p style={{ margin: "4px 0 0" }}>
                  Signed in as: <strong>{email}</strong>
                </p>
              </div>
              <button
                type="button"
                id="doc-form-signout-btn"
                onClick={() => {
                  if (onSignOut) {
                    onSignOut();
                  } else {
                    localStorage.removeItem("agni_user_email");
                    localStorage.removeItem("agni_user_role");
                    localStorage.removeItem("agni_role");
                    localStorage.removeItem("agni_user");
                    localStorage.removeItem("agni_email");
                    localStorage.removeItem("agni_token");
                    window.location.href = "/auth";
                  }
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#ef4444",
                  background: "rgba(239, 68, 68, 0.08)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(239, 68, 68, 0.15)";
                  e.currentTarget.style.borderColor = "#ef4444";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(239, 68, 68, 0.08)";
                  e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.3)";
                }}
              >
                <Icon name="logout" size={15} />
                Sign Out / Switch Account
              </button>
            </div>
          </div>

          <form onSubmit={submit} autoComplete="off" className="doc-form-grid">
            {/* ── Section 1: Business Profile ── */}
            <div className="doc-section-header">
              <span>01</span>
              <h3>Business Profile</h3>
            </div>

            <div className="form-row-2col">
              <label className="field-label">
                Company Name <span className="req-star">*</span>
                <input
                  name="companyName"
                  value={documentData.companyName}
                  onChange={(e) => updateField("companyName", e.target.value)}
                  placeholder="e.g. Bright Retail Pvt Ltd"
                  minLength={2}
                  maxLength={100}
                  required
                />
              </label>

              <label className="field-label">
                Business Entity Type <span className="req-star">*</span>
                <select
                  name="businessType"
                  value={documentData.businessType}
                  onChange={(e) => updateField("businessType", e.target.value)}
                  required
                >
                  <option value="Proprietorship">Proprietorship</option>
                  <option value="Partnership Firm">Partnership Firm</option>
                  <option value="LLP">LLP (Limited Liability Partnership)</option>
                  <option value="Pvt Ltd">Pvt Ltd (Private Limited)</option>
                  <option value="OPC">OPC (One Person Company)</option>
                  <option value="Section 8 Company">Section 8 Company</option>
                  <option value="Trust">Trust</option>
                  <option value="Society">Society</option>
                  <option value="NGO">NGO (Non-Governmental Organization)</option>
                </select>
              </label>
            </div>

            <label className="field-label" style={{ gridColumn: "1 / -1" }}>
              {isNgo ? "Registered Address" : "Registered Business Address"} {isNgo ? null : <span className="req-star">*</span>}
              <textarea
                name="address"
                rows={2}
                value={documentData.address || ""}
                onChange={(e) => updateField("address", e.target.value)}
                placeholder={isNgo ? "" : "Full registered office address (Street, City, State - Pincode)"}
                required={!isNgo}
              />
            </label>

            <div className="form-row-2col">
              <label className="field-label">
                Industry Sector <span className="req-star">*</span>
                <select
                  name="sector"
                  value={documentData.sector}
                  onChange={(e) => updateField("sector", e.target.value)}
                  required
                >
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Service">Service</option>
                  <option value="Trading & Retail">Trading & Retail</option>
                  <option value="Agriculture & Allied">Agriculture & Allied</option>
                  <option value="IT & Technology">IT & Technology</option>
                </select>
              </label>

              <label className="field-label">
                Company Age (Years) <span className="req-star">*</span>
                <select
                  name="companyAge"
                  value={documentData.companyAge}
                  onChange={(e) => updateField("companyAge", e.target.value)}
                  required
                >
                  <option value="0">0 (New / Startup - Under 1 Year)</option>
                  <option value="1">1 Year</option>
                  <option value="2">2 Years</option>
                  <option value="3">3 Years</option>
                  <option value="4">4 Years</option>
                  <option value="5+">5+ Years</option>
                </select>
              </label>
            </div>

            <div className="form-row-2col">
              {!isNewCompany && (
                <label className="field-label">
                  Annual Turnover (₹) <span className="req-star">*</span>
                  <input
                    type="number"
                    name="annualTurnover"
                    value={documentData.annualTurnover}
                    onChange={(e) => updateField("annualTurnover", e.target.value)}
                    placeholder="e.g. 5000000"
                    min="1"
                    required={!isNewCompany}
                  />
                  <span className="field-hint">
                    Total revenue reported in the last financial year
                  </span>
                </label>
              )}

              <label className="field-label" style={{ gridColumn: isNewCompany ? "1 / -1" : "auto" }}>
                Funding Requirement (₹) <span className="req-star">*</span>
                <input
                  type="number"
                  name="fundingRequirement"
                  value={documentData.fundingRequirement}
                  onChange={(e) => updateField("fundingRequirement", e.target.value)}
                  placeholder="e.g. 2500000"
                  min="1000"
                  required
                />
                <span className="field-hint">
                  Target grant, subsidy, or capital loan required
                </span>
              </label>
            </div>

            {/* ── Section 2: Tax & Identification Numbers ── */}
            <div className="doc-section-header" style={{ marginTop: 12 }}>
              <span>02</span>
              <h3>Government & Tax Identifiers</h3>
            </div>

            {isNgo ? (
              <>
                <div className="form-row-2col">
                  {renderDocumentField({ field: "panNumber", label: "NGO PAN Number", required: true })}
                  {renderDocumentField({ field: "twelveARegNumber", label: "12A Registration Number", required: true })}
                </div>

                <div className="form-row-2col">
                  {renderDocumentField({ field: "eightyGCertNumber", label: "80G Certificate Number", required: true })}
                  {renderDocumentField({ field: "darpanId", label: "DARPAN Unique ID", required: true })}
                </div>
              </>
            ) : isCorporateEntity ? (
              <>
                <div className="form-row-2col">
                  {renderDocumentField({ field: "companyPan", label: "Company PAN", required: true })}
                  {renderDocumentField({ field: "tanNumber", label: "TAN (Tax Deduction Number)", required: true })}
                </div>

                <div className="form-row-2col">
                  {renderDocumentField({
                    field: "cinNumber",
                    label: isLlp ? "LLPIN (LLP Registration)" : "Corporate Identity Number (CIN)",
                    required: true,
                  })}
                  {renderDocumentField({ field: "gstNumber", label: "GST Number", required: false })}
                </div>

                {gstPanMismatch && (
                  <div className="doc-cross-tip">
                    <span>💡</span>
                    <span>
                      <strong>Notice:</strong> Characters 3-12 of GSTIN (<code>{gstEntered.slice(2, 12)}</code>) do not match your Company PAN (<code>{activePan}</code>).
                    </span>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="form-row-2col">
                  {renderDocumentField({ field: "panNumber", label: "PAN Number", required: true })}
                  {renderDocumentField({ field: "aadharNumber", label: "Aadhar Number", required: true })}
                </div>

                <div className="form-row-2col">
                  {renderDocumentField({ field: "msmeNumber", label: "MSME / Udyam Number", required: true })}
                  {renderDocumentField({ field: "gstNumber", label: "GST Number", required: false })}
                </div>

                {gstPanMismatch && (
                  <div className="doc-cross-tip">
                    <span>💡</span>
                    <span>
                      <strong>Notice:</strong> Characters 3-12 of GSTIN (<code>{gstEntered.slice(2, 12)}</code>) do not match your PAN (<code>{activePan}</code>).
                    </span>
                  </div>
                )}
              </>
            )}

            {/* ── Section 3: Business Description & Funding Purpose ── */}
            <div className="doc-section-header" style={{ marginTop: 12 }}>
              <span>03</span>
              <h3>Overview & Purpose</h3>
            </div>

            <label className="field-label">
              Company Description <span className="req-star">*</span>
              <textarea
                name="companyDescription"
                rows={3}
                value={documentData.companyDescription}
                onChange={(e) => updateField("companyDescription", e.target.value)}
                placeholder="Briefly describe your company's core products, services, and operational workflow..."
                minLength={10}
                required
              />
            </label>

            <label className="field-label">
              Capital Deployment & Funding Purpose <span className="req-star">*</span>
              <textarea
                name="fundingPurpose"
                rows={3}
                value={documentData.fundingPurpose}
                onChange={(e) => updateField("fundingPurpose", e.target.value)}
                placeholder="Specify how the required funding will be deployed (e.g. machinery acquisition, working capital expansion, plant setup)..."
                minLength={10}
                required
              />
            </label>

            {formErrors.length > 0 && (
              <div className="doc-form-alert" role="alert">
                <h4>
                  <Icon name="close" size={15} />
                  Document Validation Constraints
                </h4>
                <p style={{ margin: "0 0 6px 0", fontSize: "12px", color: "#7f1d1d" }}>
                  Please correct the following document requirements before submitting:
                </p>
                <ul>
                  {formErrors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <button className="primary-button" type="submit" style={{ marginTop: 12 }}>
              Submit Profile & Launch Dashboard
              <Icon name="arrow" size={18} />
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
