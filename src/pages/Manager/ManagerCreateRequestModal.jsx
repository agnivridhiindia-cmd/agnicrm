import React, { useMemo, useState, useEffect } from "react";
import Modal from "../../components/Modal";
import Icon from "../../components/Icon";
import { apiFetch } from "../../services/apiClient";
import { useAuth } from "../../context/AuthContext";

const clientRequestTypes = [
  {
    type: "Edit Client",
    title: "Edit Client",
    desc: "Update client contact person, company details, service scheme, or contract terms.",
    icon: "document",
    badge: "Information Update",
    accent: "#3b82f6",
  },
  {
    type: "Transfer Client",
    title: "Transfer Client",
    desc: "Reassign client account under a different sales representative or branch.",
    icon: "team",
    badge: "Portfolio Transfer",
    accent: "#8c5ff8",
  },
  {
    type: "Delete Client",
    title: "Delete Client",
    desc: "Submit client offboarding petition, archival, and account deactivation.",
    icon: "alert",
    badge: "Account Removal",
    accent: "#f43f5e",
  },
];

const representativeRequestTypes = [
  {
    type: "Edit Salesperson",
    title: "Edit Representative",
    desc: "Update salesperson contact, territory region, or target quotas.",
    icon: "document",
    badge: "Profile & Quotas",
    accent: "#3b82f6",
  },
  {
    type: "Delete Salesperson",
    title: "Delete Representative",
    desc: "Submit offboarding petition and account reallocations.",
    icon: "alert",
    badge: "Team Offboarding",
    accent: "#f43f5e",
  },
];

const standardSchemes = [
  "PMEGP",
  "Mudra Loan",
  "Stand-Up India",
  "MSME Project Loan",
  "Startup India Seed Fund",
  "CGTMSE Scheme",
  "State Subsidy Scheme",
  "Trade & GST Registration",
  "Consultancy & Advisory",
];

const businessSectors = [
  "Manufacturing & Production",
  "Service Provider",
  "Wholesale & Distribution",
  "Retail & Trading",
  "Agro & Food Processing",
  "Information Technology",
  "Healthcare & Pharma",
  "Textiles & Apparel",
  "Other Industry",
];

const mockTransferManagers = [
  { id: 1, name: "Arun Patel", branch: "North Zone (Delhi)" },
  { id: 2, name: "Sneha Reddy", branch: "South Zone (Bengaluru)" },
  { id: 3, name: "Rajesh Kumar", branch: "West Zone (Mumbai)" },
  { id: 4, name: "Subhash Banerjee", branch: "East Zone (Kolkata)" },
];

const makeRequestId = () => `RQ-${Math.floor(1000 + Math.random() * 9000)}`;

export default function ManagerCreateRequestModal({
  salesPeople = [],
  clients = [],
  onClose,
  onSubmit,
  initialCategory = "client",
  initialType = "",
  initialClientId = "",
  initialSalespersonId = "",
}) {
  const { user } = useAuth();
  const [targetCategory, setTargetCategory] = useState(initialCategory); // 'client' | 'salesperson'
  const [selectedType, setSelectedType] = useState(initialType);
  const [reason, setReason] = useState("");
  const [priority, setPriority] = useState("Normal");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Client Selection State
  const [selectedClientId, setSelectedClientId] = useState(initialClientId);
  const [clientSearch, setClientSearch] = useState("");
  const [clientFormValues, setClientFormValues] = useState({
    name: "",
    company: "",
    contactPerson: "",
    email: "",
    phone: "",
    scheme: "PMEGP",
    totalPayment: "",
    businessType: "Manufacturing & Production",
    assignedSalesPerson: "",
    gstNumber: "",
    panNumber: "",
  });

  // Client Transfer State
  const [clientTransferMode, setClientTransferMode] = useState("rep"); // 'rep' | 'branch'
  const [targetRepName, setTargetRepName] = useState("");
  const [targetBranchManagerId, setTargetBranchManagerId] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("Immediate");

  // Client Delete State
  const [deletionCategory, setDeletionCategory] = useState("Client Opted Out / Project Terminated");
  const [financialStatus, setFinancialStatus] = useState("All Invoices Settled / Zero Balance");
  const [dataRetention, setDataRetention] = useState("Archive Record (Retain Audit History)");

  // Salesperson Selection State
  const [selectedSalespersonId, setSelectedSalespersonId] = useState(initialSalespersonId);
  const [salesFormValues, setSalesFormValues] = useState({
    name: "",
    role: "",
    email: "",
    phone: "",
    region: "",
    quota: "",
  });

  // Selected Client Entity
  const selectedClient = useMemo(() => {
    return clients.find((c) => String(c.id) === String(selectedClientId)) || null;
  }, [clients, selectedClientId]);

  // Selected Salesperson Entity
  const selectedSalesperson = useMemo(() => {
    return salesPeople.find((person) => String(person.id) === String(selectedSalespersonId)) || null;
  }, [salesPeople, selectedSalespersonId]);

  // Filtered clients for dropdown
  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return clients;
    const q = clientSearch.toLowerCase();
    return clients.filter((c) => {
      const matchName = (c.name || "").toLowerCase().includes(q);
      const matchCompany = (c.company || c.companyName || "").toLowerCase().includes(q);
      const matchRep = (c.salesRep || c.owner || "").toLowerCase().includes(q);
      const matchScheme = (c.scheme || c.service || "").toLowerCase().includes(q);
      return matchName || matchCompany || matchRep || matchScheme;
    });
  }, [clients, clientSearch]);


  // Destination Branch Manager for client transfer
  const clientDestinationManager = useMemo(
    () => mockTransferManagers.find((m) => String(m.id) === String(targetBranchManagerId)),
    [targetBranchManagerId]
  );

  // Sync client form when selected client changes
  useEffect(() => {
    if (!selectedClient) {
      setClientFormValues({
        name: "",
        company: "",
        contactPerson: "",
        email: "",
        phone: "",
        scheme: "PMEGP",
        totalPayment: "",
        businessType: "Manufacturing & Production",
        assignedSalesPerson: "",
        gstNumber: "",
        panNumber: "",
      });
      setTargetRepName("");
      return;
    }

    setClientFormValues({
      name: selectedClient.contactPerson || selectedClient.name || "",
      company: selectedClient.company || selectedClient.companyName || selectedClient.name || "",
      contactPerson: selectedClient.contactPerson || selectedClient.name || "",
      email: selectedClient.email || "",
      phone: selectedClient.phone || "",
      scheme: selectedClient.service || selectedClient.scheme || selectedClient.serviceName || "PMEGP",
      totalPayment: selectedClient.totalPayment || selectedClient.revenue || selectedClient.amount || "",
      businessType: selectedClient.businessType || selectedClient.sector || "Manufacturing & Production",
      assignedSalesPerson: selectedClient.salesRep || selectedClient.owner || selectedClient.assignedSalesPerson || "",
      gstNumber: selectedClient.gstNumber || "",
      panNumber: selectedClient.panNumber || "",
    });

    // Default next rep candidate (first sales rep who isn't the current rep)
    const currentRep = String(selectedClient.salesRep || selectedClient.owner || "").toLowerCase().trim();
    const otherRep = salesPeople.find((p) => {
      const pName = (typeof p === "string" ? p : p.name || "").toLowerCase().trim();
      return pName && pName !== currentRep;
    });
    if (otherRep) {
      setTargetRepName(typeof otherRep === "string" ? otherRep : otherRep.name);
    }
  }, [selectedClient, salesPeople]);

  // Sync salesperson form when selected salesperson changes
  useEffect(() => {
    if (!selectedSalesperson) {
      setSalesFormValues({ name: "", role: "", email: "", phone: "", region: "", quota: "" });
      return;
    }

    setSalesFormValues({
      name: selectedSalesperson.name || "",
      role: selectedSalesperson.role || "",
      email: selectedSalesperson.email || "",
      phone: selectedSalesperson.phone || "",
      region: selectedSalesperson.region || "",
      quota: selectedSalesperson.quota || "",
    });
  }, [selectedSalesperson]);

  const handleClientFieldChange = (event) => {
    const { name, value } = event.target;
    setClientFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSalesFieldChange = (event) => {
    const { name, value } = event.target;
    setSalesFormValues((prev) => ({ ...prev, [name]: value }));
  };

  // Submit Handler
  const handleSubmit = async () => {
    if (!selectedType) {
      setFormError("Please select a request type.");
      return;
    }
    setFormError("");

    // CLIENT SUBMISSION
    if (targetCategory === "client") {
      if (!selectedClient) {
        setFormError("Please choose a client account before submitting.");
        return;
      }

      if (selectedType === "Transfer Client") {
        if (clientTransferMode === "rep" && !targetRepName) {
          setFormError("Please select an assigned representative to transfer the client to.");
          return;
        }
        if (clientTransferMode === "branch" && !targetBranchManagerId) {
          setFormError("Please select a destination branch manager for this transfer.");
          return;
        }
      }

      const clientTitle = selectedClient.company || selectedClient.companyName || selectedClient.name || "Client Account";
      const finalReason = reason.trim().length >= 3
        ? reason.trim()
        : `${selectedType} adjustment requested by Sales Manager for ${clientTitle}.`;

      let requestedChanges = [];

      if (selectedType === "Edit Client") {
        const changes = [];
        if (clientFormValues.company && clientFormValues.company !== (selectedClient.company || selectedClient.name || "")) {
          changes.push({ field: "Company Name", oldValue: selectedClient.company || selectedClient.name || "—", newValue: clientFormValues.company });
        }
        if (clientFormValues.contactPerson && clientFormValues.contactPerson !== (selectedClient.contactPerson || selectedClient.name || "")) {
          changes.push({ field: "Contact Person", oldValue: selectedClient.contactPerson || selectedClient.name || "—", newValue: clientFormValues.contactPerson });
        }
        if (clientFormValues.email && clientFormValues.email !== (selectedClient.email || "")) {
          changes.push({ field: "Email Address", oldValue: selectedClient.email || "—", newValue: clientFormValues.email });
        }
        if (clientFormValues.phone && clientFormValues.phone !== (selectedClient.phone || "")) {
          changes.push({ field: "Phone Number", oldValue: selectedClient.phone || "—", newValue: clientFormValues.phone });
        }
        if (clientFormValues.scheme && clientFormValues.scheme !== (selectedClient.service || selectedClient.scheme || "")) {
          changes.push({ field: "Service Scheme", oldValue: selectedClient.service || selectedClient.scheme || "—", newValue: clientFormValues.scheme });
        }
        if (clientFormValues.totalPayment && String(clientFormValues.totalPayment) !== String(selectedClient.totalPayment || selectedClient.revenue || "")) {
          const oldVal = selectedClient.totalPayment || selectedClient.revenue || 0;
          changes.push({
            field: "Contract Amount",
            oldValue: `₹${Number(oldVal).toLocaleString("en-IN")}`,
            newValue: `₹${Number(clientFormValues.totalPayment).toLocaleString("en-IN")}`,
          });
        }
        if (clientFormValues.businessType && clientFormValues.businessType !== (selectedClient.businessType || selectedClient.sector || "")) {
          changes.push({ field: "Business Sector", oldValue: selectedClient.businessType || selectedClient.sector || "—", newValue: clientFormValues.businessType });
        }
        if (clientFormValues.assignedSalesPerson && clientFormValues.assignedSalesPerson !== (selectedClient.salesRep || selectedClient.owner || "")) {
          changes.push({ field: "Assigned Rep", oldValue: selectedClient.salesRep || selectedClient.owner || "—", newValue: clientFormValues.assignedSalesPerson });
        }
        if (clientFormValues.gstNumber && clientFormValues.gstNumber !== (selectedClient.gstNumber || "")) {
          changes.push({ field: "GST Number", oldValue: selectedClient.gstNumber || "—", newValue: clientFormValues.gstNumber });
        }
        requestedChanges = changes.length > 0 ? changes : [
          { field: "Client Profile", oldValue: "Current Record", newValue: "Updated Record Details" }
        ];
      } else if (selectedType === "Transfer Client") {
        if (clientTransferMode === "rep") {
          requestedChanges = [
            {
              field: "Assigned Representative",
              oldValue: selectedClient.salesRep || selectedClient.owner || "Current Representative",
              newValue: targetRepName,
            },
            {
              field: "Transfer Scope",
              oldValue: "Internal Branch Reallocation",
              newValue: `Effective: ${effectiveDate}`,
            },
          ];
        } else {
          requestedChanges = [
            {
              field: "Branch / Territory Reassignment",
              oldValue: selectedClient.branch || "Current Branch",
              newValue: `${clientDestinationManager?.name || "Branch Manager"} (${clientDestinationManager?.branch || "Destination"})`,
            },
            {
              field: "Transfer Scope",
              oldValue: "Inter-branch Portfolio Migration",
              newValue: `Effective: ${effectiveDate}`,
            },
          ];
        }
      } else if (selectedType === "Delete Client") {
        requestedChanges = [
          { field: "Account Status", oldValue: "Active Client", newValue: "Offboarded / Marked for Archival" },
          { field: "Deletion Category", oldValue: "—", newValue: deletionCategory },
          { field: "Financial Settlement", oldValue: "—", newValue: financialStatus },
          { field: "Data Archival Policy", oldValue: "—", newValue: dataRetention },
        ];
      }

      const request = {
        id: makeRequestId(),
        clientId: selectedClient.id,
        clientName: clientTitle,
        company: clientTitle,
        companyName: clientTitle,
        contactPerson: clientFormValues.contactPerson || selectedClient.contactPerson || selectedClient.name || "N/A",
        email: clientFormValues.email || selectedClient.email || "",
        phone: clientFormValues.phone || selectedClient.phone || "",
        scheme: clientFormValues.scheme || selectedClient.service || selectedClient.scheme || "PMEGP",
        pitchedAmount: Number(clientFormValues.totalPayment || selectedClient.totalPayment || selectedClient.revenue || 0),
        paymentReceived: Number(selectedClient.paymentReceived || 0),
        salesPerson: selectedClient.salesRep || selectedClient.owner || "Sales Executive",
        salesPersonEmail: selectedClient.salesPersonEmail || "",
        managerId: 4,
        managerName: user?.fullName || user?.name || "Sales Manager",
        requestCategory: "Client Account",
        requestType: selectedType,
        requestedChanges: requestedChanges,
        reason: finalReason,
        priority,
        status: "Pending",
        createdAt: new Date().toISOString().split("T")[0],
        decisionDate: null,
        branchManagerRemarks: null,
        targetRep: targetRepName,
        targetBranch: clientDestinationManager?.branch,
        deletionCategory,
        financialStatus,
      };

      setIsSubmitting(true);
      try {
        let backendReqType = "EDIT_CLIENT";
        if (selectedType === "Transfer Client") backendReqType = "TRANSFER_CLIENT";
        if (selectedType === "Delete Client") backendReqType = "DELETE_CLIENT";

        const res = await apiFetch("/requests", {
          method: "POST",
          body: {
            requestType: backendReqType,
            targetEntityType: "CLIENT",
            clientId: String(selectedClient.id),
            reason: finalReason,
            requestedChanges,
          },
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || "Failed to submit change request to server.");
        }

        const resData = await res.json();
        window.dispatchEvent(new CustomEvent("agni_requests_updated"));
        window.dispatchEvent(new CustomEvent("agni_pending_updated"));
        window.dispatchEvent(new CustomEvent("agni_clients_updated"));

        onSubmit?.(resData?.data || request);
        onClose();
      } catch (err) {
        setFormError(err.message || "An unexpected error occurred while submitting the request.");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // SALESPERSON SUBMISSION
    if (targetCategory === "salesperson") {
      if (!selectedSalesperson) {
        setFormError("Please select a sales representative before submitting.");
        return;
      }

      const finalReason = reason.trim().length >= 3
        ? reason.trim()
        : `${selectedType} requested by Sales Manager for ${selectedSalesperson.name}.`;

      let requestedChanges = [];
      if (selectedType === "Edit Salesperson") {
        requestedChanges = [
          { field: "Name", oldValue: selectedSalesperson.name, newValue: salesFormValues.name },
          { field: "Role", oldValue: selectedSalesperson.role, newValue: salesFormValues.role },
          { field: "Email", oldValue: selectedSalesperson.email, newValue: salesFormValues.email },
          { field: "Phone", oldValue: selectedSalesperson.phone, newValue: salesFormValues.phone },
          { field: "Region", oldValue: selectedSalesperson.region, newValue: salesFormValues.region },
          { field: "Quota", oldValue: selectedSalesperson.quota, newValue: salesFormValues.quota },
        ].filter((change) => change.oldValue !== change.newValue);
      } else {
        requestedChanges = [
          { field: "Representative Status", oldValue: "Active Staff", newValue: "Offboarded / Reallocated" },
        ];
      }

      const request = {
        id: makeRequestId(),
        salespersonId: selectedSalesperson.id,
        salespersonName: selectedSalesperson.name,
        clientName: `Representative: ${selectedSalesperson.name}`,
        company: selectedSalesperson.branch || "Branch Team",
        salesPerson: selectedSalesperson.name,
        managerId: 4,
        managerName: user?.fullName || user?.name || "Sales Manager",
        requestCategory: "Sales Representative",
        requestType: selectedType,
        requestedChanges: requestedChanges,
        reason: finalReason,
        priority,
        status: "Pending",
        createdAt: new Date().toISOString().split("T")[0],
        decisionDate: null,
        branchManagerRemarks: null,
      };

      setIsSubmitting(true);
      try {
        let backendReqType = "EDIT_EMPLOYEE";
        if (selectedType.includes("Delete")) backendReqType = "DELETE_EMPLOYEE";
        if (selectedType.includes("Transfer")) backendReqType = "TRANSFER_EMPLOYEE";

        const res = await apiFetch("/requests", {
          method: "POST",
          body: {
            requestType: backendReqType,
            targetEntityType: "EMPLOYEE",
            targetEntityId: String(selectedSalesperson.id),
            reason: finalReason,
            requestedChanges,
          },
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || "Failed to submit request to server.");
        }

        const resData = await res.json();
        window.dispatchEvent(new CustomEvent("agni_requests_updated"));
        window.dispatchEvent(new CustomEvent("agni_pending_updated"));
        window.dispatchEvent(new CustomEvent("agni_employees_updated"));

        onSubmit?.(resData?.data || request);
        onClose();
      } catch (err) {
        setFormError(err.message || "An unexpected error occurred while submitting the request.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Client initials helper
  const clientInitials = useMemo(() => {
    if (!selectedClient) return "CL";
    const nameStr = selectedClient.company || selectedClient.name || "Client";
    return nameStr
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [selectedClient]);

  // Salesperson initials helper
  const salespersonInitials = useMemo(() => {
    if (!selectedSalesperson) return "SP";
    return (selectedSalesperson.name || "SP")
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [selectedSalesperson]);

  const activeRequestTypes = targetCategory === "client" ? clientRequestTypes : representativeRequestTypes;

  const isClientSubmitDisabled =
    !reason.trim() ||
    !selectedClientId ||
    (selectedType === "Transfer Client" &&
      ((clientTransferMode === "rep" && !targetRepName) ||
        (clientTransferMode === "branch" && !targetBranchManagerId)));

  const isSalesSubmitDisabled =
    !reason.trim() ||
    !selectedSalespersonId;

  return (
    <Modal title="Create Change Request" onClose={onClose} closeLabel="Close">
      <div style={{ display: "grid", gap: 18, minWidth: 320, maxWidth: 680, width: "100%" }}>
        {!selectedType ? (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
              <div>
                <p className="manager-header-eyebrow" style={{ margin: "0 0 4px" }}>
                  Step 1: Select Request Category
                </p>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
                  What change do you want to submit?
                </h2>
              </div>
            </div>

            {/* Segmented Category Filter Strip */}
            <div className="manager-target-segmented" style={{ marginTop: 14 }}>
              <button
                type="button"
                className={`manager-target-btn ${targetCategory === "client" ? "active" : ""}`}
                onClick={() => setTargetCategory("client")}
              >
                <Icon name="clients" size={15} />
                <span>Client Accounts</span>
                <span className="manager-target-badge">{clients.length || 3}</span>
              </button>
              <button
                type="button"
                className={`manager-target-btn ${targetCategory === "salesperson" ? "active" : ""}`}
                onClick={() => setTargetCategory("salesperson")}
              >
                <Icon name="team" size={15} />
                <span>Sales Representatives</span>
                <span className="manager-target-badge">{salesPeople.length || 3}</span>
              </button>
            </div>

            {/* 3 Action Cards for Active Category */}
            <div className="manager-type-grid" style={{ marginTop: 16 }}>
              {activeRequestTypes.map((item) => {
                const isClient = targetCategory === "client";
                return (
                  <button
                    key={item.type}
                    type="button"
                    className={`manager-type-card ${item.type.includes("Edit")
                        ? "card-action-edit"
                        : item.type.includes("Transfer")
                          ? "card-action-transfer"
                          : "card-action-delete"
                      }`}
                    onClick={() => setSelectedType(item.type)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                      <div
                        className="manager-type-card-icon"
                        style={{
                          background: item.type.includes("Delete")
                            ? "rgba(244, 63, 94, 0.12)"
                            : item.type.includes("Transfer")
                              ? "rgba(140, 95, 248, 0.12)"
                              : "rgba(59, 130, 246, 0.12)",
                          color: item.type.includes("Delete")
                            ? "#f43f5e"
                            : item.type.includes("Transfer")
                              ? "#8c5ff8"
                              : "#3b82f6",
                        }}
                      >
                        <Icon name={item.icon} size={18} />
                      </div>
                      <span className="manager-action-pill-tag">{item.badge}</span>
                    </div>
                    <div>
                      <h3 className="manager-type-card-title">{item.title}</h3>
                      <p className="manager-type-card-desc">{item.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 10, background: "rgba(140, 95, 248, 0.05)", border: "1px dashed rgba(140, 95, 248, 0.2)", display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#7a748e" }}>
              <Icon name="overview" size={14} style={{ color: "#8c5ff8", flexShrink: 0 }} />
              <span>
                {targetCategory === "client"
                  ? "Select an action above to transfer client ownership, update registration details, or submit offboarding petitions."
                  : "Select an action above to modify representative profiles or offboard staff."}
              </span>
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {/* Header Pill & Change Category Button */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 12,
                paddingBottom: 14,
                borderBottom: "1px solid rgba(140, 95, 248, 0.14)",
              }}
            >
              <div>
                <span className="manager-header-eyebrow" style={{ margin: 0, textTransform: "uppercase" }}>
                  {targetCategory === "client" ? "🏢 Client Account Request" : "👥 Sales Team Request"}
                </span>
                <h3 style={{ margin: "2px 0 0", fontSize: 18, fontWeight: 800 }}>{selectedType}</h3>
              </div>
              <button
                type="button"
                className="manager-btn-secondary"
                onClick={() => setSelectedType("")}
              >
                ← Change Action
              </button>
            </div>

            {/* ========================================================================= */}
            {/* 1. CLIENT ACCOUNT FLOWS                                                   */}
            {/* ========================================================================= */}
            {targetCategory === "client" && (
              <>
                {/* Target Client Dropdown */}
                <label className="field-label" style={{ margin: 0 }}>
                  <span style={{ fontWeight: 700 }}>Target Client Account *</span>
                  <select
                    className="manager-filter-select"
                    value={selectedClientId}
                    onChange={(event) => setSelectedClientId(event.target.value)}
                  >
                    <option value="">Select client account to proceed...</option>
                    {filteredClients.map((client) => {
                      const cName = client.company || client.name || "Client";
                      const rep = client.salesRep || client.owner || "Unassigned";
                      const scheme = client.service || client.scheme || "Standard";
                      return (
                        <option key={client.id} value={client.id}>
                          {cName} — Contact: {client.contactPerson || client.name || "N/A"} ({rep} • {scheme})
                        </option>
                      );
                    })}
                  </select>
                </label>

                {/* Selected Client Summary Card */}
                {selectedClient && (
                  <div
                    className="manager-modal-profile"
                    style={{
                      margin: 0,
                      padding: "12px 16px",
                      borderRadius: 12,
                      background: "rgba(140, 95, 248, 0.06)",
                      border: "1px solid rgba(140, 95, 248, 0.15)",
                    }}
                  >
                    <div className="manager-modal-avatar" style={{ width: 44, height: 44, fontSize: 14 }}>
                      {clientInitials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                        <strong style={{ fontSize: 15 }}>
                          {selectedClient.company || selectedClient.name}
                        </strong>
                        <span className="manager-service-pill">
                          {selectedClient.service || selectedClient.scheme || "Consultancy"}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: "#7a748e", marginTop: 4, display: "flex", gap: 12, flexWrap: "wrap" }}>
                        <span>
                          <strong>Contact:</strong> {selectedClient.contactPerson || selectedClient.name || "N/A"}
                        </span>
                        <span>
                          <strong>Assigned Rep:</strong>{" "}
                          <span style={{ color: "#8c5ff8", fontWeight: 700 }}>
                            {selectedClient.salesRep || selectedClient.owner || "Unassigned"}
                          </span>
                        </span>
                        <span>
                          <strong>Contract:</strong> ₹
                          {Number(selectedClient.totalPayment || selectedClient.revenue || 0).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* --- A. EDIT CLIENT FIELDS --- */}
                {selectedClient && selectedType === "Edit Client" && (
                  <div style={{ display: "grid", gap: 14 }}>
                    <div className="manager-form-grid-2">
                      <label className="field-label" style={{ margin: 0 }}>
                        <span>Company / Business Name</span>
                        <input
                          name="company"
                          value={clientFormValues.company}
                          onChange={handleClientFieldChange}
                          placeholder="e.g. Apex Manufacturing Ltd"
                        />
                      </label>

                      <label className="field-label" style={{ margin: 0 }}>
                        <span>Primary Contact Person</span>
                        <input
                          name="contactPerson"
                          value={clientFormValues.contactPerson}
                          onChange={handleClientFieldChange}
                          placeholder="e.g. Rahul Sharma"
                        />
                      </label>

                      <label className="field-label" style={{ margin: 0 }}>
                        <span>Email Address</span>
                        <input
                          type="email"
                          name="email"
                          value={clientFormValues.email}
                          onChange={handleClientFieldChange}
                          placeholder="client@company.com"
                        />
                      </label>

                      <label className="field-label" style={{ margin: 0 }}>
                        <span>Phone / Mobile Number</span>
                        <input
                          name="phone"
                          value={clientFormValues.phone}
                          onChange={handleClientFieldChange}
                          placeholder="+91 98765 43210"
                        />
                      </label>

                      <label className="field-label" style={{ margin: 0 }}>
                        <span>Service Scheme / Product</span>
                        <select
                          className="manager-filter-select"
                          name="scheme"
                          value={clientFormValues.scheme}
                          onChange={handleClientFieldChange}
                        >
                          {standardSchemes.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="field-label" style={{ margin: 0 }}>
                        <span>Contract / Total Pitch Value (₹)</span>
                        <input
                          type="number"
                          name="totalPayment"
                          value={clientFormValues.totalPayment}
                          onChange={handleClientFieldChange}
                          placeholder="e.g. 118000"
                        />
                      </label>

                      <label className="field-label" style={{ margin: 0 }}>
                        <span>Business Type / Industry</span>
                        <select
                          className="manager-filter-select"
                          name="businessType"
                          value={clientFormValues.businessType}
                          onChange={handleClientFieldChange}
                        >
                          {businessSectors.map((b) => (
                            <option key={b} value={b}>
                              {b}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="field-label" style={{ margin: 0 }}>
                        <span>GSTIN / Tax ID</span>
                        <input
                          name="gstNumber"
                          value={clientFormValues.gstNumber}
                          onChange={handleClientFieldChange}
                          placeholder="27AAAAA0000A1Z5"
                        />
                      </label>
                    </div>

                    <label className="field-label" style={{ margin: 0 }}>
                      <span>Justification & Reason for Client Edit *</span>
                      <textarea
                        className="manager-textarea"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Detail why client contact details, contract value, or service scheme need adjustment..."
                        required
                      />
                    </label>
                  </div>
                )}

                {/* --- B. TRANSFER CLIENT FIELDS --- */}
                {selectedClient && selectedType === "Transfer Client" && (
                  <div style={{ display: "grid", gap: 14 }}>
                    {/* Transfer Mode Selector */}
                    <div>
                      <span className="field-label" style={{ margin: "0 0 6px", display: "block" }}>
                        Transfer Destination Type
                      </span>
                      <div className="manager-target-segmented">
                        <button
                          type="button"
                          className={`manager-target-btn ${clientTransferMode === "rep" ? "active" : ""}`}
                          onClick={() => setClientTransferMode("rep")}
                        >
                          <Icon name="user" size={14} />
                          <span>Reassign Sales Representative</span>
                        </button>
                        <button
                          type="button"
                          className={`manager-target-btn ${clientTransferMode === "branch" ? "active" : ""}`}
                          onClick={() => setClientTransferMode("branch")}
                        >
                          <Icon name="branches" size={14} />
                          <span>Inter-Branch Reallocation</span>
                        </button>
                      </div>
                    </div>

                    {clientTransferMode === "rep" ? (
                      <div className="manager-form-grid-2">
                        <label className="field-label" style={{ margin: 0 }}>
                          <span>Current Representative</span>
                          <input
                            disabled
                            value={selectedClient.salesRep || selectedClient.owner || "Unassigned"}
                            style={{ opacity: 0.7, background: "rgba(0,0,0,0.03)" }}
                          />
                        </label>

                        <label className="field-label" style={{ margin: 0 }}>
                          <span>New Assigned Sales Representative *</span>
                          <select
                            className="manager-filter-select"
                            value={targetRepName}
                            onChange={(e) => setTargetRepName(e.target.value)}
                          >
                            <option value="">Select receiving representative...</option>
                            {salesPeople.map((person) => {
                              const pName = typeof person === "string" ? person : person.name;
                              return (
                                <option key={pName} value={pName}>
                                  {pName} {person.role ? `(${person.role})` : ""}
                                </option>
                              );
                            })}
                          </select>
                        </label>
                      </div>
                    ) : (
                      <div className="manager-form-grid-2">
                        <label className="field-label" style={{ margin: 0 }}>
                          <span>Current Branch / Zone</span>
                          <input
                            disabled
                            value={selectedClient.branch || "West Zone (Mumbai)"}
                            style={{ opacity: 0.7, background: "rgba(0,0,0,0.03)" }}
                          />
                        </label>

                        <label className="field-label" style={{ margin: 0 }}>
                          <span>Destination Branch & Manager *</span>
                          <select
                            className="manager-filter-select"
                            value={targetBranchManagerId}
                            onChange={(e) => setTargetBranchManagerId(e.target.value)}
                          >
                            <option value="">Select destination branch...</option>
                            {mockTransferManagers.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name} — {m.branch}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    )}

                    <div className="manager-form-grid-2">
                      <label className="field-label" style={{ margin: 0 }}>
                        <span>Handover Effective Timeline</span>
                        <select
                          className="manager-filter-select"
                          value={effectiveDate}
                          onChange={(e) => setEffectiveDate(e.target.value)}
                        >
                          <option value="Immediate">Immediate Reassignment</option>
                          <option value="Next Billing Cycle">Next Billing Cycle</option>
                          <option value="End of Month">End of Current Month</option>
                        </select>
                      </label>

                      <label className="field-label" style={{ margin: 0 }}>
                        <span>Request Priority</span>
                        <select
                          className="manager-filter-select"
                          value={priority}
                          onChange={(e) => setPriority(e.target.value)}
                        >
                          <option value="Normal">Normal Priority</option>
                          <option value="High">High Priority</option>
                          <option value="Urgent">Urgent / Time-Sensitive</option>
                        </select>
                      </label>
                    </div>

                    <label className="field-label" style={{ margin: 0 }}>
                      <span>Transfer Reason & Handover Notes *</span>
                      <textarea
                        className="manager-textarea"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Detail the operational rationale for reallocating this client (e.g. rep workload, regional proximity, client request, specialization)..."
                        required
                      />
                    </label>
                  </div>
                )}

                {/* --- C. DELETE CLIENT FIELDS --- */}
                {selectedClient && selectedType === "Delete Client" && (
                  <div style={{ display: "grid", gap: 14 }}>
                    <div
                      style={{
                        padding: "12px 14px",
                        borderRadius: 10,
                        background: "rgba(244, 63, 94, 0.08)",
                        border: "1px solid rgba(244, 63, 94, 0.25)",
                        display: "flex",
                        gap: 12,
                        alignItems: "flex-start",
                      }}
                    >
                      <Icon name="alert" size={18} style={{ color: "#f43f5e", flexShrink: 0, marginTop: 2 }} />
                      <div style={{ fontSize: 12.5, lineHeight: 1.5, color: "#f43f5e" }}>
                        <strong>Account Deletion & Offboarding Warning</strong>
                        <p style={{ margin: "2px 0 0", opacity: 0.9 }}>
                          Deleting this account will remove active tracking for{" "}
                          <strong>{selectedClient.company || selectedClient.name}</strong> from the branch roster upon
                          Branch Manager approval. Existing payments and invoices will remain in audit history.
                        </p>
                      </div>
                    </div>

                    <div className="manager-form-grid-2">
                      <label className="field-label" style={{ margin: 0 }}>
                        <span>Deletion Category *</span>
                        <select
                          className="manager-filter-select"
                          value={deletionCategory}
                          onChange={(e) => setDeletionCategory(e.target.value)}
                        >
                          <option value="Client Opted Out / Project Terminated">
                            Client Opted Out / Project Terminated
                          </option>
                          <option value="Duplicate / Erroneous Record">Duplicate / Test Record</option>
                          <option value="Scheme Ineligibility / Bank Rejection">
                            Scheme Ineligibility / Bank Rejection
                          </option>
                          <option value="Unresponsive / Non-contactable Lead">
                            Unresponsive / Non-contactable Lead
                          </option>
                          <option value="Financial Default / Non-payment">Financial Default / Non-payment</option>
                          <option value="Other Operational Offboarding">Other Operational Offboarding</option>
                        </select>
                      </label>

                      <label className="field-label" style={{ margin: 0 }}>
                        <span>Financial Clearance Status</span>
                        <select
                          className="manager-filter-select"
                          value={financialStatus}
                          onChange={(e) => setFinancialStatus(e.target.value)}
                        >
                          <option value="All Invoices Settled / Zero Balance">
                            All Invoices Settled / Zero Balance
                          </option>
                          <option value="Waive Remaining Outstanding Dues">Waive Remaining Outstanding Dues</option>
                          <option value="No Invoices or Advance Paid">No Invoices or Advance Paid</option>
                        </select>
                      </label>

                      <label className="field-label" style={{ margin: 0 }}>
                        <span>Data Archival Mode</span>
                        <select
                          className="manager-filter-select"
                          value={dataRetention}
                          onChange={(e) => setDataRetention(e.target.value)}
                        >
                          <option value="Archive Record (Retain Audit History)">
                            Archive Record (Retain Audit History)
                          </option>
                          <option value="Permanent Database Purge">Permanent Database Purge</option>
                        </select>
                      </label>

                      <label className="field-label" style={{ margin: 0 }}>
                        <span>Request Urgency</span>
                        <select
                          className="manager-filter-select"
                          value={priority}
                          onChange={(e) => setPriority(e.target.value)}
                        >
                          <option value="Normal">Normal Priority</option>
                          <option value="High">High Priority</option>
                          <option value="Urgent">Urgent / Immediate Action</option>
                        </select>
                      </label>
                    </div>

                    <label className="field-label" style={{ margin: 0 }}>
                      <span>Offboarding Justification & Archival Reason *</span>
                      <textarea
                        className="manager-textarea"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Detail why this client account is being removed, resolution of pending schemes, and compliance audit trail..."
                        required
                      />
                    </label>
                  </div>
                )}
              </>
            )}

            {/* ========================================================================= */}
            {/* 2. SALES REPRESENTATIVE FLOWS                                             */}
            {/* ========================================================================= */}
            {targetCategory === "salesperson" && (
              <>
                <label className="field-label" style={{ margin: 0 }}>
                  <span style={{ fontWeight: 700 }}>Target Sales Representative *</span>
                  <select
                    className="manager-filter-select"
                    value={selectedSalespersonId}
                    onChange={(event) => setSelectedSalespersonId(event.target.value)}
                  >
                    <option value="">Choose a representative...</option>
                    {salesPeople.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.name} ({person.role} • {person.branch || "Branch"})
                      </option>
                    ))}
                  </select>
                </label>

                {selectedSalesperson && (
                  <div style={{ display: "grid", gap: 16 }}>
                    <div
                      className="manager-modal-profile"
                      style={{
                        margin: 0,
                        padding: 12,
                        borderRadius: 12,
                        background: "rgba(140, 95, 248, 0.06)",
                        border: "1px solid rgba(140, 95, 248, 0.14)",
                      }}
                    >
                      <div className="manager-modal-avatar" style={{ width: 44, height: 44, fontSize: 15 }}>
                        {salespersonInitials}
                      </div>
                      <div>
                        <strong style={{ fontSize: 15, display: "block" }}>{selectedSalesperson.name}</strong>
                        <span style={{ fontSize: 12.5, color: "#7a748e" }}>
                          {selectedSalesperson.role} • {selectedSalesperson.branch || "Branch"} • Quota:{" "}
                          {selectedSalesperson.quota || "₹100k"}
                        </span>
                      </div>
                    </div>

                    {selectedType === "Edit Salesperson" ? (
                      <>
                        <div className="manager-form-grid-2">
                          <label className="field-label" style={{ margin: 0 }}>
                            <span>Full Name</span>
                            <input name="name" value={salesFormValues.name} onChange={handleSalesFieldChange} />
                          </label>

                          <label className="field-label" style={{ margin: 0 }}>
                            <span>Designation / Role</span>
                            <input name="role" value={salesFormValues.role} onChange={handleSalesFieldChange} />
                          </label>

                          <label className="field-label" style={{ margin: 0 }}>
                            <span>Email Address</span>
                            <input name="email" value={salesFormValues.email} onChange={handleSalesFieldChange} />
                          </label>

                          <label className="field-label" style={{ margin: 0 }}>
                            <span>Phone Number</span>
                            <input name="phone" value={salesFormValues.phone} onChange={handleSalesFieldChange} />
                          </label>

                          <label className="field-label" style={{ margin: 0 }}>
                            <span>Assigned Territory</span>
                            <input name="region" value={salesFormValues.region} onChange={handleSalesFieldChange} />
                          </label>

                          <label className="field-label" style={{ margin: 0 }}>
                            <span>Monthly Target Quota</span>
                            <input name="quota" value={salesFormValues.quota} onChange={handleSalesFieldChange} />
                          </label>
                        </div>

                        <label className="field-label" style={{ margin: 0 }}>
                          <span>Justification & Reason for Edit *</span>
                          <textarea
                            className="manager-textarea"
                            value={reason}
                            onChange={(event) => setReason(event.target.value)}
                            placeholder="Explain why these field changes are necessary..."
                            required
                          />
                        </label>
                      </>
                    ) : (
                      <label className="field-label" style={{ margin: 0 }}>
                        <span>Reason for Account Deletion *</span>
                        <textarea
                          className="manager-textarea"
                          value={reason}
                          onChange={(event) => setReason(event.target.value)}
                          placeholder="Specify offboarding reasons and client account reallocation plan..."
                          required
                        />
                      </label>
                    )}
                  </div>
                )}
              </>
            )}

            {formError && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "rgba(244, 63, 94, 0.12)",
                  border: "1px solid rgba(244, 63, 94, 0.3)",
                  color: "#f43f5e",
                  fontSize: 12.5,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 10,
                }}
              >
                <Icon name="alert" size={16} />
                <span>{formError}</span>
              </div>
            )}

            {/* Modal Bottom Actions */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: 12,
                marginTop: 8,
                paddingTop: 12,
                borderTop: "1px solid rgba(140, 95, 248, 0.12)",
              }}
            >
              <button className="manager-btn-secondary" type="button" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </button>
              <button
                className={selectedType.includes("Delete") ? "manager-btn-danger" : "manager-btn-primary"}
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                <Icon name={selectedType.includes("Delete") ? "alert" : isSubmitting ? "clock" : "check"} size={15} />
                <span>
                  {isSubmitting
                    ? "Submitting..."
                    : selectedType.includes("Delete")
                      ? "Submit Deletion Petition"
                      : selectedType.includes("Transfer")
                        ? "Submit Transfer Request"
                        : "Submit Edit Request"}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
