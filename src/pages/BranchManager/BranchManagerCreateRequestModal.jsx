import React, { useMemo, useState, useEffect } from "react";
import Modal from "../../components/Modal";
import Icon from "../../components/Icon";

const clientActionTypes = [
  {
    type: "Edit Client",
    title: "Edit Client Account",
    desc: "Update commercial client profile, corporate data, service scheme, or contract valuation.",
    icon: "document",
    badge: "Account Modification",
    accent: "#3b82f6",
  },
  {
    type: "Transfer Client",
    title: "Transfer Client Account",
    desc: "Reassign client account under a different regional manager, sales executive, or branch zone.",
    icon: "team",
    badge: "Portfolio Transfer",
    accent: "#9a74e9",
  },
  {
    type: "Delete Client",
    title: "Delete / Offboard Client",
    desc: "Submit commercial client offboarding petition, archival, and account deactivation to Owner.",
    icon: "alert",
    badge: "Account Deactivation",
    accent: "#f43f5e",
  },
];

const staffActionTypes = [
  {
    type: "Edit Profile",
    title: "Edit Staff Profile",
    desc: "Update employee designation, contact details, region, or targets.",
    icon: "document",
    badge: "Profile & Quotas",
    accent: "#4e7cff",
  },
  {
    type: "Transfer Staff",
    title: "Transfer Staff Member",
    desc: "Reassign team member to another branch, zone, or manager.",
    icon: "team",
    badge: "Inter-Branch Transfer",
    accent: "#9a74e9",
  },
  {
    type: "Delete Staff",
    title: "Delete / Offboard Staff",
    desc: "Submit account deactivation petition and portfolio reallocation to Owner.",
    icon: "alert",
    badge: "Staff Offboarding",
    accent: "#f43f5e",
  },
];

const departments = [
  { id: "Manager", label: "Managers", icon: "managers" },
  { id: "Admin", label: "Admin Team", icon: "settings" },
  { id: "IT", label: "IT Team", icon: "overview" },
  { id: "Marketing", label: "Marketing Team", icon: "leads" },
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

const availableBranches = ["North", "South", "East", "West"];

const mockBranchManagers = [
  { branch: "North", manager: "Arun Patel" },
  { branch: "South", manager: "Suresh Reddy" },
  { branch: "East", manager: "Subhash Banerjee" },
  { branch: "West", manager: "Ariana Lee" },
];

const makeRequestId = () => `BMR-${Math.floor(1000 + Math.random() * 9000)}`;

export default function BranchManagerCreateRequestModal({
  employeesList = [],
  branchAdmins = [],
  branchIT = [],
  branchMarketing = [],
  clients = [],
  onClose,
  onSubmit,
  initialCategory = "client",
  initialType = "",
  initialClientId = "",
  initialStaffId = "",
}) {
  const [targetCategory, setTargetCategory] = useState(initialCategory); // 'client' | 'staff'
  const [selectedType, setSelectedType] = useState(initialType);
  const [reason, setReason] = useState("");
  const [priority, setPriority] = useState("High");

  // ================= CLIENT STATE =================
  const [selectedClientId, setSelectedClientId] = useState(initialClientId);
  const [clientTransferMode, setClientTransferMode] = useState("rep"); // 'rep' | 'branch'
  const [targetRepName, setTargetRepName] = useState("");
  const [clientDestinationBranch, setClientDestinationBranch] = useState("North");
  const [clientReceivingManager, setClientReceivingManager] = useState("Arun Patel");
  const [effectiveDate, setEffectiveDate] = useState("Immediate");
  const [deletionCategory, setDeletionCategory] = useState("Client Opted Out / Project Terminated");
  const [financialStatus, setFinancialStatus] = useState("All Invoices Settled / Zero Balance");
  const [dataRetention, setDataRetention] = useState("Archive Record (Retain Audit History)");

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

  // ================= STAFF STATE =================
  const [selectedDept, setSelectedDept] = useState("Manager");
  const [selectedStaffId, setSelectedStaffId] = useState(initialStaffId);
  const [destinationBranch, setDestinationBranch] = useState("North");
  const [receivingManager, setReceivingManager] = useState("Priya Menon");
  const [staffFormValues, setStaffFormValues] = useState({
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

    // Default next rep candidate from managers or team
    const currentRep = String(selectedClient.salesRep || selectedClient.owner || "").toLowerCase().trim();
    const otherRep = employeesList.find((p) => {
      const pName = (p.name || "").toLowerCase().trim();
      return pName && pName !== currentRep;
    });
    if (otherRep) {
      setTargetRepName(otherRep.name);
    }
  }, [selectedClient, employeesList]);

  // Sync client receiving manager when destination branch changes
  useEffect(() => {
    const found = mockBranchManagers.find((m) => m.branch === clientDestinationBranch);
    if (found) {
      setClientReceivingManager(found.manager);
    }
  }, [clientDestinationBranch]);

  // Get department staff list
  const departmentStaff = useMemo(() => {
    if (selectedDept === "Manager") {
      return employeesList.filter((e) => e.role === "manager" || e.role?.toLowerCase().includes("manager"));
    }
    if (selectedDept === "Admin") return branchAdmins;
    if (selectedDept === "IT") return branchIT;
    if (selectedDept === "Marketing") return branchMarketing;
    return [];
  }, [selectedDept, employeesList, branchAdmins, branchIT, branchMarketing]);

  // Default selected staff when dept changes
  useEffect(() => {
    if (departmentStaff.length > 0) {
      setSelectedStaffId(String(departmentStaff[0].id));
    } else {
      setSelectedStaffId("");
    }
  }, [selectedDept, departmentStaff]);

  const selectedStaff = useMemo(
    () => departmentStaff.find((s) => String(s.id) === String(selectedStaffId)) || departmentStaff[0],
    [departmentStaff, selectedStaffId]
  );

  useEffect(() => {
    if (!selectedStaff) {
      setStaffFormValues({ name: "", role: "", email: "", phone: "", region: "", quota: "" });
      return;
    }

    setStaffFormValues({
      name: selectedStaff.name || "",
      role: selectedStaff.role || selectedStaff.designation || "",
      email: selectedStaff.email || "",
      phone: selectedStaff.phone || "",
      region: selectedStaff.branch || selectedStaff.region || "East",
      quota: selectedStaff.quota || "",
    });
  }, [selectedStaff]);

  const handleClientFieldChange = (e) => {
    const { name, value } = e.target;
    setClientFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleStaffFieldChange = (e) => {
    const { name, value } = e.target;
    setStaffFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedType) return;

    // ================= CLIENT PETITION SUBMISSION =================
    if (targetCategory === "client") {
      if (!selectedClient) return;
      if (!reason.trim()) return;

      const requestedChanges = [];

      if (selectedType === "Edit Client") {
        if (clientFormValues.company && clientFormValues.company !== (selectedClient.company || selectedClient.name || "")) {
          requestedChanges.push({ field: "Company / Org Name", oldValue: selectedClient.company || selectedClient.name || "—", newValue: clientFormValues.company });
        }
        if (clientFormValues.contactPerson && clientFormValues.contactPerson !== (selectedClient.contactPerson || selectedClient.name || "")) {
          requestedChanges.push({ field: "Primary Contact", oldValue: selectedClient.contactPerson || selectedClient.name || "—", newValue: clientFormValues.contactPerson });
        }
        if (clientFormValues.email && clientFormValues.email !== (selectedClient.email || "")) {
          requestedChanges.push({ field: "Email Address", oldValue: selectedClient.email || "—", newValue: clientFormValues.email });
        }
        if (clientFormValues.phone && clientFormValues.phone !== (selectedClient.phone || "")) {
          requestedChanges.push({ field: "Phone Number", oldValue: selectedClient.phone || "—", newValue: clientFormValues.phone });
        }
        if (clientFormValues.scheme && clientFormValues.scheme !== (selectedClient.service || selectedClient.scheme || "")) {
          requestedChanges.push({ field: "Service Scheme", oldValue: selectedClient.service || selectedClient.scheme || "—", newValue: clientFormValues.scheme });
        }
        if (clientFormValues.totalPayment && String(clientFormValues.totalPayment) !== String(selectedClient.totalPayment || selectedClient.revenue || "")) {
          const oldVal = selectedClient.totalPayment || selectedClient.revenue || 0;
          requestedChanges.push({
            field: "Contract Valuation",
            oldValue: `₹${Number(oldVal).toLocaleString("en-IN")}`,
            newValue: `₹${Number(clientFormValues.totalPayment).toLocaleString("en-IN")}`,
          });
        }
        if (clientFormValues.businessType && clientFormValues.businessType !== (selectedClient.businessType || selectedClient.sector || "")) {
          requestedChanges.push({ field: "Industry Sector", oldValue: selectedClient.businessType || selectedClient.sector || "—", newValue: clientFormValues.businessType });
        }
        if (clientFormValues.assignedSalesPerson && clientFormValues.assignedSalesPerson !== (selectedClient.salesRep || selectedClient.owner || "")) {
          requestedChanges.push({ field: "Managing Sales Rep", oldValue: selectedClient.salesRep || selectedClient.owner || "—", newValue: clientFormValues.assignedSalesPerson });
        }
        if (clientFormValues.gstNumber && clientFormValues.gstNumber !== (selectedClient.gstNumber || "")) {
          requestedChanges.push({ field: "GSTIN Tax ID", oldValue: selectedClient.gstNumber || "—", newValue: clientFormValues.gstNumber });
        }

        if (requestedChanges.length === 0) {
          requestedChanges.push({ field: "Client Profile", oldValue: "Current Record", newValue: "Updated Commercial Terms" });
        }
      } else if (selectedType === "Transfer Client") {
        if (clientTransferMode === "rep") {
          if (!targetRepName) return;
          requestedChanges.push({
            field: "Assigned Sales Representative",
            oldValue: selectedClient.salesRep || selectedClient.owner || "Current Representative",
            newValue: targetRepName,
          });
          requestedChanges.push({
            field: "Transfer Governance Scope",
            oldValue: "Branch Portfolio Reallocation",
            newValue: `Effective: ${effectiveDate}`,
          });
        } else {
          requestedChanges.push({
            field: "Branch Reallocation",
            oldValue: `${selectedClient.branch || selectedClient.region || "Current"} Branch`,
            newValue: `${clientDestinationBranch} Regional Branch`,
          });
          requestedChanges.push({
            field: "Receiving Branch Lead",
            oldValue: "Current Branch Manager",
            newValue: `${clientReceivingManager} (${clientDestinationBranch} BM)`,
          });
        }
      } else if (selectedType === "Delete Client") {
        requestedChanges.push({ field: "Commercial Status", oldValue: "Active Client", newValue: "Deactivated / Marked for Archival" });
        requestedChanges.push({ field: "Offboarding Category", oldValue: "—", newValue: deletionCategory });
        requestedChanges.push({ field: "Financial Settlement", oldValue: "—", newValue: financialStatus });
        requestedChanges.push({ field: "Data Retention Mode", oldValue: "—", newValue: dataRetention });
      }

      const clientTitle = selectedClient.company || selectedClient.companyName || selectedClient.name || "Commercial Client";
      const request = {
        id: makeRequestId(),
        targetId: selectedClient.id,
        targetName: clientTitle,
        clientName: clientTitle,
        company: clientTitle,
        targetRole: "Commercial Client Account",
        targetBranch: selectedClient.branch || selectedClient.region || "West Zone",
        department: "Client Accounts",
        requestCategory: "Client Account",
        requestType: selectedType,
        destinationBranch: clientTransferMode === "branch" ? clientDestinationBranch : null,
        receivingManager: clientTransferMode === "branch" ? clientReceivingManager : targetRepName,
        requestedChanges,
        reason: reason.trim() || `Submitted ${selectedType} petition for ${clientTitle} to Owner.`,
        priority,
        recipient: "Owner",
        status: "Pending",
        createdAt: new Date().toISOString().split("T")[0],
        decisionDate: null,
        ownerRemarks: null,
      };

      onSubmit(request);
      onClose();
      return;
    }

    // ================= STAFF PETITION SUBMISSION =================
    if (targetCategory === "staff") {
      if (!selectedStaff) return;
      const requestedChanges = [];

      if (selectedType === "Edit Profile") {
        if (staffFormValues.name && staffFormValues.name !== selectedStaff.name) {
          requestedChanges.push({ field: "Name", oldValue: selectedStaff.name || "-", newValue: staffFormValues.name });
        }
        if (staffFormValues.role && staffFormValues.role !== selectedStaff.role) {
          requestedChanges.push({ field: "Role / Designation", oldValue: selectedStaff.role || "-", newValue: staffFormValues.role });
        }
        if (staffFormValues.email && staffFormValues.email !== selectedStaff.email) {
          requestedChanges.push({ field: "Email Address", oldValue: selectedStaff.email || "-", newValue: staffFormValues.email });
        }
        if (staffFormValues.phone && staffFormValues.phone !== selectedStaff.phone) {
          requestedChanges.push({ field: "Phone Number", oldValue: selectedStaff.phone || "-", newValue: staffFormValues.phone });
        }
        if (staffFormValues.region && staffFormValues.region !== (selectedStaff.branch || selectedStaff.region)) {
          requestedChanges.push({ field: "Branch / Region", oldValue: selectedStaff.branch || selectedStaff.region || "-", newValue: staffFormValues.region });
        }
        if (staffFormValues.quota && staffFormValues.quota !== selectedStaff.quota) {
          requestedChanges.push({ field: "Target Quota", oldValue: selectedStaff.quota || "-", newValue: staffFormValues.quota });
        }
      } else if (selectedType === "Transfer Staff") {
        requestedChanges.push({
          field: "Branch Transfer",
          oldValue: `${selectedStaff.branch || selectedStaff.region || "Current"} Branch`,
          newValue: `${destinationBranch} Regional Branch`,
        });
        requestedChanges.push({
          field: "Reporting Manager",
          oldValue: "Ariana Lee (West BM)",
          newValue: `${receivingManager} (${destinationBranch} BM)`,
        });
      } else if (selectedType === "Delete Staff") {
        requestedChanges.push({
          field: "Account Status",
          oldValue: "Active Personnel",
          newValue: "Deactivated / Offboarded",
        });
      }

      const request = {
        id: makeRequestId(),
        targetId: selectedStaff.id,
        targetName: selectedStaff.name,
        targetRole: selectedStaff.role,
        targetBranch: selectedStaff.branch || selectedStaff.region || "West",
        department: selectedDept,
        requestCategory: "Staff Governance",
        requestType: selectedType,
        destinationBranch: selectedType === "Transfer Staff" ? destinationBranch : null,
        receivingManager: selectedType === "Transfer Staff" ? receivingManager : null,
        requestedChanges,
        reason: reason.trim() || `Submitted ${selectedType} request for ${selectedStaff.name} to Owner.`,
        priority,
        recipient: "Owner",
        status: "Pending",
        createdAt: new Date().toISOString().split("T")[0],
        decisionDate: null,
        ownerRemarks: null,
      };

      onSubmit(request);
      onClose();
    }
  };

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

  const staffInitials = selectedStaff?.name
    ? selectedStaff.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "ST";

  const activeActionCards = targetCategory === "client" ? clientActionTypes : staffActionTypes;

  const isClientSubmitDisabled =
    !reason.trim() ||
    !selectedClientId ||
    (selectedType === "Transfer Client" && clientTransferMode === "rep" && !targetRepName);

  return (
    <Modal title="Create Governance Request to Owner" onClose={onClose} closeLabel="Close">
      <div className="bm-modal-wrapper">
        {!selectedType ? (
          <div>
            <p className="bm-header-eyebrow bm-modal-step-eyebrow">Step 1: Select Request Category</p>
            <h2 className="bm-modal-heading">What request do you want to submit to Owner?</h2>
            <p className="bm-modal-desc">
              Select whether you are requesting client account governance (Edit, Transfer, Delete) or branch staff governance for managers, admin, IT, or marketing personnel.
            </p>

            {/* Segmented Category Filter Strip */}
            <div className="bm-target-segmented" style={{ marginBottom: 18 }}>
              <button
                type="button"
                className={`bm-target-btn ${targetCategory === "client" ? "active" : ""}`}
                onClick={() => setTargetCategory("client")}
              >
                <Icon name="clients" size={15} />
                <span>Client Accounts</span>
                <span className="bm-target-badge">{clients.length || 3}</span>
              </button>
              <button
                type="button"
                className={`bm-target-btn ${targetCategory === "staff" ? "active" : ""}`}
                onClick={() => setTargetCategory("staff")}
              >
                <Icon name="team" size={15} />
                <span>Staff Governance</span>
                <span className="bm-target-badge">{employeesList.length || 4}</span>
              </button>
            </div>

            {/* 3 Action Cards for Active Category */}
            <div className="bm-modal-cards-grid">
              {activeActionCards.map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setSelectedType(item.type)}
                  style={{ border: `1.5px solid ${item.accent}33` }}
                  className="bm-modal-type-btn sales-req-type-card"
                >
                  <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                    <div
                      className="bm-modal-type-icon"
                      style={{
                        background: `${item.accent}1a`,
                        color: item.accent,
                      }}
                    >
                      <Icon name={item.icon} size={20} />
                    </div>
                    <span className="bm-action-pill-tag">{item.badge}</span>
                  </div>
                  <strong className="bm-modal-type-title">{item.title}</strong>
                  <small className="bm-modal-type-sub">{item.desc}</small>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bm-modal-form">
            {/* Header info banner with back button */}
            <div className="bm-modal-recipient-banner">
              <div>
                <span className="bm-modal-recipient-tag">
                  {targetCategory === "client" ? "🏢 Recipient: Owner Governance (Clients)" : "👥 Recipient: Owner Governance (Staff)"}
                </span>
                <h3 className="bm-req-card-title">{selectedType} Request</h3>
              </div>
              <button
                type="button"
                className="sales-btn-secondary bm-modal-change-type-btn"
                onClick={() => setSelectedType("")}
              >
                ← Change type
              </button>
            </div>

            {/* ========================================================================= */}
            {/* 1. CLIENT ACCOUNT FLOWS                                                   */}
            {/* ========================================================================= */}
            {targetCategory === "client" && (
              <>
                {/* Select Target Client */}
                <label className="field-label">
                  <span>
                    Select Commercial Client Account <span className="bm-req-action-del">*</span>
                  </span>
                  <select
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="bm-req-filter-select-input"
                    required
                  >
                    <option value="">Choose a client account to submit governance request...</option>
                    {clients.map((c) => {
                      const cName = c.company || c.name || "Client";
                      const rep = c.salesRep || c.owner || "Unassigned";
                      const scheme = c.service || c.scheme || "Standard";
                      return (
                        <option key={c.id} value={c.id}>
                          {cName} — Contact: {c.contactPerson || c.name || "N/A"} ({rep} • {scheme})
                        </option>
                      );
                    })}
                  </select>
                </label>

                {/* Selected Client Card Snapshot */}
                {selectedClient && (
                  <div className="bm-modal-staff-preview">
                    <div className="bm-modal-staff-avatar">{clientInitials}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                        <strong style={{ fontSize: 15 }}>{selectedClient.company || selectedClient.name}</strong>
                        <span className="stage-tag active" style={{ fontSize: 11 }}>
                          {selectedClient.service || selectedClient.scheme || "Consultancy"}
                        </span>
                      </div>
                      <small className="bm-req-subtext" style={{ display: "block", marginTop: 4 }}>
                        Contact: {selectedClient.contactPerson || selectedClient.name || "N/A"} • Rep:{" "}
                        <strong style={{ color: "#8c5ff8" }}>{selectedClient.salesRep || selectedClient.owner || "Unassigned"}</strong> •
                        Rev: ₹{Number(selectedClient.totalPayment || selectedClient.revenue || 0).toLocaleString("en-IN")}
                      </small>
                    </div>
                  </div>
                )}

                {/* --- A. EDIT CLIENT FIELDS --- */}
                {selectedClient && selectedType === "Edit Client" && (
                  <div className="bm-modal-fields-grid">
                    <label className="field-label">
                      <span>Company / Organization Name</span>
                      <input
                        name="company"
                        value={clientFormValues.company}
                        onChange={handleClientFieldChange}
                        placeholder="e.g. Apex Industries Pvt Ltd"
                      />
                    </label>

                    <label className="field-label">
                      <span>Primary Contact Person</span>
                      <input
                        name="contactPerson"
                        value={clientFormValues.contactPerson}
                        onChange={handleClientFieldChange}
                        placeholder="e.g. Rahul Sharma"
                      />
                    </label>

                    <label className="field-label">
                      <span>Email Address</span>
                      <input
                        type="email"
                        name="email"
                        value={clientFormValues.email}
                        onChange={handleClientFieldChange}
                        placeholder="corporate@client.com"
                      />
                    </label>

                    <label className="field-label">
                      <span>Phone / Mobile</span>
                      <input
                        name="phone"
                        value={clientFormValues.phone}
                        onChange={handleClientFieldChange}
                        placeholder="+91 98765 43210"
                      />
                    </label>

                    <label className="field-label">
                      <span>Service Scheme / Product</span>
                      <select
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

                    <label className="field-label">
                      <span>Contract Pitch Valuation (₹)</span>
                      <input
                        type="number"
                        name="totalPayment"
                        value={clientFormValues.totalPayment}
                        onChange={handleClientFieldChange}
                        placeholder="118000"
                      />
                    </label>

                    <label className="field-label">
                      <span>Industry / Sector</span>
                      <select
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

                    <label className="field-label">
                      <span>GSTIN / Tax ID</span>
                      <input
                        name="gstNumber"
                        value={clientFormValues.gstNumber}
                        onChange={handleClientFieldChange}
                        placeholder="27AAAAA0000A1Z5"
                      />
                    </label>
                  </div>
                )}

                {/* --- B. TRANSFER CLIENT FIELDS --- */}
                {selectedClient && selectedType === "Transfer Client" && (
                  <div style={{ display: "grid", gap: 14 }}>
                    <div>
                      <span className="field-label" style={{ margin: "0 0 6px", display: "block" }}>
                        Transfer Destination Category
                      </span>
                      <div className="bm-target-segmented">
                        <button
                          type="button"
                          className={`bm-target-btn ${clientTransferMode === "rep" ? "active" : ""}`}
                          onClick={() => setClientTransferMode("rep")}
                        >
                          <Icon name="user" size={14} />
                          <span>Reassign Sales Representative</span>
                        </button>
                        <button
                          type="button"
                          className={`bm-target-btn ${clientTransferMode === "branch" ? "active" : ""}`}
                          onClick={() => setClientTransferMode("branch")}
                        >
                          <Icon name="branches" size={14} />
                          <span>Inter-Branch Territory Transfer</span>
                        </button>
                      </div>
                    </div>

                    {clientTransferMode === "rep" ? (
                      <div className="bm-modal-fields-grid">
                        <label className="field-label">
                          <span>Current Assigned Representative</span>
                          <input
                            disabled
                            value={selectedClient.salesRep || selectedClient.owner || "Unassigned"}
                            style={{ opacity: 0.7 }}
                          />
                        </label>
                        <label className="field-label">
                          <span>New Assigned Sales Representative *</span>
                          <select
                            value={targetRepName}
                            onChange={(e) => setTargetRepName(e.target.value)}
                            required
                          >
                            <option value="">Select receiving representative...</option>
                            {employeesList.map((emp) => (
                              <option key={emp.name || emp.id} value={emp.name}>
                                {emp.name} ({emp.role || "Sales Lead"})
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    ) : (
                      <div className="bm-modal-fields-grid">
                        <label className="field-label">
                          <span>Target Destination Branch</span>
                          <select
                            value={clientDestinationBranch}
                            onChange={(e) => setClientDestinationBranch(e.target.value)}
                          >
                            {availableBranches.map((b) => (
                              <option key={b} value={b}>
                                {b} Regional Branch
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="field-label">
                          <span>Receiving Branch Manager</span>
                          <input
                            type="text"
                            value={clientReceivingManager}
                            onChange={(e) => setClientReceivingManager(e.target.value)}
                            placeholder="e.g. Arun Patel"
                            required
                          />
                        </label>
                      </div>
                    )}

                    <div className="bm-modal-fields-grid">
                      <label className="field-label">
                        <span>Transfer Handover Timeline</span>
                        <select value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)}>
                          <option value="Immediate">Immediate Handover</option>
                          <option value="Next Billing Cycle">Next Billing Cycle</option>
                          <option value="End of Month">End of Current Month</option>
                        </select>
                      </label>
                      <label className="field-label">
                        <span>Governance Urgency</span>
                        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                          <option value="Normal">Normal Priority</option>
                          <option value="High">High Priority</option>
                          <option value="Urgent">Urgent / Immediate Action</option>
                        </select>
                      </label>
                    </div>
                  </div>
                )}

                {/* --- C. DELETE CLIENT FIELDS --- */}
                {selectedClient && selectedType === "Delete Client" && (
                  <div style={{ display: "grid", gap: 14 }}>
                    <div
                      style={{
                        padding: "12px 14px",
                        borderRadius: 12,
                        background: "rgba(244, 63, 94, 0.08)",
                        border: "1px solid rgba(244, 63, 94, 0.25)",
                        display: "flex",
                        gap: 12,
                        alignItems: "flex-start",
                      }}
                    >
                      <Icon name="alert" size={18} style={{ color: "#f43f5e", flexShrink: 0, marginTop: 2 }} />
                      <div style={{ fontSize: 12.5, lineHeight: 1.5, color: "#f43f5e" }}>
                        <strong>Owner Governance: Account Offboarding Petition</strong>
                        <p style={{ margin: "2px 0 0", opacity: 0.9 }}>
                          Submitting this deletion petition will request the <strong>Owner</strong> to permanently deactivate and archive{" "}
                          <strong>{selectedClient.company || selectedClient.name}</strong>. Historic payments and ledger transactions will be frozen for compliance audit.
                        </p>
                      </div>
                    </div>

                    <div className="bm-modal-fields-grid">
                      <label className="field-label">
                        <span>Offboarding Category *</span>
                        <select value={deletionCategory} onChange={(e) => setDeletionCategory(e.target.value)}>
                          <option value="Client Opted Out / Project Terminated">
                            Client Opted Out / Project Terminated
                          </option>
                          <option value="Duplicate / Test Account Record">Duplicate / Test Account Record</option>
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

                      <label className="field-label">
                        <span>Financial Settlement Status</span>
                        <select value={financialStatus} onChange={(e) => setFinancialStatus(e.target.value)}>
                          <option value="All Invoices Settled / Zero Balance">
                            All Invoices Settled / Zero Balance
                          </option>
                          <option value="Waive Remaining Outstanding Dues">Waive Remaining Outstanding Dues</option>
                          <option value="No Invoices or Advance Paid">No Invoices or Advance Paid</option>
                        </select>
                      </label>

                      <label className="field-label">
                        <span>Data Retention Mode</span>
                        <select value={dataRetention} onChange={(e) => setDataRetention(e.target.value)}>
                          <option value="Archive Record (Retain Audit History)">
                            Archive Record (Retain Audit History)
                          </option>
                          <option value="Permanent Database Purge">Permanent Database Purge</option>
                        </select>
                      </label>

                      <label className="field-label">
                        <span>Request Urgency</span>
                        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                          <option value="Normal">Normal Priority</option>
                          <option value="High">High Priority</option>
                          <option value="Urgent">Urgent / Immediate Action</option>
                        </select>
                      </label>
                    </div>
                  </div>
                )}

                {/* Common Client Reason */}
                {selectedClient && (
                  <label className="field-label">
                    <span>
                      Governance Reason &amp; Statement to Owner <span className="bm-req-action-del">*</span>
                    </span>
                    <textarea
                      rows={3}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder={`Detail why this client ${selectedType.toLowerCase()} is required, operational benefits, and portfolio handover notes for the Owner...`}
                      className="sales-textarea"
                      required
                    />
                  </label>
                )}
              </>
            )}

            {/* ========================================================================= */}
            {/* 2. STAFF GOVERNANCE FLOWS (Existing)                                      */}
            {/* ========================================================================= */}
            {targetCategory === "staff" && (
              <>
                {/* Department Selector Tabs */}
                <div>
                  <label className="field-label bm-modal-step-eyebrow">
                    <span>Select Target Department / Team</span>
                  </label>
                  <div className="bm-modal-dept-grid">
                    {departments.map((dept) => {
                      const isSelected = selectedDept === dept.id;
                      return (
                        <button
                          key={dept.id}
                          type="button"
                          onClick={() => setSelectedDept(dept.id)}
                          className="bm-modal-dept-btn"
                          style={{
                            border: isSelected ? "1.5px solid #8c5ff8" : "1px solid rgba(255, 255, 255, 0.14)",
                            background: isSelected ? "rgba(140, 95, 248, 0.15)" : "rgba(255, 255, 255, 0.03)",
                            color: isSelected ? "#8c5ff8" : "inherit",
                            fontWeight: isSelected ? 800 : 600,
                          }}
                        >
                          <Icon name={dept.icon} size={14} />
                          <span>{dept.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Select Staff Member from that department */}
                <label className="field-label">
                  <span>
                    Select Employee from {selectedDept} Team <span className="bm-req-action-del">*</span>
                  </span>
                  <select
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                    className="bm-req-filter-select-input"
                    required
                  >
                    {departmentStaff.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.name} — {staff.role} ({staff.branch || staff.region || "East"})
                      </option>
                    ))}
                  </select>
                </label>

                {/* Selected staff card snapshot */}
                {selectedStaff && (
                  <div className="bm-modal-staff-preview">
                    <div className="bm-modal-staff-avatar">{staffInitials}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <strong style={{ fontSize: 14 }}>{selectedStaff.name}</strong>
                        <span className="stage-tag active" style={{ fontSize: 11 }}>
                          {selectedDept} Team
                        </span>
                      </div>
                      <small className="bm-req-subtext">
                        Role: {selectedStaff.role} • Email: {selectedStaff.email} • Branch:{" "}
                        {selectedStaff.branch || selectedStaff.region || "East"}
                      </small>
                    </div>
                  </div>
                )}

                {/* If Edit Profile: Show Editable Form */}
                {selectedType === "Edit Profile" && (
                  <div className="bm-modal-fields-grid">
                    <label className="field-label">
                      <span>Name</span>
                      <input
                        type="text"
                        name="name"
                        value={staffFormValues.name}
                        onChange={handleStaffFieldChange}
                        required
                      />
                    </label>
                    <label className="field-label">
                      <span>Role / Designation</span>
                      <input
                        type="text"
                        name="role"
                        value={staffFormValues.role}
                        onChange={handleStaffFieldChange}
                        required
                      />
                    </label>
                    <label className="field-label">
                      <span>Email</span>
                      <input
                        type="email"
                        name="email"
                        value={staffFormValues.email}
                        onChange={handleStaffFieldChange}
                        required
                      />
                    </label>
                    <label className="field-label">
                      <span>Phone Number</span>
                      <input
                        type="text"
                        name="phone"
                        value={staffFormValues.phone}
                        onChange={handleStaffFieldChange}
                      />
                    </label>
                    <label className="field-label">
                      <span>Assigned Region / Zone</span>
                      <input
                        type="text"
                        name="region"
                        value={staffFormValues.region}
                        onChange={handleStaffFieldChange}
                      />
                    </label>
                    {selectedDept === "Manager" && (
                      <label className="field-label">
                        <span>Target Quota</span>
                        <input
                          type="text"
                          name="quota"
                          value={staffFormValues.quota}
                          onChange={handleStaffFieldChange}
                          placeholder="e.g. ₹150k"
                        />
                      </label>
                    )}
                  </div>
                )}

                {/* If Transfer Staff: Destination branch & manager */}
                {selectedType === "Transfer Staff" && (
                  <div className="bm-modal-fields-grid">
                    <label className="field-label">
                      <span>Target Destination Branch</span>
                      <select
                        value={destinationBranch}
                        onChange={(e) => setDestinationBranch(e.target.value)}
                      >
                        {availableBranches.map((b) => (
                          <option key={b} value={b}>
                            {b} Regional Branch
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field-label">
                      <span>Receiving Branch Manager</span>
                      <input
                        type="text"
                        value={receivingManager}
                        onChange={(e) => setReceivingManager(e.target.value)}
                        placeholder="e.g. Priya Menon"
                        required
                      />
                    </label>
                  </div>
                )}

                {/* Reason / Justification to Owner */}
                <label className="field-label">
                  <span>
                    Reason &amp; Justification to Owner <span className="bm-req-action-del">*</span>
                  </span>
                  <textarea
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={`Explain why this ${selectedType.toLowerCase()} is needed for ${selectedStaff?.name || "this employee"}...`}
                    className="sales-textarea"
                    required
                  />
                </label>

                <div className="bm-modal-fields-grid">
                  <label className="field-label">
                    <span>Urgency / Priority</span>
                    <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                      <option value="Normal">Normal Priority</option>
                      <option value="High">High Priority</option>
                      <option value="Urgent">Urgent / Immediate</option>
                    </select>
                  </label>
                  <div style={{ display: "flex", alignItems: "flex-end" }}>
                    <span className="bm-req-subtext" style={{ fontSize: 12, lineHeight: 1.4 }}>
                      💡 This request will be submitted directly to the <strong>Owner</strong> governance queue for review and final sign-off.
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="bm-modal-footer">
              <button className="sales-btn-secondary" type="button" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className={selectedType.includes("Delete") ? "bm-btn-danger" : "manager-btn-primary bm-modal-submit-btn"}
                disabled={targetCategory === "client" ? isClientSubmitDisabled : !selectedStaffId || !reason.trim()}
              >
                <Icon name={selectedType.includes("Delete") ? "alert" : "checkCircle"} size={15} />
                <span>
                  {selectedType.includes("Delete")
                    ? "Submit Deletion Petition to Owner"
                    : selectedType.includes("Transfer")
                    ? "Submit Transfer Request to Owner"
                    : "Submit Request to Owner"}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
