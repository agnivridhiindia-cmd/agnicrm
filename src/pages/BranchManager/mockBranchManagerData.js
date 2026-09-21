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
  { label: "Branch Revenue", value: "₹0", trend: "Excl. 18% GST", description: "Payments minus 18% GST (payment/1.18)", accent: "#f97316", linkTo: "Revenue" },
];

export const initialBranchManagerClients = [];

export const initialBranchAdmins = [
  // --- WEST ZONE (MUMBAI) - Ariana Lee ---
  { id: 1, name: "Vikramaditya Roy", email: "admin@agni.com", joiningDate: "2023-01-15", role: "Admin Lead", region: "West Zone", branch: "West Zone (Mumbai)", branchManagerName: "Ariana Lee" },
  { id: 2, name: "Priya Nair", email: "priya.admin@agni.com", joiningDate: "2024-03-22", role: "Admin Officer", region: "West Zone", branch: "West Zone (Mumbai)", branchManagerName: "Ariana Lee" },

  // --- NORTH ZONE (DELHI) - Rajesh Khanna ---
  { id: 3, name: "Amit Joshi", email: "amit.admin@agni.com", joiningDate: "2023-06-10", role: "Admin Lead", region: "North Zone", branch: "North Zone (Delhi)", branchManagerName: "Rajesh Khanna" },
  { id: 4, name: "Simran Kaur", email: "simran.admin@agni.com", joiningDate: "2024-01-05", role: "Admin Officer", region: "North Zone", branch: "North Zone (Delhi)", branchManagerName: "Rajesh Khanna" },

  // --- SOUTH ZONE (BENGALURU) - Suresh Reddy ---
  { id: 5, name: "Lakshmi Narayanan", email: "lakshmi.admin@agni.com", joiningDate: "2023-04-18", role: "Admin Lead", region: "South Zone", branch: "South Zone (Bengaluru)", branchManagerName: "Suresh Reddy" },
  { id: 6, name: "Rahul Gowda", email: "rahul.admin@agni.com", joiningDate: "2024-02-12", role: "Admin Officer", region: "South Zone", branch: "South Zone (Bengaluru)", branchManagerName: "Suresh Reddy" },

  // --- EAST ZONE (KOLKATA) - Subhash Banerjee ---
  { id: 7, name: "Pronab Paul", email: "pronab.admin@agni.com", joiningDate: "2023-09-18", role: "Admin Lead", region: "East Zone", branch: "East Zone (Kolkata)", branchManagerName: "Subhash Banerjee" },
  { id: 8, name: "Moumita Kar", email: "moumita.admin@agni.com", joiningDate: "2024-01-20", role: "Admin Officer", region: "East Zone", branch: "East Zone (Kolkata)", branchManagerName: "Subhash Banerjee" },
];

export const initialBranchIT = [
  // --- WEST ZONE (MUMBAI) - Ariana Lee ---
  { id: 1, name: "Noah Kim", email: "noah@agni.com", joiningDate: "2022-11-04", role: "IT Lead", region: "West Zone", branch: "West Zone (Mumbai)", branchManagerName: "Ariana Lee" },
  { id: 2, name: "Sophia Patel", email: "sophia.it@agni.com", joiningDate: "2024-01-18", role: "IT Specialist", region: "West Zone", branch: "West Zone (Mumbai)", branchManagerName: "Ariana Lee" },

  // --- NORTH ZONE (DELHI) - Rajesh Khanna ---
  { id: 3, name: "Aarav Mehta", email: "aarav.it@agni.com", joiningDate: "2023-04-12", role: "IT Lead", region: "North Zone", branch: "North Zone (Delhi)", branchManagerName: "Rajesh Khanna" },
  { id: 4, name: "Ishaan Verma", email: "ishaan.it@agni.com", joiningDate: "2023-11-05", role: "Sys Admin", region: "North Zone", branch: "North Zone (Delhi)", branchManagerName: "Rajesh Khanna" },

  // --- SOUTH ZONE (BENGALURU) - Suresh Reddy ---
  { id: 5, name: "Vikram Rao", email: "vikram.it@agni.com", joiningDate: "2023-10-20", role: "Cloud Architect", region: "South Zone", branch: "South Zone (Bengaluru)", branchManagerName: "Suresh Reddy" },
  { id: 6, name: "Niharika Bhat", email: "niharika.it@agni.com", joiningDate: "2024-03-01", role: "IT Lead", region: "South Zone", branch: "South Zone (Bengaluru)", branchManagerName: "Suresh Reddy" },

  // --- EAST ZONE (KOLKATA) - Subhash Banerjee ---
  { id: 7, name: "Arindam Bose", email: "arindam.it@agni.com", joiningDate: "2024-02-14", role: "IT Lead", region: "East Zone", branch: "East Zone (Kolkata)", branchManagerName: "Subhash Banerjee" },
  { id: 8, name: "Swati Ganguly", email: "swati.it@agni.com", joiningDate: "2023-08-25", role: "Network Eng", region: "East Zone", branch: "East Zone (Kolkata)", branchManagerName: "Subhash Banerjee" },
];

export const initialBranchMarketing = [
  // --- WEST ZONE (MUMBAI) - Ariana Lee ---
  { id: 1, name: "Daniel Cruz", email: "daniel@agni.com", joiningDate: "2023-05-11", role: "Marketing Lead", region: "West Zone", branch: "West Zone (Mumbai)", branchManagerName: "Ariana Lee" },
  { id: 2, name: "Chloe Bennett", email: "chloe@agni.com", joiningDate: "2023-11-15", role: "Marketing Assoc", region: "West Zone", branch: "West Zone (Mumbai)", branchManagerName: "Ariana Lee" },

  // --- NORTH ZONE (DELHI) - Rajesh Khanna ---
  { id: 3, name: "Neha Kapoor", email: "neha.mkt@agni.com", joiningDate: "2024-02-01", role: "Marketing Lead", region: "North Zone", branch: "North Zone (Delhi)", branchManagerName: "Rajesh Khanna" },
  { id: 4, name: "Sanya Malhotra", email: "sanya.mkt@agni.com", joiningDate: "2023-09-14", role: "Digital Specialist", region: "North Zone", branch: "North Zone (Delhi)", branchManagerName: "Rajesh Khanna" },

  // --- SOUTH ZONE (BENGALURU) - Suresh Reddy ---
  { id: 5, name: "Pooja Menon", email: "pooja.mkt@agni.com", joiningDate: "2023-07-19", role: "Marketing Lead", region: "South Zone", branch: "South Zone (Bengaluru)", branchManagerName: "Suresh Reddy" },
  { id: 6, name: "Tarun Kumar", email: "tarun.mkt@agni.com", joiningDate: "2024-01-10", role: "Campaign Lead", region: "South Zone", branch: "South Zone (Bengaluru)", branchManagerName: "Suresh Reddy" },

  // --- EAST ZONE (KOLKATA) - Subhash Banerjee ---
  { id: 7, name: "Tanmoy Dutta", email: "tanmoy.mkt@agni.com", joiningDate: "2023-08-02", role: "Marketing Lead", region: "East Zone", branch: "East Zone (Kolkata)", branchManagerName: "Subhash Banerjee" },
  { id: 8, name: "Sneha Ghosh", email: "sneha.mkt@agni.com", joiningDate: "2024-03-05", role: "Brand Assoc", region: "East Zone", branch: "East Zone (Kolkata)", branchManagerName: "Subhash Banerjee" },
];

export const initialEmployeesList = [
  // --- WEST ZONE (MUMBAI) - Ariana Lee ---
  { id: 1, name: "Eli Brooks", email: "eli@agni.com", phone: "+91 91234 00222", role: "Sales Manager", branch: "West Zone (Mumbai)", region: "West Zone", branchManager: "Ariana Lee" },
  { id: 2, name: "Mia Rose", email: "mia@agni.com", phone: "+91 91234 10101", role: "Senior Sales Representative", branch: "West Zone (Mumbai)", region: "West Zone", branchManager: "Ariana Lee", reportingManager: "Eli Brooks" },
  { id: 3, name: "Lucas Scott", email: "lucas@agni.com", phone: "+91 91234 10104", role: "Sales Executive", branch: "West Zone (Mumbai)", region: "West Zone", branchManager: "Ariana Lee", reportingManager: "Eli Brooks" },

  // --- NORTH ZONE (DELHI) - Rajesh Khanna ---
  { id: 4, name: "Ananya Sen", email: "ananya.sm@agni.com", phone: "+91 91234 30300", role: "Sales Manager", branch: "North Zone (Delhi)", region: "North Zone", branchManager: "Rajesh Khanna" },
  { id: 5, name: "Rohan Gupta", email: "rohan.sales@agni.com", phone: "+91 91234 30301", role: "Senior Sales Representative", branch: "North Zone (Delhi)", region: "North Zone", branchManager: "Rajesh Khanna", reportingManager: "Ananya Sen" },
  { id: 6, name: "Kavya Sharma", email: "kavya.sales@agni.com", phone: "+91 91234 30302", role: "Sales Executive", branch: "North Zone (Delhi)", region: "North Zone", branchManager: "Rajesh Khanna", reportingManager: "Ananya Sen" },

  // --- SOUTH ZONE (BENGALURU) - Suresh Reddy ---
  { id: 7, name: "Karthik Iyer", email: "karthik.sm@agni.com", phone: "+91 91234 20200", role: "Sales Manager", branch: "South Zone (Bengaluru)", region: "South Zone", branchManager: "Suresh Reddy" },
  { id: 8, name: "Arjun Hegde", email: "arjun.sales@agni.com", phone: "+91 91234 20201", role: "Senior Sales Officer", branch: "South Zone (Bengaluru)", region: "South Zone", branchManager: "Suresh Reddy", reportingManager: "Karthik Iyer" },
  { id: 9, name: "Deepa Rao", email: "deepa.sales@agni.com", phone: "+91 91234 20202", role: "Sales Representative", branch: "South Zone (Bengaluru)", region: "South Zone", branchManager: "Suresh Reddy", reportingManager: "Karthik Iyer" },

  // --- EAST ZONE (KOLKATA) - Subhash Banerjee ---
  { id: 10, name: "Debolina Roy", email: "debolina.sm@agni.com", phone: "+91 91234 40400", role: "Sales Manager", branch: "East Zone (Kolkata)", region: "East Zone", branchManager: "Subhash Banerjee" },
  { id: 11, name: "Sourav Das", email: "sourav.sales@agni.com", phone: "+91 91234 40401", role: "Sales Executive", branch: "East Zone (Kolkata)", region: "East Zone", branchManager: "Subhash Banerjee", reportingManager: "Debolina Roy" },
  { id: 12, name: "Riya Mukherjee", email: "riya.sales@agni.com", phone: "+91 91234 40402", role: "Sales Representative", branch: "East Zone (Kolkata)", region: "East Zone", branchManager: "Subhash Banerjee", reportingManager: "Debolina Roy" },
];

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
