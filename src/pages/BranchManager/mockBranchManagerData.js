export const branchRevenueData = [
  { branch: "North", revenue: 0 },
  { branch: "South", revenue: 0 },
  { branch: "East", revenue: 0 },
  { branch: "West", revenue: 0 },
];

export const kpiCards = [
  { label: "Total Regional Managers", value: "1", trend: "Sales Managers", description: "Sales managers in branch", accent: "#9a74e9", linkTo: "Employees" },
  { label: "Total Employees", value: "9", trend: "Live DB", description: "Staff in branch (excl. manager)", accent: "#4e7cff", linkTo: "Employees" },
  { label: "Active Clients", value: "0", trend: "Live DB", description: "Currently active", accent: "#44bfb0", linkTo: "Clients" },
  { label: "Pending Requests", value: "0", trend: "All Clear", description: "Awaiting action", accent: "#f2aa38", linkTo: "Requests" },
  { label: "Branch Revenue", value: "₹0", description: "Payments minus 18% GST", accent: "#f97316", linkTo: "Revenue" },
];

export const initialBranchManagerClients = [];

export const initialBranchAdmins = [];
export const initialBranchIT = [];
export const initialBranchMarketing = [];
export const initialEmployeesList = [];

export const revenueSeries = {
  daily: [
    { label: "Mon", value: 0 },
    { label: "Tue", value: 0 },
    { label: "Wed", value: 0 },
    { label: "Thu", value: 0 },
    { label: "Fri", value: 0 },
    { label: "Sat", value: 0 },
  ],
  weekly: [
    { label: "W1", value: 0 },
    { label: "W2", value: 0 },
    { label: "W3", value: 0 },
    { label: "W4", value: 0 },
  ],
  monthly: [
    { label: "Jan", value: 0 },
    { label: "Feb", value: 0 },
    { label: "Mar", value: 0 },
    { label: "Apr", value: 0 },
    { label: "May", value: 0 },
    { label: "Jun", value: 0 },
    { label: "Jul", value: 0 },
    { label: "Aug", value: 0 },
    { label: "Sep", value: 0 },
    { label: "Oct", value: 0 },
    { label: "Nov", value: 0 },
    { label: "Dec", value: 0 },
  ],
  yearly: [
    { label: "2021", value: 0 },
    { label: "2022", value: 0 },
    { label: "2023", value: 0 },
    { label: "2024", value: 0 },
    { label: "2025", value: 0 },
  ],
  allTime: [
    { label: "2019", value: 0 },
    { label: "2020", value: 0 },
    { label: "2021", value: 0 },
    { label: "2022", value: 0 },
    { label: "2023", value: 0 },
    { label: "2024", value: 0 },
  ],
};
