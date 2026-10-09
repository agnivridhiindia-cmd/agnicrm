// ==========================================================================
// Agni CRM — Mock Data for Marketing Operations & Client Services
// ==========================================================================

export const navItems = [
  { icon: "dashboard", label: "Dashboard" },
  { icon: "clients", label: "Client" },
  { icon: "overview", label: "Details" },
  { icon: "reports", label: "Services" },
];

export const branchOptions = ["East", "West", "South", "North"];

// Company Marketing Service Offerings Catalog
export const companyMarketingServices = [
  {
    id: "mkt-srv-1",
    name: "Performance Marketing & Multi-Channel Paid Ads",
    category: "Paid Media & Ads",
    description: "High-ROI Google Search & Display, Meta Ads (Facebook/Instagram), and LinkedIn B2B paid media management with automated conversion tracking and daily bid optimization.",
    tag: "High Conversion ROI",
    turnaround: "3-Day Launch",
    estimate: "₹25,000 / month",
    baseAmount: 25000,
    features: [
      "Targeted Google Search & PMax Campaigns",
      "Meta Ads Retargeting & Custom Audiences",
      "LinkedIn Sponsored Content & InMail Ads",
      "Daily ROAS & Conversion Tracking",
      "Custom Ad Creatives & Copywriting",
    ],
    scopeDetails: "Comprehensive media plan across Google, Meta, and LinkedIn with full GA4 tracking setup, custom UTM tracking, A/B ad creative testing, and weekly performance dashboards.",
    tone: "#4e7cff",
  },
  {
    id: "mkt-srv-2",
    name: "Search Engine Optimization (SEO) & Organic Growth",
    category: "SEO & Growth",
    description: "Enterprise technical SEO audits, high-intent keyword clustering, on-page optimization, quality backlink acquisition, and Google Core Web Vitals performance tuning.",
    tag: "Organic Page #1",
    turnaround: "Monthly Retainer",
    estimate: "₹20,000 / month",
    baseAmount: 20000,
    features: [
      "Full Site Technical SEO & Indexing Audit",
      "High-Intent Commercial Keyword Strategy",
      "High-Authority Backlink Outreach",
      "Core Web Vitals & Page Speed Tuning",
      "Google Search Console & GA4 Integration",
    ],
    scopeDetails: "Monthly organic search strategy including competitive gap analysis, schema markup implementation, editorial content calendar, and keyword ranking monitoring.",
    tone: "#10b981",
  },
  {
    id: "mkt-srv-3",
    name: "B2B Lead Generation & Automated Email Funnels",
    category: "Lead Generation & CRM",
    description: "Cold outreach automation, verified decision-maker prospect scraping, high-converting drip email sequences, and CRM pipeline automation.",
    tag: "Qualified MQL Pipeline",
    turnaround: "1-Week Setup",
    estimate: "₹35,000 / month",
    baseAmount: 35000,
    features: [
      "Verified B2B Prospect Data Sourcing",
      "Cold Email Drip Funnels & Warmup",
      "Automated CRM Lead Routing & Scoring",
      "A/B Tested Sales Outreach Copy",
      "Calendar Booking & Meeting Scheduling",
    ],
    scopeDetails: "End-to-end outbound pipeline setup with dedicated domain warm-up, multi-step email nurture flows, Apollo/LinkedIn data extraction, and CRM synchronization.",
    tone: "#9a74e9",
  },
  {
    id: "mkt-srv-4",
    name: "Social Media Management & Brand Community",
    category: "Social & Community",
    description: "Strategic social media calendar, graphic design, video reels/shorts production, community engagement, and thought-leadership positioning on LinkedIn & Instagram.",
    tag: "Brand Engagement",
    turnaround: "Ongoing Retainer",
    estimate: "₹18,000 / month",
    baseAmount: 18000,
    features: [
      "20 Monthly Branded Posts & Infographics",
      "Short-Form Video Production (Reels/Shorts)",
      "LinkedIn Thought Leadership Articles",
      "Community Comment & DM Moderation",
      "Monthly Engagement & Reach Analytics",
    ],
    scopeDetails: "Includes branded visual templates, monthly content planning, industry trend monitoring, influencer collaboration management, and hashtag optimization.",
    tone: "#f2aa38",
  },
  {
    id: "mkt-srv-5",
    name: "Brand Identity, UI/UX & Creative Graphic Design",
    category: "Design & Branding",
    description: "Corporate brand guidelines, logo modernization, high-converting landing page UI/UX wireframes, company pitch decks, and sales collateral design.",
    tag: "Premium Visual Identity",
    turnaround: "2 Weeks",
    estimate: "₹45,000 One-time",
    baseAmount: 45000,
    features: [
      "Complete Brand Style Guide & Typography",
      "Vector Logo & Modern Iconography Suite",
      "Conversion Landing Page Figma UI/UX",
      "Investor Pitch Deck & Brochure Design",
      "Print & Digital Marketing Assets",
    ],
    scopeDetails: "Full design sprint including stakeholder discovery, mood boards, vector asset delivery, typography scale, responsive Figma prototypes, and production-ready exports.",
    tone: "#f2938f",
  },
  {
    id: "mkt-srv-6",
    name: "Content Marketing & Enterprise PR Outreach",
    category: "Content & PR",
    description: "Data-backed industry whitepapers, SEO blog articles, press release distribution across national media outlets, and thought leadership positioning.",
    tag: "Authority & PR",
    turnaround: "2-3 Weeks",
    estimate: "₹30,000 / month",
    baseAmount: 30000,
    features: [
      "4 In-Depth Research Blog Articles / mo",
      "Press Release Drafting & Wire Distribution",
      "Industry Case Studies & Customer Stories",
      "National Tech & Business Media Coverage",
      "Media Placement & Backlink Verification",
    ],
    scopeDetails: "Full editorial curation, copywriting, technical proofreading, PR distribution across prominent news networks, and digital brand mention tracking.",
    tone: "#44bfb0",
  },
];

// Initial clients pitched by sales reps across branches where Service Request is "Marketing"
export const initialSalesPitchedMarketingClients = [];

// Initial clients created directly from the Marketing Module
export const initialMarketingCreatedClients = [];

// Marketing Activities
export const marketingActivities = [];
