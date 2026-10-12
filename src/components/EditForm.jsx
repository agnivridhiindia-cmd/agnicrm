import React from "react";

const FIELD_LABELS = {
  name: "Full Name",
  clientName: "Client Name",
  company: "Company / Organization",
  email: "Email Address",
  phone: "Contact Phone",
  serviceType: "Service Type",
  serviceName: "Scheme / Service Name",
  role: "Designation / Role",
  branch: "Branch Office",
  region: "Operating Region",
  totalPayment: "Total Mandate Amount (₹)",
  paymentReceived: "Payment Received (₹)",
  reportingManager: "Reporting Manager",
  branchManager: "Branch Manager",
  status: "Account Status",
  address: "Registered Address",
  targetQuota: "Monthly Target Quota (₹)",
  quota: "Monthly Target Quota (₹)",
};

export default function EditForm({ values = {}, onChange }) {
  const formatLabel = (field) => {
    if (FIELD_LABELS[field]) return FIELD_LABELS[field];
    return field
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase());
  };

  return (
    <div className="edit-form-grid">
      {Object.entries(values).map(([field, value]) => {
        const isNumeric = typeof value === "number" || field.toLowerCase().includes("payment") || field.toLowerCase().includes("amount") || field.toLowerCase().includes("quota");
        return (
          <label key={field} className="edit-form-field">
            <span className="edit-form-label-text">{formatLabel(field)}</span>
            <input
              name={field}
              value={value ?? ""}
              onChange={onChange}
              type={isNumeric ? "number" : field === "email" ? "email" : "text"}
              placeholder={`Enter ${formatLabel(field).toLowerCase()}...`}
              className="edit-form-input"
            />
          </label>
        );
      })}
    </div>
  );
}
