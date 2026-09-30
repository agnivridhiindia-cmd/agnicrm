import { ACTIVITY_STAGES } from "../pages/Admin/mockAdminData";
import { generateInvoiceHTML } from "../utils/invoiceGenerator";

export const navItems = [
  { icon: "dashboard", label: "Dashboard" },
  { icon: "clients", label: "Clients" },
  { icon: "agreement", label: "Agreement" },
  { icon: "team", label: "Employees" },
  { icon: "revenue", label: "Revenue" },
  { icon: "invoice", label: "Invoice" },
  { icon: "requests", label: "Requests" },
  { icon: "reports", label: "Reports" },
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
    label: "Total Managers",
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

export const initialOwnerClients = [
  { id: 1, name: 'Acme Industries', company: 'Acme Industries Pvt. Ltd.', email: 'contact@acme.com', phone: '+91 98765 43210', serviceType: 'Certificate', serviceName: 'PM MUDRA', serviceStart: '2026-01-15', totalPayment: 120000, paymentReceived: 80000, branch: 'North', salesPerson: 'Mia Rose', progressPercent: 80, completedSteps: ["Submission", "Doc Audit", "Manager Review", "Agreement"], applicationStatus: "Agreement" },
  { id: 2, name: 'Summit Co', company: 'Summit Co.', email: 'hello@summitco.com', phone: '+91 91234 56789', serviceType: 'IT', serviceName: 'Enterprise CRM Setup', serviceStart: '2026-03-01', totalPayment: 85000, paymentReceived: 50000, branch: 'South', salesPerson: 'Mia Rose', progressPercent: 60, completedSteps: ["Submission", "Doc Audit", "Manager Review"], applicationStatus: "Manager Review" },
  { id: 3, name: 'Blue Retail', company: 'Blue Retail Pvt Ltd', email: 'info@blueretail.com', phone: '+91 99876 54321', serviceType: 'Marketing', serviceName: 'Website & Brand Growth Suite', serviceStart: '2026-05-20', totalPayment: 60000, paymentReceived: 60000, branch: 'East', salesPerson: 'Mia Rose', progressPercent: 100, completedSteps: ["Submission", "Doc Audit", "Manager Review", "Agreement", "Final Approval"], applicationStatus: "Final Approval" },
  { id: 4, name: 'Nexus Logistics', company: 'Nexus Logistics Solutions', email: 'support@nexuslogistics.com', phone: '+91 98111 22233', serviceType: 'IT', serviceName: 'Supply Chain Analytics Platform', serviceStart: '2026-06-10', totalPayment: 150000, paymentReceived: 100000, branch: 'West', salesPerson: 'Lucas Scott', progressPercent: 40, completedSteps: ["Submission", "Doc Audit"], applicationStatus: "Doc Audit" },
  { id: 5, name: 'Apex Healthcare', company: 'Apex Healthcare Systems', email: 'info@apexhealth.com', phone: '+91 97222 33344', serviceType: 'Certificate', serviceName: 'Corporate Health Shield Annual', serviceStart: '2026-08-01', totalPayment: 42000, paymentReceived: 42000, branch: 'North', salesPerson: 'Lucas Scott', progressPercent: 100, completedSteps: ["Submission", "Doc Audit", "Manager Review", "Agreement", "Final Approval"], applicationStatus: "Final Approval" },
];

export const initialOwnerEmployees = [
  { id: 1, name: 'Ariana Lee', email: 'ariana@agni.com', phone: '+91 91234 00111', role: 'branch manager', branch: 'North', region: 'North Zone', reportingManager: 'Devika Shah' },
  { id: 2, name: 'Eli Brooks', email: 'eli@agni.com', phone: '+91 91234 00222', role: 'manager', branch: 'North', region: 'North Zone', branchManager: 'Ariana Lee', reportingManager: 'Ariana Lee' },
  { id: 3, name: 'Mia Rose', email: 'mia@agni.com', phone: '+91 91234 10101', role: 'sales', branch: 'North', region: 'North Zone', branchManager: 'Ariana Lee', reportingManager: 'Eli Brooks' },
  { id: 4, name: 'Noah Kim', email: 'noah@agni.com', phone: '+91 91234 10202', role: 'IT', branch: 'North', region: 'North Zone', branchManager: 'Ariana Lee', reportingManager: 'Ariana Lee' },
  { id: 5, name: 'Sara Kim', email: 'sara@agni.com', phone: '+91 91234 20202', role: 'admin', branch: 'North', region: 'North Zone', branchManager: 'Ariana Lee', reportingManager: 'Ariana Lee' },
  { id: 6, name: 'Daniel Cruz', email: 'daniel@agni.com', phone: '+91 91234 30303', role: 'market', branch: 'North', region: 'North Zone', branchManager: 'Ariana Lee', reportingManager: 'Ariana Lee' },
  { id: 7, name: 'Priya Menon', email: 'priya@agni.com', phone: '+91 91234 40404', role: 'admin', branch: 'South', region: 'South Zone', branchManager: 'Ariana Lee', reportingManager: 'Ariana Lee' },
  { id: 8, name: 'Lucas Scott', email: 'lucas@agni.com', phone: '+91 98205 55670', role: 'sales', branch: 'West', region: 'West Zone', branchManager: 'Ariana Lee', reportingManager: 'Eli Brooks' },
];

export const initialInvoices = [
  {
    id: "INV-2026-001",
    clientName: "Acme Industries",
    company: "Acme Industries Pvt. Ltd.",
    serviceName: "PM MUDRA",
    branch: "North",
    region: "North Zone",
    issueDate: "15 Jan 2026",
    dueDate: "30 Jan 2026",
    amount: "₹1,20,000",
    rawAmount: 120000,
    tax: "₹21,600 (18% GST)",
    totalAmount: "₹1,41,600",
    rawTotal: 141600,
    status: "Paid",
    accountManager: "Ariana Lee",
    gstNo: "27AAACA0000A1Z5"
  },
  {
    id: "INV-2026-002",
    clientName: "Summit Co",
    company: "Summit Co.",
    serviceName: "Enterprise CRM Setup",
    branch: "South",
    region: "South Zone",
    issueDate: "01 Mar 2026",
    dueDate: "15 Mar 2026",
    amount: "₹85,000",
    rawAmount: 85000,
    tax: "₹15,300 (18% GST)",
    totalAmount: "₹1,00,300",
    rawTotal: 100300,
    status: "Paid",
    accountManager: "Eli Brooks",
    gstNo: "33AAACS1234B1Z2"
  },
  {
    id: "INV-2026-003",
    clientName: "Blue Retail",
    company: "Blue Retail Pvt Ltd",
    serviceName: "Website & Brand Growth Suite",
    branch: "East",
    region: "East Zone",
    issueDate: "20 May 2026",
    dueDate: "05 Jun 2026",
    amount: "₹60,000",
    rawAmount: 60000,
    tax: "₹10,800 (18% GST)",
    totalAmount: "₹70,800",
    rawTotal: 70800,
    status: "Paid",
    accountManager: "Mia Rose",
    gstNo: "19AAACB9876C1Z9"
  },
  {
    id: "INV-2026-004",
    clientName: "Nexus Logistics",
    company: "Nexus Logistics Solutions",
    serviceName: "Supply Chain Analytics Platform",
    branch: "West",
    region: "West Zone",
    issueDate: "10 Jun 2026",
    dueDate: "25 Jun 2026",
    amount: "₹1,50,000",
    rawAmount: 150000,
    tax: "₹27,000 (18% GST)",
    totalAmount: "₹1,77,000",
    rawTotal: 177000,
    status: "Pending",
    accountManager: "Noah Kim",
    gstNo: "24AAACN5544D1Z7"
  },
  {
    id: "INV-2026-005",
    clientName: "Apex Healthcare",
    company: "Apex Healthcare Systems",
    serviceName: "Corporate Health Shield Annual",
    branch: "North",
    region: "North Zone",
    issueDate: "01 Aug 2026",
    dueDate: "15 Aug 2026",
    amount: "₹42,000",
    rawAmount: 42000,
    tax: "₹7,560 (18% GST)",
    totalAmount: "₹49,560",
    rawTotal: 49560,
    status: "Pending",
    accountManager: "Sara Kim",
    gstNo: "27AAACA9911E1Z3"
  },
  {
    id: "INV-2026-006",
    clientName: "Vanguard Tech",
    company: "Vanguard Tech Innovations",
    serviceName: "Cloud Security & Audit Compliance",
    branch: "Central",
    region: "Central Zone",
    issueDate: "12 Jul 2026",
    dueDate: "27 Jul 2026",
    amount: "₹95,000",
    rawAmount: 95000,
    tax: "₹17,100 (18% GST)",
    totalAmount: "₹1,12,100",
    rawTotal: 112100,
    status: "Overdue",
    accountManager: "Daniel Cruz",
    gstNo: "23AAACV3322F1Z8"
  },
  {
    id: "INV-2026-007",
    clientName: "Zenith Financials",
    company: "Zenith Advisory & Capital Ltd",
    serviceName: "FinTech Compliance Certification",
    branch: "South",
    region: "South Zone",
    issueDate: "05 Feb 2026",
    dueDate: "20 Feb 2026",
    amount: "₹1,10,000",
    rawAmount: 110000,
    tax: "₹19,800 (18% GST)",
    totalAmount: "₹1,29,800",
    rawTotal: 129800,
    status: "Paid",
    accountManager: "Priya Menon",
    gstNo: "33AAACZ7788G1Z1"
  },
  {
    id: "INV-2026-008",
    clientName: "Horizon Real Estate",
    company: "Horizon Infra Projects Pvt Ltd",
    serviceName: "Digital Marketing & Campaign Setup",
    branch: "East",
    region: "East Zone",
    issueDate: "18 Apr 2026",
    dueDate: "03 May 2026",
    amount: "₹75,000",
    rawAmount: 75000,
    tax: "₹13,500 (18% GST)",
    totalAmount: "₹88,500",
    rawTotal: 88500,
    status: "Paid",
    accountManager: "Lily Chen",
    gstNo: "19AAACH4455H1Z4"
  }
];

export const initialRequests = [
  {
    id: "RQ-1001",
    clientId: 1,
    clientName: "Acme Industries",
    requester: "Ariana Lee",
    role: "branch manager",
    branch: "North",
    region: "North Zone",
    managerName: "Ariana Lee (Branch Manager)",
    requestType: "Edit Client",
    requestedChanges: [
      { field: "Company Name", oldValue: "Acme Industries Pvt. Ltd.", newValue: "Acme Global Solutions Pvt Ltd" },
      { field: "Phone Number", oldValue: "+91 98765 43210", newValue: "+91 98765 43999" },
    ],
    reason: "Branch Manager requested update for company legal name & primary phone number after branch audit.",
    status: "Pending",
    createdAt: "2026-08-01",
    decisionDate: null,
    managerRemarks: null,
  },
  {
    id: "RQ-1002",
    clientId: 2,
    clientName: "Summit Co",
    requester: "Ariana Lee",
    role: "branch manager",
    branch: "South",
    region: "South Zone",
    managerName: "Ariana Lee (Branch Manager)",
    requestType: "Delete Client",
    requestedChanges: [],
    reason: "Branch Manager requested account termination following business closure.",
    status: "Pending",
    createdAt: "2026-08-05",
    decisionDate: null,
    managerRemarks: null,
  },
  {
    id: "RQ-1003",
    clientId: 3,
    clientName: "Blue Retail",
    requester: "Ariana Lee",
    role: "branch manager",
    branch: "East",
    region: "East Zone",
    managerName: "Ariana Lee (Branch Manager)",
    requestType: "Edit Client",
    requestedChanges: [
      { field: "GST Number", oldValue: "27LMNOP4321D1Z3", newValue: "27LMNOP4321D1Z8" },
      { field: "Address", oldValue: "17 Industrial Park, Surat", newValue: "17 Industrial Park, Phase 2, Surat" }
    ],
    reason: "Branch Manager submitted verified GST certificate and address update.",
    status: "Approved",
    createdAt: "2026-06-12",
    decisionDate: "2026-06-15",
    managerRemarks: "Approved by Owner after verifying GST documentation.",
  },
  {
    id: "RQ-1004",
    clientId: 4,
    clientName: "Nexus Logistics",
    requester: "Ariana Lee",
    role: "branch manager",
    branch: "West",
    region: "West Zone",
    managerName: "Ariana Lee (Branch Manager)",
    requestType: "Delete Client",
    requestedChanges: [],
    reason: "Branch Manager requested duplicate client account deletion.",
    status: "Rejected",
    createdAt: "2026-05-10",
    decisionDate: "2026-05-12",
    managerRemarks: "Rejected by Owner: Active contract is still running.",
  },
  {
    id: "RQ-1005",
    clientId: 5,
    clientName: "Apex Healthcare",
    requester: "Ariana Lee",
    role: "branch manager",
    branch: "North",
    region: "North Zone",
    managerName: "Ariana Lee (Branch Manager)",
    requestType: "Edit Client",
    requestedChanges: [
      { field: "Contact Person", oldValue: "Deepa Joshi", newValue: "Deepa Joshi-Singh" },
      { field: "Email", oldValue: "info@apexhealth.com", newValue: "contact@apexhealth.com" }
    ],
    reason: "Branch Manager submitted updated primary contact details after executive transition.",
    status: "Cancelled",
    createdAt: "2026-04-02",
    decisionDate: "2026-04-03",
    managerRemarks: "Cancelled by branch manager prior to review.",
  }
];

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
