import React from "react";
import SimpleModal from "../../components/SimpleModal";
import { cleanBranchDisplay } from "../../utils/branchHelper";

export default function ManagerEmployeeInfoModal({ member, onClose, managerName }) {
  if (!member) return null;

  const initials = member.name
    ? member.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "SP";

  return (
    <SimpleModal onClose={onClose}>
      <div className="manager-modal-profile">
        <div className="manager-modal-avatar">{initials}</div>
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 800 }}>{member.name}</h2>
          <span className="manager-role-tag">{member.role}</span>
        </div>
      </div>

      <div className="manager-modal-info-grid">
        <div className="manager-modal-card">
          <span className="manager-modal-card-label">Assigned Branch</span>
          <span className="manager-modal-card-val">{cleanBranchDisplay(member.branch)}</span>
        </div>
        <div className="manager-modal-card">
          <span className="manager-modal-card-label">Branch Region</span>
          <span className="manager-modal-card-val">{member.region || "East Zone"}</span>
        </div>
        <div className="manager-modal-card">
          <span className="manager-modal-card-label">Reporting Manager</span>
          <span className="manager-modal-card-val">{member.branchManager || managerName || "Manager"}</span>
        </div>
        <div className="manager-modal-card">
          <span className="manager-modal-card-label">Joining Date</span>
          <span className="manager-modal-card-val">{member.joiningDate || "Jan 2025"}</span>
        </div>
        <div className="manager-modal-card">
          <span className="manager-modal-card-label">Email Address</span>
          <span className="manager-modal-card-val">{member.email}</span>
        </div>
        <div className="manager-modal-card">
          <span className="manager-modal-card-label">Phone Number</span>
          <span className="manager-modal-card-val" style={{ fontFamily: "monospace" }}>{member.phone}</span>
        </div>
        <div className="manager-modal-card">
          <span className="manager-modal-card-label">Monthly Target Quota</span>
          <span className="manager-modal-card-val" style={{ color: "#8c5ff8", fontWeight: 800 }}>{member.quota || "₹80k"}</span>
        </div>
        <div className="manager-modal-card">
          <span className="manager-modal-card-label">Monthly Sales Performance</span>
          <span className="manager-modal-card-val" style={{ color: "#10b981", fontWeight: 800 }}>{member.monthlySales || "₹0"}</span>
        </div>
      </div>
    </SimpleModal>
  );
}
