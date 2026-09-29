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
    value: "48",
    trend: "+12%",
    description: "Active this month",
    accent: "#4e7cff",
    linkTo: "Team",
    slug: "managers",
  },
  {
    label: "Open deals",
    value: "32",
    trend: "+9%",
    description: "In progress",
    accent: "#44bfb0",
    linkTo: "Clients",
    slug: "sales",
  },
  {
    label: "Closed this month",
    value: "18",
    trend: "+21%",
    description: "Won opportunities",
    accent: "#9a74e9",
    slug: "clients",
  },
];

export const teamPerformance = [
  { name: "Mia Rose", role: "Senior Sales", score: "92%", detail: "Top conversion" },
  { name: "Ariana Lee", role: "Branch Lead", score: "88%", detail: "Highest client growth" },
  { name: "Eli Brooks", role: "Operations", score: "84%", detail: "Process efficiency" },
  { name: "Noah Kim", role: "Support", score: "81%", detail: "Response quality" },
  { name: "Priya Menon", role: "Assistant", score: "77%", detail: "Follow up speed" },
];

export const salesTeam = [
  // --- WEST ZONE (MUMBAI) ---
  {
    id: 1,
    name: "Mia Rose",
    role: "Senior Sales Representative",
    branch: "West Zone (Mumbai)",
    branchManager: "Ariana Lee",
    email: "mia@agni.com",
    phone: "+91 91234 10101",
    region: "West Zone",
    quota: "₹80k",
    monthlySales: "₹0",
    joiningDate: "2024-02-15",
  },
  {
    id: 2,
    name: "Lucas Scott",
    role: "Sales Executive",
    branch: "West Zone (Mumbai)",
    branchManager: "Ariana Lee",
    email: "lucas@agni.com",
    phone: "+91 91234 10104",
    region: "West Zone",
    quota: "₹80k",
    monthlySales: "₹0",
    joiningDate: "2024-03-12",
  },

  // --- NORTH ZONE (DELHI) ---
  {
    id: 3,
    name: "Rohan Gupta",
    role: "Senior Sales Representative",
    branch: "North Zone (Delhi)",
    branchManager: "Rajesh Khanna",
    reportingManager: "Ananya Sen",
    email: "rohan.sales@agni.com",
    phone: "+91 91234 30301",
    region: "North Zone",
    quota: "₹80k",
    monthlySales: "₹0",
    joiningDate: "2024-01-10",
  },
  {
    id: 4,
    name: "Kavya Sharma",
    role: "Sales Executive",
    branch: "North Zone (Delhi)",
    branchManager: "Rajesh Khanna",
    reportingManager: "Ananya Sen",
    email: "kavya.sales@agni.com",
    phone: "+91 91234 30302",
    region: "North Zone",
    quota: "₹80k",
    monthlySales: "₹0",
    joiningDate: "2024-02-20",
  },
  {
    id: 5,
    name: "Arjun Hegde",
    role: "Senior Sales Officer",
    branch: "North Zone (Delhi)",
    branchManager: "Rajesh Khanna",
    reportingManager: "Ananya Sen",
    email: "arjun.sales@agni.com",
    phone: "+91 91234 20201",
    region: "North Zone",
    quota: "₹80k",
    monthlySales: "₹0",
    joiningDate: "2024-02-01",
  },

  // --- SOUTH ZONE (BENGALURU) ---
  {
    id: 6,
    name: "Deepa Rao",
    role: "Sales Executive",
    branch: "South Zone (Bengaluru)",
    branchManager: "Suresh Reddy",
    reportingManager: "Karthik Iyer",
    email: "deepa.sales@agni.com",
    phone: "+91 91234 20203",
    region: "South Zone",
    quota: "₹80k",
    monthlySales: "₹0",
    joiningDate: "2024-03-05",
  },

  // --- EAST ZONE (KOLKATA) ---
  {
    id: 7,
    name: "Sourav Das",
    role: "Senior Sales Executive",
    branch: "East Zone (Kolkata)",
    branchManager: "Subhash Banerjee",
    email: "sourav.sales@agni.com",
    phone: "+91 91234 40401",
    region: "East Zone",
    quota: "₹80k",
    monthlySales: "₹0",
    joiningDate: "2024-01-15",
  },
  {
    id: 8,
    name: "Riya Mukherjee",
    role: "Sales Specialist",
    branch: "East Zone (Kolkata)",
    branchManager: "Subhash Banerjee",
    email: "riya.sales@agni.com",
    phone: "+91 91234 40402",
    region: "East Zone",
    quota: "₹80k",
    monthlySales: "₹0",
    joiningDate: "2024-02-18",
  },
    joiningDate: "2024-02-18",
  },
];

export const managerClients = [
  {
    id: 1,
    name: "Bright Retail",
    company: "Bright Retail Pvt Ltd",
    email: "hello@brightretail.com",
    phone: "+91 98765 32100",
    service: "CRM Implementation",
    salesRep: "Mia Rose",
    assignedSalesPersonId: 1,
    branch: "East",
    revenue: "₹68k",
    startDate: "2024-03-02",
  },
  {
    id: 2,
    name: "Urban Foods",
    company: "Urban Foods Ltd",
    email: "sales@urbanfoods.com",
    phone: "+91 91234 55678",
    service: "Marketing Campaign",
    salesRep: "Mia Rose",
    assignedSalesPersonId: 1,
    branch: "East",
    revenue: "₹54k",
    startDate: "2024-04-18",
  },
  {
    id: 3,
    name: "Nova Textiles",
    company: "Nova Textiles Co",
    email: "contact@novatextiles.com",
    phone: "+91 99876 44556",
    service: "IT Support",
    salesRep: "Rohan Varma",
    assignedSalesPersonId: 2,
    branch: "South",
    revenue: "₹46k",
    startDate: "2024-05-09",
  },
];

export const activities = [
  { title: "Weekly pipeline review", detail: "Scheduled for Thursday at 10am.", time: "Just now", tone: "#9a74e9" },
  { title: "Client meeting prep", detail: "Finalize proposal deck for Kiran.", time: "1 hr ago", tone: "#4e7cff" },
  { title: "Deal follow-up", detail: "Reminder to reconnect with RMD Corp.", time: "3 hrs ago", tone: "#44bfb0" },
  { title: "Team coaching", detail: "Review conversion metrics with sales team.", time: "6 hrs ago", tone: "#f2aa38" },
];

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
