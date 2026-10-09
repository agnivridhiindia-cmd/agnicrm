export const navItems = [
  { icon: "dashboard", label: "Dashboard" },
  { icon: "team", label: "Team" },
  { icon: "clients", label: "Clients" },
  { icon: "overview", label: "Requests" },
  { icon: "revenue", label: "Revenue" },
  { icon: "reports", label: "Reports" },
];

export const kpiCards = [
  {
    label: "Team members",
    value: "0",
    trend: "+0%",
    description: "Active this month",
    accent: "#4e7cff",
    linkTo: "Team",
    slug: "managers",
  },
  {
    label: "Open deals",
    value: "0",
    trend: "+0%",
    description: "In progress",
    accent: "#44bfb0",
    linkTo: "Clients",
    slug: "sales",
  },
  {
    label: "Closed this month",
    value: "0",
    trend: "+0%",
    description: "Won opportunities",
    accent: "#9a74e9",
    slug: "clients",
  },
];

export const teamPerformance = [];

export const salesTeam = [];

export const managerClients = [];

export const activities = [];

export const reportRoleOptions = [
  { label: 'All roles', value: '' },
  { label: 'Branch Manager', value: 'branch manager' },
  { label: 'Manager', value: 'manager' },
  { label: 'Senior Sales', value: 'Senior Sales' },
  { label: 'Sales Executive', value: 'Sales Executive' },
  { label: 'Sales Associate', value: 'Sales Associate' },
  { label: 'Sales Specialist', value: 'Sales Specialist' },
];

export const branchOptions = [
  { label: 'All branches', value: '' },
  { label: 'East', value: 'East' },
  { label: 'South', value: 'South' },
  { label: 'West', value: 'West' },
  { label: 'North', value: 'North' },
];

export const revenueSeries = {
  daily: [
    { label: 'Mon', value: 12000 },
    { label: 'Tue', value: 16000 },
    { label: 'Wed', value: 14500 },
    { label: 'Thu', value: 19000 },
    { label: 'Fri', value: 17000 },
    { label: 'Sat', value: 21000 },
  ],
  weekly: [
    { label: 'W1', value: 58000 },
    { label: 'W2', value: 64000 },
    { label: 'W3', value: 71000 },
    { label: 'W4', value: 82000 },
  ],
  monthly: [
    { label: 'Jan', value: 52000 },
    { label: 'Feb', value: 61000 },
    { label: 'Mar', value: 68000 },
    { label: 'Apr', value: 74000 },
    { label: 'May', value: 82000 },
    { label: 'Jun', value: 96000 },
  ],
  yearly: [
    { label: '2021', value: 340000 },
    { label: '2022', value: 450000 },
    { label: '2023', value: 560000 },
    { label: '2024', value: 680000 },
    { label: '2025', value: 810000 },
  ],
  allTime: [
    { label: '2019', value: 210000 },
    { label: '2020', value: 310000 },
    { label: '2021', value: 450000 },
    { label: '2022', value: 560000 },
    { label: '2023', value: 680000 },
    { label: '2024', value: 810000 },
  ],
};

export function generateYearlySeries(employee) {
  const base = 50000 + (employee?.id || 1) * 2000;
  return Array.from({ length: 12 }, (_, index) => {
    const seasonal = 0.72 + index * 0.02;
    const seed = (((employee?.id || 1) * 7 + index * 3) % 11) * 0.01;
    return Math.round(base * (seasonal + seed));
  });
}
