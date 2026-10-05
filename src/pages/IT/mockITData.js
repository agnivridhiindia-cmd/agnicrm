export const navItems = [
  { icon: "dashboard", label: "Dashboard" },
  { icon: "team", label: "Client" },
  { icon: "overview", label: "Details" },
  { icon: "reports", label: "Services" },
];

export const branchOptions = [
  { label: "East Branch", value: "East" },
  { label: "West Branch", value: "West" },
  { label: "South Branch", value: "South" },
  { label: "North Branch", value: "North" },
];

export const companyITServices = [
  {
    id: "it-srv-1",
    name: "Enterprise Web Portal & CRM Maintenance",
    category: "Infrastructure & Web",
    description: "24/7 technical monitoring, database backup management, vulnerability patching, and SLA incident response for corporate web portals and custom CRM platforms.",
    tag: "24/7 SLA Guarantee",
    turnaround: "Instant Onboarding",
    estimate: "₹18,000 / month",
    baseAmount: 18000,
    features: [
      "99.99% Guaranteed SLA Uptime",
      "Automated Hourly Database Backups",
      "Dedicated DevOps Lead Assigned",
      "Zero-Downtime Hotfix Deployments",
      "Real-time Telemetry & Health Monitoring",
    ],
    scopeDetails: "Includes complete application layer monitoring, SSL renewals, monthly security audit, load balancer tuning, and priority support.",
    tone: "#4e7cff",
  },
  {
    id: "it-srv-2",
    name: "Cybersecurity Vulnerability & Pen-Test Audit",
    category: "Security & Compliance",
    description: "Rigorous penetration testing, cloud firewall inspection, source code security review, and threat surface auditing for enterprise IT infrastructure.",
    tag: "Security Penetration",
    turnaround: "48-Hour Audit",
    estimate: "₹45,000 / Audit",
    baseAmount: 45000,
    features: [
      "OWASP Top 10 Vulnerability Scan",
      "Cloud IAM & Firewall Hardening",
      "Comprehensive Executive Risk Report",
      "Step-by-step Remediation Roadmap",
      "ISO 27001 & SOC-2 Compliance Audit",
    ],
    scopeDetails: "Full white-box & black-box assessment of web apps, API endpoints, internal networks, and identity access management policies.",
    tone: "#9a74e9",
  },
  {
    id: "it-srv-3",
    name: "Cloud Infrastructure Setup & AWS/Azure Migration",
    category: "Cloud & DevOps",
    description: "End-to-end cloud architecture design, Kubernetes container orchestration, VPC networking, auto-scaling clusters, and multi-region disaster recovery.",
    tag: "High Availability",
    turnaround: "2-3 Weeks",
    estimate: "₹65,000 One-time",
    baseAmount: 65000,
    features: [
      "Terraform Infrastructure as Code (IaC)",
      "Multi-Region Auto-Failover Setup",
      "CI/CD Automated Deployment Pipelines",
      "Cloud Cost Optimization (up to 35% savings)",
      "Docker & Kubernetes Cluster Hardening",
    ],
    scopeDetails: "Seamless migration of databases, workloads, and DNS without application downtime, paired with complete architecture diagrams.",
    tone: "#44bfb0",
  },
  {
    id: "it-srv-5",
    name: "Enterprise VoIP, VPN & Remote Network Architecture",
    category: "Networking & Remote Access",
    description: "Secure corporate zero-trust network access (ZTNA), branch-to-branch VPN mesh, Cisco Meraki firewall administration, and SIP/VoIP cloud PBX telephony.",
    tag: "Zero-Trust Mesh",
    turnaround: "Same-Day Deployment",
    estimate: "₹22,000 / Branch",
    baseAmount: 22000,
    features: [
      "Hardware Token & TOTP 2FA Verification",
      "WireGuard & IPsec Encrypted Tunnels",
      "Branch Office QoS Traffic Prioritization",
      "SIP Softphone Provisioning & Mapping",
      "24/7 Rogue Device Intrusion Detection",
    ],
    scopeDetails: "Configures remote workforce gateways, mapped desktop extensions, failover broadband lines, and network policy enforcement.",
    tone: "#f2aa38",
  },
  {
    id: "it-srv-6",
    name: "Custom API Integration & Microservices Gateway",
    category: "Software Engineering",
    description: "Secure RESTful & GraphQL microservice gateways, payment gateway webhooks, SMS/WhatsApp communications API, and ERP interoperability pipelines.",
    tag: "Custom Integration",
    turnaround: "1-2 Weeks",
    estimate: "₹50,000 / Integration",
    baseAmount: 50000,
    features: [
      "Enterprise OAuth2 & JWT Token Auth",
      "Rate Limiting & DDoS Shielding",
      "Automated Swagger/OpenAPI Specs",
      "Asynchronous Webhook Event Queues",
      "SDK Integration for Web & Mobile",
    ],
    scopeDetails: "Builds high-throughput middleware adapters connecting ERP, payment processors, GST gateways, and CRM notification workers.",
    tone: "#f2938f",
  },
  {
    id: "it-srv-7",
    name: "IT Hardware Fleet & Device Management (MDM)",
    category: "End-User Computing",
    description: "Centralized Mobile Device Management (MDM), asset lifecycle tracking, remote wipe capabilities, OS image provisioning, and hardware warranty monitoring.",
    tag: "Device Fleet Control",
    turnaround: "Instant Provisioning",
    estimate: "₹850 / Device / mo",
    baseAmount: 25000,
    features: [
      "Apple Business Manager & Windows Autopilot",
      "Remote Lock, Wipe & BitLocker Encryption",
      "Asset Barcode Tagging & Inventory Sync",
      "Quarterly Hardware Health Audits",
      "Automated OS Patch Compliance",
    ],
    scopeDetails: "Complete MDM agent rollout, endpoint protection policy compliance, and automated workstation onboarding packages.",
    tone: "#6366f1",
  },
];

// Initial clients pitched by sales persons across branches where Service Request is "IT"
export const initialSalesPitchedITClients = [];

export const initialITCreatedClients = [];

export const itActivities = [];
