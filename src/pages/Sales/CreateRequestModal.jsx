import React, { useMemo, useState, useEffect } from "react";
import Modal from "../../components/Modal";
import Icon from "../../components/Icon";
import { isClientCreatedByUser } from "./hooks/useSalesClients";
import { apiFetch } from "../../services/apiClient";

const requestTypes = [
  {
    id: "Edit Client",
    title: "Edit Client Details",
    tag: "Profile Update",
    desc: "Request modifications to company name, contact person, phone, email, GST, or address",
    icon: "document",
    tone: "#8c5ff8",
  },
  {
    id: "Delete Client",
    title: "Delete Client Record",
    tag: "Account Removal",
    desc: "Request permanent removal or archival of inactive, duplicate, or churned client account",
    icon: "trash",
    tone: "#f43f5e",
  },
];

const makeRequestId = () => `RQ-${Math.floor(1000 + Math.random() * 9000)}`;

export default function CreateRequestModal({ clients = [], userEmail, salesPersonName, onClose, onSubmit }) {
  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("agni_user") || "{}");
    } catch (e) {
      return {};
    }
  }, []);

  const currentSalesName = salesPersonName || storedUser.fullName || storedUser.name || localStorage.getItem("agni_user_name") || "";
  const currentUserEmail = userEmail || storedUser.email || localStorage.getItem("agni_user_email") || localStorage.getItem("agni_email") || "";
  const currentUserId = storedUser.id || "";
  const userRole = localStorage.getItem("agni_user_role") || storedUser.role || "";

  // Fallback internal clients if clients prop is empty
  const [internalClients, setInternalClients] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!clients || clients.length === 0) {
      apiFetch("/clients")
        .then((r) => r.json())
        .then((d) => {
          if (d.success && Array.isArray(d.data)) {
            setInternalClients(d.data);
          }
        })
        .catch(() => {});
    }
  }, [clients]);

  const rawList = useMemo(() => {
    if (Array.isArray(clients) && clients.length > 0) return clients;
    if (internalClients.length > 0) return internalClients;
    try {
      const saved = localStorage.getItem("agni_sales_clients") || localStorage.getItem("agni_clients");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  }, [clients, internalClients]);

  // Filter clients to ONLY those created by or assigned to the logged-in salesperson (Deduplicated strictly)
  const filteredClients = useMemo(() => {
    const uniqueList = [];
    const addedKeys = new Set();

    rawList.forEach((c) => {
      if (!c) return;
      if (userRole !== "Admin" && userRole !== "Owner" && userRole !== "Branch Manager" && userRole !== "Manager") {
        if (!isClientCreatedByUser(c, currentSalesName, currentUserEmail)) return;
      }
      const key = String(c.id || c.appId || c.email || c.companyName || c.company || c.name).trim();
      if (key && !addedKeys.has(key)) {
        addedKeys.add(key);
        uniqueList.push(c);
      }
    });

    return uniqueList;
  }, [rawList, currentSalesName, currentUserEmail, userRole]);

  const [selectedType, setSelectedType] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [reason, setReason] = useState("");
  const [formValues, setFormValues] = useState({
    company: "",
    contactPerson: "",
    phone: "",
    email: "",
    gstNumber: "",
    address: "",
  });

  const selectedClient = useMemo(
    () => filteredClients.find((client) => String(client.id) === String(selectedClientId)),
    [filteredClients, selectedClientId]
  );

  useEffect(() => {
    if (!selectedClient) {
      setFormValues({ company: "", contactPerson: "", phone: "", email: "", gstNumber: "", address: "" });
      return;
    }

    setFormValues({
      company: selectedClient.companyName || selectedClient.company || selectedClient.name || "",
      contactPerson: selectedClient.contactPerson || selectedClient.name || "",
      phone: selectedClient.phone || "",
      email: selectedClient.email || "",
      gstNumber: selectedClient.gstNumber || selectedClient.gstNo || "",
      address: selectedClient.address || "",
    });
  }, [selectedClient]);

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!selectedType || !selectedClient) return;
    if (!reason.trim()) return;

    setIsSubmitting(true);
    setFormError("");

    const backendReqType = selectedType === "Delete Client" ? "DELETE_CLIENT" : "EDIT_CLIENT";
    const requestedChanges = selectedType === "Delete Client" ? [] : [
      { field: "Company Name", oldValue: selectedClient.companyName || selectedClient.company || "", newValue: formValues.company },
      { field: "Contact Person", oldValue: selectedClient.contactPerson || selectedClient.name || "", newValue: formValues.contactPerson },
      { field: "Phone Number", oldValue: selectedClient.phone || "", newValue: formValues.phone },
      { field: "Email", oldValue: selectedClient.email || "", newValue: formValues.email },
      { field: "GST Number", oldValue: selectedClient.gstNumber || selectedClient.gstNo || "", newValue: formValues.gstNumber },
      { field: "Address", oldValue: selectedClient.address || "", newValue: formValues.address },
    ].filter((change) => change.oldValue !== change.newValue && (change.newValue || change.oldValue));

    const requestPayload = {
      id: makeRequestId(),
      clientId: selectedClient.id,
      clientName: selectedClient.name || selectedClient.companyName || selectedClient.company || "Client Account",
      company: selectedClient.companyName || selectedClient.company || selectedClient.name || "Corporate Entity",
      salesPerson: currentSalesName,
      salesPersonEmail: currentUserEmail,
      managerId: selectedClient.managerId || "MGR-101",
      managerName: selectedClient.managerName || "Assigned Manager",
      requestType: selectedType,
      requestedChanges,
      reason: reason.trim(),
      status: "Pending",
      createdAt: new Date().toISOString().split("T")[0],
      decisionDate: null,
      managerRemarks: null,
    };

    try {
      const res = await apiFetch("/requests", {
        method: "POST",
        body: {
          requestType: backendReqType,
          targetEntityType: "CLIENT",
          clientId: String(selectedClient.id),
          reason: reason.trim(),
          requestedChanges,
        },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to submit change request to server.");
      }

      const resData = await res.json();
      window.dispatchEvent(new CustomEvent("agni_requests_updated"));

      if (onSubmit) {
        onSubmit(resData?.data || requestPayload);
      }
      onClose();
    } catch (err) {
      console.warn("Submit request API error, saving locally:", err);
      if (onSubmit) {
        onSubmit(requestPayload);
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = Boolean(
    selectedType &&
    selectedClientId &&
    reason.trim()
  );

  return (
    <Modal title="Create Request" onClose={onClose} closeLabel="Close">
      <div style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 320, maxWidth: 720 }}>
        {!selectedType ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <p className="eyebrow" style={{ margin: 0, textTransform: "uppercase", letterSpacing: 1, fontSize: 11, color: "#8c5ff8", fontWeight: 700 }}>
                Step 1 of 2
              </p>
              <h2 style={{ margin: "4px 0 4px", fontSize: 19, fontWeight: 800, letterSpacing: "-0.3px" }}>Select Request Category</h2>
              <p style={{ margin: 0, color: "#7a748e", fontSize: 13 }}>
                Choose the type of operational request you wish to submit for managerial authorization.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginTop: 4 }}>
              {requestTypes.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedType(item.id)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    textAlign: "left",
                    padding: "22px 20px",
                    borderRadius: 18,
                    border: "1.5px solid rgba(140, 95, 248, 0.2)",
                    background: "linear-gradient(145deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)",
                    cursor: "pointer",
                    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                    position: "relative",
                    overflow: "hidden",
                  }}
                  className="sales-req-type-card"
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: 14 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: `${item.tone}18`,
                        border: `1px solid ${item.tone}35`,
                        color: item.tone,
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      <Icon name={item.icon} size={22} />
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: 6,
                        background: `${item.tone}15`,
                        color: item.tone,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      {item.tag}
                    </span>
                  </div>
                  <strong style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, display: "block" }}>{item.title}</strong>
                  <p style={{ margin: 0, fontSize: 12.5, color: "#7a748e", lineHeight: 1.45 }}>{item.desc}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Header with breadcrumb & switch type button */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 12,
                padding: "14px 18px",
                borderRadius: 14,
                background: "linear-gradient(135deg, rgba(140, 95, 248, 0.08) 0%, rgba(109, 59, 245, 0.03) 100%)",
                border: "1px solid rgba(140, 95, 248, 0.16)",
              }}
            >
              <div>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "3px 10px",
                    borderRadius: 999,
                    background: selectedType === "Edit Client" ? "rgba(140, 95, 248, 0.15)" : "rgba(244, 63, 94, 0.15)",
                    color: selectedType === "Edit Client" ? "#8c5ff8" : "#f43f5e",
                    fontSize: 11.5,
                    fontWeight: 700,
                    marginBottom: 4,
                  }}
                >
                  <Icon name={selectedType === "Edit Client" ? "document" : "trash"} size={12} />
                  {selectedType}
                </span>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                  {selectedType === "Edit Client" ? "Update Client Profile" : "Request Account Deletion"}
                </h3>
              </div>
              <button
                type="button"
                className="sales-btn-secondary"
                onClick={() => {
                  setSelectedType("");
                  setSelectedClientId("");
                }}
                style={{ padding: "6px 14px", fontSize: 12.5 }}
              >
                ← Switch Type
              </button>
            </div>

            {/* Client selection field */}
            <div className="field-label" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>
                Target Client Account <span style={{ color: "#f43f5e" }}>*</span>
              </span>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                style={{ padding: "11px 14px", borderRadius: 10, fontSize: 13.5 }}
                required
              >
                <option value="">-- Choose a client from directory --</option>
                {filteredClients.map((client) => {
                  const clientName = client.name || client.companyName || client.company || "Client";
                  const company = client.companyName || client.company || "";
                  const contact = client.contactPerson ? ` (${client.contactPerson})` : "";
                  const displayLabel = company && company !== clientName
                    ? `${clientName} • ${company}${contact}`
                    : `${clientName}${contact}`;
                  const scheme = client.scheme || client.serviceName ? ` [${client.scheme || client.serviceName}]` : "";

                  return (
                    <option key={client.id} value={client.id}>
                      {displayLabel}{scheme}
                    </option>
                  );
                })}
              </select>
              {filteredClients.length === 0 && (
                <span style={{ fontSize: 12, color: "#f43f5e", marginTop: 2 }}>
                  No clients found under your sales portfolio. Make sure clients are registered and active.
                </span>
              )}
            </div>

            {selectedClient ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Client Mini-Dossier Strip */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                    gap: 12,
                    padding: "12px 16px",
                    borderRadius: 12,
                    background: "rgba(140, 95, 248, 0.05)",
                    border: "1px solid rgba(140, 95, 248, 0.14)",
                    fontSize: 12.5,
                  }}
                >
                  <div>
                    <span style={{ color: "#7a748e", fontSize: 11, textTransform: "uppercase", fontWeight: 600, display: "block" }}>Client / Trade</span>
                    <strong style={{ display: "block", marginTop: 2 }}>{selectedClient.name || selectedClient.contactPerson || "N/A"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#7a748e", fontSize: 11, textTransform: "uppercase", fontWeight: 600, display: "block" }}>Company</span>
                    <strong style={{ display: "block", marginTop: 2 }}>{selectedClient.companyName || selectedClient.company || selectedClient.name || "N/A"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#7a748e", fontSize: 11, textTransform: "uppercase", fontWeight: 600, display: "block" }}>Contact</span>
                    <strong style={{ display: "block", marginTop: 2 }}>{selectedClient.contactPerson || "N/A"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#7a748e", fontSize: 11, textTransform: "uppercase", fontWeight: 600, display: "block" }}>Service Scheme</span>
                    <strong style={{ color: "#8c5ff8", display: "block", marginTop: 2 }}>{selectedClient.serviceName || selectedClient.scheme || "Standard Retainer"}</strong>
                  </div>
                </div>

                {/* Reason Textarea */}
                <div className="field-label" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>
                    {selectedType === "Edit Client" ? "Reason for Modification *" : "Justification for Account Deletion *"}
                  </span>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    placeholder={
                      selectedType === "Edit Client"
                        ? "Briefly describe why these detail updates are required..."
                        : "Explain why this client account should be archived or deleted..."
                    }
                    style={{
                      resize: "vertical",
                      minHeight: 80,
                      padding: "11px 14px",
                      borderRadius: 10,
                      fontSize: 13,
                      fontFamily: "inherit",
                    }}
                    required
                  />
                </div>

                {/* If Edit Client, show structured 2-column inputs */}
                {selectedType === "Edit Client" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#8c5ff8" }}>
                        Editable Profile Fields
                      </span>
                      <span style={{ height: 1, flex: 1, background: "rgba(140, 95, 248, 0.15)" }} />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      <label className="field-label" style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>Company Name</span>
                        <input
                          type="text"
                          name="company"
                          value={formValues.company}
                          onChange={handleFieldChange}
                          placeholder="Company name"
                        />
                      </label>
                      <label className="field-label" style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>Contact Person</span>
                        <input
                          type="text"
                          name="contactPerson"
                          value={formValues.contactPerson}
                          onChange={handleFieldChange}
                          placeholder="Contact person"
                        />
                      </label>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      <label className="field-label" style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>Phone Number</span>
                        <input
                          type="tel"
                          name="phone"
                          value={formValues.phone}
                          onChange={handleFieldChange}
                          placeholder="+91..."
                        />
                      </label>
                      <label className="field-label" style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>Email Address</span>
                        <input
                          type="email"
                          name="email"
                          value={formValues.email}
                          onChange={handleFieldChange}
                          placeholder="client@domain.com"
                        />
                      </label>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      <label className="field-label" style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>GST Number</span>
                        <input
                          type="text"
                          name="gstNumber"
                          value={formValues.gstNumber}
                          onChange={handleFieldChange}
                          placeholder="GST number"
                          style={{ textTransform: "uppercase" }}
                        />
                      </label>
                      <label className="field-label" style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>Registered Address</span>
                        <input
                          type="text"
                          name="address"
                          value={formValues.address}
                          onChange={handleFieldChange}
                          placeholder="Office location"
                        />
                      </label>
                    </div>
                  </div>
                )}

                {formError && (
                  <div style={{ color: "#f43f5e", fontSize: 13, background: "rgba(244, 63, 94, 0.1)", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(244, 63, 94, 0.2)" }}>
                    {formError}
                  </div>
                )}

                {/* Footer Buttons */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    gap: 12,
                    marginTop: 10,
                    paddingTop: 14,
                    borderTop: "1px solid rgba(140, 95, 248, 0.12)",
                  }}
                >
                  <button className="sales-btn-secondary" type="button" onClick={onClose} style={{ padding: "10px 20px" }}>
                    Cancel
                  </button>
                  <button
                    className="sales-add-btn"
                    type="button"
                    onClick={handleSubmit}
                    disabled={!isFormValid || isSubmitting}
                    style={{
                      opacity: isFormValid && !isSubmitting ? 1 : 0.5,
                      cursor: isFormValid && !isSubmitting ? "pointer" : "not-allowed",
                      padding: "10px 26px",
                      fontSize: 13.5,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span>{isSubmitting ? "Submitting..." : "Submit Request →"}</span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </Modal>
  );
}

