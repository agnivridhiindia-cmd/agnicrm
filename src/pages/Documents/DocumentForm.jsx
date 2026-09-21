import React, { useState, useEffect } from "react";
import { apiFetch } from "../../services/apiClient";
import Brand from "../../components/Brand";
import Icon from "../../components/Icon";

export default function DocumentForm({ email, onComplete }) {
  const emailKey = email || "default";

  const [documentData, setDocumentData] = useState(() => {
    const saved = localStorage.getItem(`agni_doc_temp_${emailKey}`);
    return saved
      ? JSON.parse(saved)
      : {
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
      };
  });

  useEffect(() => {
    localStorage.setItem(`agni_doc_temp_${emailKey}`, JSON.stringify(documentData));
  }, [documentData, emailKey]);

  // Auto-fetch Contact Person and Phone Number from Salesperson CRM creation entry
  useEffect(() => {
    let fetchedRep = "";
    let fetchedPhone = "";
    let fetchedCompany = "";
    let fetchedAddress = "";

    try {
      const savedSales = localStorage.getItem("agni_sales_clients") || localStorage.getItem("agni_branch_clients");
      if (savedSales) {
        const parsed = JSON.parse(savedSales);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const match = parsed.find((c) => c.email && email && c.email.toLowerCase() === email.toLowerCase());
          if (match) {
            fetchedRep = match.contactPerson || match.name || match.representativeName || "";
            fetchedPhone = match.phone || match.contactNumber || "";
            fetchedCompany = match.company || match.companyName || "";
            fetchedAddress = match.address || "";
          }
        }
      }
    } catch (e) { }

    async function fetchDbProfile() {
      try {
        const res = await apiFetch("/clients/my-profile");
        if (res.ok) {
          const data = await res.json();
          const p = data.profile || data;
          if (p) {
            if (p.contactPerson || p.fullName) fetchedRep = p.contactPerson || p.fullName;
            if (p.phone) fetchedPhone = p.phone;
            if (p.companyName) fetchedCompany = p.companyName;
            if (p.address) fetchedAddress = p.address;
          }
        }
      } catch (e) { }

      setDocumentData((prev) => ({
        ...prev,
        representativeName: prev.representativeName || fetchedRep || "Representative",
        contactNumber: prev.contactNumber || fetchedPhone || "+91 98765 43210",
        companyName: prev.companyName || fetchedCompany || prev.companyName,
        address: prev.address || fetchedAddress || "",
      }));
    }

    fetchDbProfile();
  }, [email]);

  function updateField(field, value) {
    setDocumentData((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();

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

    localStorage.setItem(`agni_client_doc_data_${emailKey}`, JSON.stringify(documentData));
    localStorage.setItem(`agni_client_doc_data_${emailKey.toLowerCase()}`, JSON.stringify(documentData));
    localStorage.setItem("agni_client_doc_data_active", JSON.stringify(documentData));
    localStorage.setItem(`agni_client_doc_submitted_${emailKey}`, "true");
    localStorage.setItem(`agni_client_doc_submitted_${emailKey.toLowerCase()}`, "true");
    localStorage.removeItem(`agni_doc_temp_${emailKey}`);

    // Update the localStorage client cache with the submitted doc data.
    // IMPORTANT: Only UPDATE existing records — never create new ones here.
    // PostgreSQL has the authoritative client record. The localStorage list is
    // only a read-through cache. If the client isn't found in localStorage,
    // it will appear after the next DB fetch in useSalesClients.
    try {
      ["agni_sales_clients", "agni_branch_clients"].forEach((storageKey) => {
        let list = [];
        try {
          const savedList = localStorage.getItem(storageKey);
          if (savedList) list = JSON.parse(savedList);
        } catch (e) { }
        if (!Array.isArray(list)) list = [];

        const idx = list.findIndex(
          (c) =>
            (c.email && email && c.email.toLowerCase() === email.toLowerCase()) ||
            (c.company && documentData.companyName && c.company.toLowerCase() === documentData.companyName.toLowerCase()) ||
            (c.name && documentData.companyName && c.name.toLowerCase() === documentData.companyName.toLowerCase())
        );

        if (idx >= 0) {
          // UPDATE existing — preserve all ownership fields from the existing record
          list[idx] = {
            ...list[idx],
            // Only update the fields the client filled in the document form
            company: documentData.companyName || list[idx].company,
            companyName: documentData.companyName || list[idx].companyName,
            name: documentData.companyName || list[idx].name,
            contactPerson: documentData.representativeName || list[idx].contactPerson,
            representativeName: documentData.representativeName || list[idx].representativeName,
            phone: documentData.contactNumber || list[idx].phone,
            contactNumber: documentData.contactNumber || list[idx].contactNumber,
            address: documentData.address || list[idx].address,
            gstNumber: documentData.gstNumber || list[idx].gstNumber,
            gstin: documentData.gstNumber || list[idx].gstin,
            panNumber: documentData.panNumber || documentData.companyPan || list[idx].panNumber,
            fundingRequirement: parseFloat(documentData.fundingRequirement) || list[idx].fundingRequirement || 0,
            requiredAmount: parseFloat(documentData.fundingRequirement) || list[idx].requiredAmount || 0,
            fundingPurpose: documentData.fundingPurpose || list[idx].fundingPurpose,
            companyDescription: documentData.companyDescription || list[idx].companyDescription,
            documentData: documentData,
            // ── Preserve ownership fields exactly — never overwrite ─────────
            owner: list[idx].owner,
            ownerEmail: list[idx].ownerEmail,
            salesPerson: list[idx].salesPerson,
            salesPersonEmail: list[idx].salesPersonEmail,
            salesperson: list[idx].salesperson,
            salespersonEmail: list[idx].salespersonEmail,
            salesRep: list[idx].salesRep,
            branch: list[idx].branch,
            branchCode: list[idx].branchCode,
            region: list[idx].region,
            salesManager: list[idx].salesManager,
            salesManagerEmail: list[idx].salesManagerEmail,
          };
          localStorage.setItem(storageKey, JSON.stringify(list));
        }
        // If idx < 0: client not in localStorage yet — skip. PostgreSQL has the
        // record and useSalesClients will fetch it from DB on next load.
      });
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new Event("agni_clients_updated"));
    } catch (e) {
      console.warn("Could not sync DocumentForm data to sales client storage:", e);
    }


    if (typeof onComplete === "function") {
      onComplete(documentData);
    }
  }

  const isNewCompany = String(documentData.companyAge) === "0";
  const isCorporateEntity = ["Pvt Ltd", "OPC", "LLP", "Section 8 Company"].includes(documentData.businessType);
  const isNgo = documentData.businessType === "NGO";

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
            <p className="eyebrow">WELCOME TO AGNI CRM</p>
            <h2 id="document-form-title">Profile & Document Verification</h2>
            <p>
              Signed in as: <strong>{email}</strong>
            </p>
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
                    required={!isNewCompany}
                  />
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
                  required
                />
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
                  <label className="field-label">
                    NGO PAN Number <span className="req-star">*</span>
                    <input
                      name="panNumber"
                      value={documentData.panNumber || ""}
                      onChange={(e) => updateField("panNumber", e.target.value.toUpperCase())}
                      placeholder="e.g. ABCDE1234F"
                      maxLength={10}
                      required={isNgo}
                    />
                  </label>

                  <label className="field-label">
                    12A Registration Number <span className="req-star">*</span>
                    <input
                      name="twelveARegNumber"
                      value={documentData.twelveARegNumber || ""}
                      onChange={(e) => updateField("twelveARegNumber", e.target.value.toUpperCase())}
                      placeholder="e.g. 12A-XXXX-YYYY"
                      required={isNgo}
                    />
                  </label>
                </div>

                <div className="form-row-2col">
                  <label className="field-label">
                    80G Certificate Number <span className="req-star">*</span>
                    <input
                      name="eightyGCertNumber"
                      value={documentData.eightyGCertNumber || ""}
                      onChange={(e) => updateField("eightyGCertNumber", e.target.value.toUpperCase())}
                      placeholder="e.g. 80G-XXXX-YYYY"
                      required={isNgo}
                    />
                  </label>

                  <label className="field-label">
                    DARPAN Unique ID <span className="req-star">*</span>
                    <input
                      name="darpanId"
                      value={documentData.darpanId || ""}
                      onChange={(e) => updateField("darpanId", e.target.value.toUpperCase())}
                      placeholder="e.g. MH/2021/0123456"
                      required={isNgo}
                    />
                  </label>
                </div>
              </>
            ) : isCorporateEntity ? (
              <>
                <div className="form-row-2col">
                  <label className="field-label">
                    Company PAN <span className="req-star">*</span>
                    <input
                      name="companyPan"
                      value={documentData.companyPan || ""}
                      onChange={(e) => updateField("companyPan", e.target.value.toUpperCase())}
                      placeholder="e.g. AAACB1234C"
                      maxLength={10}
                      required={isCorporateEntity}
                    />
                  </label>

                  <label className="field-label">
                    TAN (Tax Deduction Number) <span className="req-star">*</span>
                    <input
                      name="tanNumber"
                      value={documentData.tanNumber || ""}
                      onChange={(e) => updateField("tanNumber", e.target.value.toUpperCase())}
                      placeholder="e.g. MUMB12345A"
                      maxLength={10}
                      required={isCorporateEntity}
                    />
                  </label>
                </div>

                <div className="form-row-2col">
                  <label className="field-label">
                    Corporate Identity Number (CIN) <span className="req-star">*</span>
                    <input
                      name="cinNumber"
                      value={documentData.cinNumber || ""}
                      onChange={(e) => updateField("cinNumber", e.target.value.toUpperCase())}
                      placeholder="e.g. U74999MH2021PTC123456"
                      maxLength={21}
                      required={isCorporateEntity}
                    />
                  </label>

                  <label className="field-label">
                    GST Number <span className="opt-tag">(Optional)</span>
                    <input
                      name="gstNumber"
                      value={documentData.gstNumber || ""}
                      onChange={(e) => updateField("gstNumber", e.target.value.toUpperCase())}
                      placeholder="e.g. 27ABCDE1234F1Z5 (Optional)"
                    />
                  </label>
                </div>
              </>
            ) : (
              <>
                <div className="form-row-2col">
                  <label className="field-label">
                    PAN Number <span className="req-star">*</span>
                    <input
                      name="panNumber"
                      value={documentData.panNumber || ""}
                      onChange={(e) => updateField("panNumber", e.target.value.toUpperCase())}
                      placeholder="e.g. ABCDE1234F"
                      maxLength={10}
                      required={!isCorporateEntity}
                    />
                  </label>

                  <label className="field-label">
                    Aadhar Number <span className="req-star">*</span>
                    <input
                      name="aadharNumber"
                      value={documentData.aadharNumber || ""}
                      onChange={(e) => updateField("aadharNumber", e.target.value)}
                      placeholder="e.g. 1234 5678 9012"
                      maxLength={14}
                      required={!isCorporateEntity}
                    />
                  </label>
                </div>

                <div className="form-row-2col">
                  <label className="field-label">
                    GST Number <span className="opt-tag">(Optional)</span>
                    <input
                      name="gstNumber"
                      value={documentData.gstNumber || ""}
                      onChange={(e) => updateField("gstNumber", e.target.value.toUpperCase())}
                      placeholder="e.g. 27ABCDE1234F1Z5 (Optional)"
                    />
                  </label>

                  <label className="field-label">
                    MSME / Udyam Number <span className="req-star">*</span>
                    <input
                      name="msmeNumber"
                      value={documentData.msmeNumber || ""}
                      onChange={(e) => updateField("msmeNumber", e.target.value.toUpperCase())}
                      placeholder="e.g. UDYAM-MH-01-0012345"
                      required={!isCorporateEntity}
                    />
                  </label>
                </div>
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
                required
              />
            </label>

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
