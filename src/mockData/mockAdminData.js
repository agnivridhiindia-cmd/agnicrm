export const initialBranches = [
  {
    id: "BR-01",
    name: "West Zone (Mumbai)",
    city: "Mumbai, Maharashtra",
    branchManager: "Unassigned",
    salesManager: "Unassigned",
    manager: "Unassigned",
    adminLead: "Unassigned",
    headcount: 0,
    employeeCount: 0,
    salesManagerCount: 0,
    activeClients: 0,
    target: "₹4,500,000",
    achieved: "₹0",
    status: "Active",
  },
  {
    id: "BR-02",
    name: "North Zone (Delhi)",
    city: "New Delhi, NCR",
    branchManager: "Unassigned",
    salesManager: "Unassigned",
    manager: "Unassigned",
    adminLead: "Unassigned",
    headcount: 0,
    employeeCount: 0,
    salesManagerCount: 0,
    activeClients: 0,
    target: "₹3,800,000",
    achieved: "₹0",
    status: "Active",
  },
  {
    id: "BR-03",
    name: "South Zone (Bengaluru)",
    city: "Bengaluru, Karnataka",
    branchManager: "Unassigned",
    salesManager: "Unassigned",
    manager: "Unassigned",
    adminLead: "Unassigned",
    headcount: 0,
    employeeCount: 0,
    salesManagerCount: 0,
    activeClients: 0,
    target: "₹4,200,000",
    achieved: "₹0",
    status: "Active",
  },
  {
    id: "BR-04",
    name: "East Zone (Kolkata)",
    city: "Kolkata, West Bengal",
    branchManager: "Unassigned",
    salesManager: "Unassigned",
    manager: "Unassigned",
    adminLead: "Unassigned",
    headcount: 0,
    employeeCount: 0,
    salesManagerCount: 0,
    activeClients: 0,
    target: "₹2,500,000",
    achieved: "₹0",
    status: "Active",
  },
];

import {
  getTrackerStages,
  getTrackerState,
  normalizeCompletedStages,
  getProcessTypeForScheme,
  getCanonicalSchemeName,
  TRACKER_STAGES_DEFINITIONS,
  SCHEME_PROCESS_TYPE_MAP,
} from "../utils/schemeTracker";

export {
  getTrackerStages,
  getTrackerState,
  normalizeCompletedStages,
  getProcessTypeForScheme,
  getCanonicalSchemeName,
  TRACKER_STAGES_DEFINITIONS,
  SCHEME_PROCESS_TYPE_MAP,
};

// Default generic 5-stage list (CRM Creation -> Agreement -> Reports -> Application -> Final)
export const ACTIVITY_STAGES = getTrackerStages("PMEGP");

export const APPLICATION_STAGES = ACTIVITY_STAGES;

export const initialBranchClients = [];

export const initialBranchTeam = [];

export const stageBadgeColors = {
  "CRM Creation": "#10b981",
  "Agreement": "#4e7cff",
  "Reports": "#9a74e9",
  "Application": "#f2aa38",
  "Interview": "#ec4899",
  "Final": "#10b981",
  "Submission": "#10b981",
  "Doc Audit": "#9a74e9",
  "Manager Review": "#f2aa38",
  "Final Approval": "#10b981",
  "Active & Disbursed": "#10b981",
  "Document Verification": "#9a74e9",
  Underwriting: "#f2aa38",
  Approved: "#26a69a",
  Submitted: "#4e7cff",
  "On Hold": "#ff9800",
  Rejected: "#ff5757",
};

export const formatCurrency = (val) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val || 0);

