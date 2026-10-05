import { ACTIVITY_STAGES } from "../Admin/mockAdminData";
import { generateInvoiceHTML } from "../../utils/invoiceGenerator";

export const navItems = [
  { icon: "dashboard", label: "Dashboard" },
  { icon: "clients", label: "Clients" },
  { icon: "agreement", label: "Agreement" },
  { icon: "team", label: "Employees" },
  { icon: "revenue", label: "Revenue" },
  { icon: "invoice", label: "Invoice" },
  { icon: "requests", label: "Requests" },
];

export const revenueKpiCards = [
  {
    label: "Daily Revenue",
    value: "₹14,250",
    trend: "+12%",
    description: "Generated today",
    accent: "#10b981",
    icon: "revenue",
    linkTo: "Revenue",
    slug: "daily-revenue",
  },
  {
    label: "Weekly Revenue",
    value: "₹98,400",
    trend: "+15%",
    description: "This week's collection",
    accent: "#6366f1",
    icon: "revenue",
    linkTo: "Revenue",
    slug: "weekly-revenue",
  },
  {
    label: "Monthly Revenue",
    value: "₹2,78,800",
    trend: "+22%",
    description: "Compared to last month",
    accent: "#f59e0b",
    icon: "revenue",
    linkTo: "Revenue",
    slug: "monthly-revenue",
  },
  {
    label: "Yearly Revenue",
    value: "₹32,45,000",
    trend: "+28%",
    description: "FY 2026-27 annual total",
    accent: "#8b5cf6",
    icon: "revenue",
    linkTo: "Revenue",
    slug: "yearly-revenue",
  },
  {
    label: "Total Payment Received",
    value: "₹24,80,000",
    trend: "+94%",
    description: "Collected from invoices",
    accent: "#059669",
    icon: "overview",
    linkTo: "Invoice",
    slug: "payment-received",
  },
  {
    label: "Total Payment Pending",
    value: "₹7,65,000",
    trend: "Outstanding",
    description: "Pending client dues",
    accent: "#dc2626",
    icon: "bell",
    linkTo: "Invoice",
    slug: "payment-pending",
  },
];

export const workforceKpiCards = [
  {
    label: "Total Clients",
    value: "248",
    trend: "+18%",
    description: "Active client accounts",
    accent: "#3b82f6",
    icon: "clients",
    linkTo: "Clients",
    slug: "clients",
  },
  {
    label: "Total Branch Managers",
    value: "7",
    trend: "+5%",
    description: "Branch performance leads",
    accent: "#0284c7",
    icon: "branches",
    linkTo: "Employees",
    employeeRole: "branch manager",
    slug: "branch-managers",
  },
  {
    label: "Total Sales Managers",
    value: "42",
    trend: "+8%",
    description: "Regional sales leads",
    accent: "#4f46e5",
    icon: "team",
    linkTo: "Employees",
    employeeRole: "manager",
    slug: "managers",
  },
  {
    label: "Sales Persons",
    value: "124",
    trend: "+12%",
    description: "Active sales reps",
    accent: "#14b8a6",
    icon: "team",
    linkTo: "Employees",
    employeeRole: "sales",
    slug: "sales",
  },
];

export const topPerformers = [
  { name: "Ariana Lee", role: "Branch Manager", score: "92%", detail: "Client growth +14%" },
  { name: "Priya Menon", role: "Branch Manager", score: "90%", detail: "Pipeline expansion" },
  { name: "Daniel Cruz", role: "Branch Manager", score: "88%", detail: "Customer retention" },
  { name: "Sara Reddy", role: "Branch Manager", score: "85%", detail: "Process improvements" },
  { name: "Kavya Patel", role: "Branch Manager", score: "82%", detail: "Team mentoring" },
  { name: "Mia Rose", role: "Sales Person", score: "89%", detail: "Lead conversion" },
  { name: "Noah Kim", role: "Sales Person", score: "87%", detail: "Revenue uplift" },
  { name: "Rohan Varma", role: "Sales Person", score: "84%", detail: "New accounts" },
  { name: "Meera Singh", role: "Sales Person", score: "80%", detail: "Deal closure" },
  { name: "Sonal Desai", role: "Sales Person", score: "78%", detail: "Cross-sell growth" },
  { name: "Eli Brooks", role: "Manager", score: "86%", detail: "Process efficiency" },
  { name: "Naveen Sharma", role: "Manager", score: "84%", detail: "Team coordination" },
  { name: "Ananya Gupta", role: "Manager", score: "82%", detail: "Budget control" },
  { name: "Rhea Kapoor", role: "Manager", score: "80%", detail: "Strategy execution" },
  { name: "Vikram Joshi", role: "Manager", score: "78%", detail: "Operational review" },
  { name: "Noah Kim", role: "IT", score: "83%", detail: "Revenue uplift" },
  { name: "Tara Singh", role: "IT", score: "81%", detail: "System automation" },
  { name: "Arjun Das", role: "IT", score: "79%", detail: "Support delivery" },
  { name: "Janet Paul", role: "IT", score: "76%", detail: "Infrastructure uptime" },
  { name: "Lina Abraham", role: "IT", score: "74%", detail: "App stability" },
  { name: "Sara Kim", role: "Admin", score: "79%", detail: "Operations stability" },
  { name: "Nisha Rao", role: "Admin", score: "77%", detail: "Policy compliance" },
  { name: "Isha Nair", role: "Admin", score: "75%", detail: "Resource planning" },
  { name: "Deepak Shah", role: "Admin", score: "72%", detail: "Team support" },
  { name: "Milan Das", role: "Admin", score: "70%", detail: "Documentation" },
];

export const activities = [
  {
    title: "New client added",
    detail: "A new retail account joined the pipeline.",
    time: "Just now",
    tone: "#9a74e9",
  },
  {
    title: "Lead assigned",
    detail: "4 fresh leads were routed to the sales team.",
    time: "1 hr ago",
    tone: "#4e7cff",
  },
  {
    title: "Revenue received",
    detail: "Invoice payment recorded for Q3 services.",
    time: "3 hrs ago",
    tone: "#44bfb0",
  },
  {
    title: "Manager activity",
    detail: "Ariana updated the client onboarding status.",
    time: "6 hrs ago",
    tone: "#f2aa38",
  },
];

export const notifications = [
  {
    title: "Approval request",
    detail: "Project budget increase pending review.",
    issuer: "Samuel Park",
    tone: "#aa83eb",
  },
  {
    title: "Team message",
    detail: "Sales team reached 82% of monthly goal.",
    issuer: "Mia Rose",
    tone: "#88cda4",
  },
  {
    title: "Policy alert",
    detail: "Renewal reminders sent to 12 clients.",
    issuer: "System",
    tone: "#f59e0b",
  },
];

export const services = [
  { name: "Certificate" },
  { name: "IT" },
  { name: "Marketing" },
];

export const initialOwnerClients = [];


export const initialOwnerEmployees = [];

export const initialInvoices = [];

export const initialRequests = [];

export const reportRoleOptions = [
  { label: 'All roles', value: '' },
  { label: 'Branch Manager', value: 'branch manager' },
  { label: 'Manager', value: 'manager' },
  { label: 'Admin', value: 'admin' },
  { label: 'Sales Person', value: 'sales' },
  { label: 'It', value: 'IT' },
  { label: 'Marketing', value: 'market' },
];

export const branchOptions = [
  { label: 'All branches', value: '' },
  { label: 'North', value: 'North' },
  { label: 'South', value: 'South' },
  { label: 'East', value: 'East' },
  { label: 'West', value: 'West' },
];

export const regionOptions = [
  { label: 'All regions', value: '' },
  { label: 'North Zone', value: 'North Zone' },
  { label: 'South Zone', value: 'South Zone' },
  { label: 'East Zone', value: 'East Zone' },
  { label: 'West Zone', value: 'West Zone' },
];

export const employeeRoles = ['All roles', 'branch manager', 'manager', 'IT', 'admin', 'market', 'sales'];

export const monthNamesList = ["All", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export const revenueSeries = {
  daily: [
    { label: 'Mon', value: 18000 },
    { label: 'Tue', value: 22000 },
    { label: 'Wed', value: 20500 },
    { label: 'Thu', value: 26000 },
    { label: 'Fri', value: 24000 },
    { label: 'Sat', value: 29000 },
  ],
  weekly: [
    { label: 'W1', value: 86000 },
    { label: 'W2', value: 94000 },
    { label: 'W3', value: 101000 },
    { label: 'W4', value: 112000 },
  ],
  monthly: [
    { label: 'Jan', value: 72000 },
    { label: 'Feb', value: 84000 },
    { label: 'Mar', value: 91000 },
    { label: 'Apr', value: 98000 },
    { label: 'May', value: 108000 },
    { label: 'Jun', value: 121000 },
  ],
  yearly: [
    { label: '2021', value: 480000 },
    { label: '2022', value: 620000 },
    { label: '2023', value: 760000 },
    { label: '2024', value: 910000 },
    { label: '2025', value: 1040000 },
  ],
  allTime: [
    { label: '2019', value: 320000 },
    { label: '2020', value: 470000 },
    { label: '2021', value: 620000 },
    { label: '2022', value: 760000 },
    { label: '2023', value: 920000 },
    { label: '2024', value: 1080000 },
  ],
};

export const branchToRegionMap = {
  'North': 'North Zone',
  'South': 'South Zone',
  'East': 'East Zone',
  'West': 'West Zone',
  'Central': 'Central Zone'
};

export function generateYearlySeries(employee) {
  const base = 50000 + (employee.id || 1) * 2000;
  const series = [];
  for (let i = 0; i < 12; i++) {
    const seasonal = 0.72 + i * 0.02;
    const seed = (((employee.id || 1) * 7 + i * 3) % 11) * 0.01;
    const v = Math.round(base * (seasonal + seed));
    series.push(v);
  }
  return series;
}

export function downloadInvoiceFile(inv, onSuccess) {
  const htmlContent = generateInvoiceHTML(inv);

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  }

  const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const cleanId = (inv.id || "Invoice").replace(/\//g, "-");
  link.download = `${cleanId}_Agnivridhi_${(inv.type || "Invoice").replace(/\s+/g, "_")}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  if (typeof onSuccess === 'function') {
    onSuccess(`Downloaded official invoice receipt for ${inv.id}!`);
  }
}
