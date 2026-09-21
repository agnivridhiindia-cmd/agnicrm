import React, { useState } from "react";
import SimpleModal from "../../components/SimpleModal";
import EditForm from "../../components/EditForm";

export default function ManagerClientInfoModal({ client, onClose, onSave }) {
  const [editMode, setEditMode] = useState(false);
  const [editValues, setEditValues] = useState(client);

  if (!client) return null;

  function handleChange(event) {
    const { name, value } = event.target;
    setEditValues((prev) => ({ ...prev, [name]: value }));
  }

  function handleSave() {
    if (onSave) {
      onSave(editValues);
    }
    setEditMode(false);
  }

  function handleCancel() {
    setEditValues(client);
    setEditMode(false);
  }

  const initials = client.name
    ? client.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "CL";

  return (
    <SimpleModal onClose={onClose}>
      <div className="manager-modal-profile">
        <div className="manager-modal-avatar">{initials}</div>
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 800 }}>{client.name}</h2>
          <span style={{ color: "#7a748e", fontSize: 13 }}>{client.company || "Individual Account"}</span>
        </div>
      </div>

      {editMode ? (
        <div style={{ display: "grid", gap: 16 }}>
          <EditForm values={editValues} onChange={handleChange} />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
            <button className="manager-btn-secondary" type="button" onClick={handleCancel}>
              Cancel
            </button>
            <button className="manager-btn-primary" type="button" onClick={handleSave}>
              Save Changes
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="manager-modal-info-grid">
            <div className="manager-modal-card">
              <span className="manager-modal-card-label">Client Name</span>
              <span className="manager-modal-card-val">{client.name}</span>
            </div>
            <div className="manager-modal-card">
              <span className="manager-modal-card-label">Company / Business</span>
              <span className="manager-modal-card-val">{client.company || "—"}</span>
            </div>
            <div className="manager-modal-card">
              <span className="manager-modal-card-label">Assigned Sales Representative</span>
              <span className="manager-modal-card-val" style={{ color: "#8c5ff8" }}>{client.salesRep || "Unassigned"}</span>
            </div>
            <div className="manager-modal-card">
              <span className="manager-modal-card-label">Email Address</span>
              <span className="manager-modal-card-val">{client.email}</span>
            </div>
            <div className="manager-modal-card">
              <span className="manager-modal-card-label">Phone Number</span>
              <span className="manager-modal-card-val" style={{ fontFamily: "monospace" }}>{client.phone}</span>
            </div>
            <div className="manager-modal-card">
              <span className="manager-modal-card-label">Service Tier</span>
              <span className="manager-modal-card-val" style={{ color: "#3b82f6" }}>{client.service || "Standard"}</span>
            </div>
            <div className="manager-modal-card">
              <span className="manager-modal-card-label">Onboarding Date</span>
              <span className="manager-modal-card-val">
                {client.startDate || (client.createdAt ? String(client.createdAt).split("T")[0] : "—")}
              </span>
            </div>
            <div className="manager-modal-card">
              <span className="manager-modal-card-label">Contract Revenue Value</span>
              <span className="manager-modal-card-val" style={{ color: "#10b981", fontWeight: 800 }}>
                {client.revenue || (client.totalPayment ? `₹${Number(client.totalPayment).toLocaleString("en-IN")}` : "—")}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
            <button className="manager-btn-primary" type="button" onClick={() => setEditMode(true)}>
              Edit Client Profile
            </button>
          </div>
        </>
      )}
    </SimpleModal>
  );
}
