import React from "react";
import { getManagerBranchDetails, normalizeSalesPersonName } from "../utils/branchHelper";

const serviceGroups = [
  {
    categoryKey: "certification",
    title: "Certificate & Licensing",
    iconName: "cert",
    tone: "#4e7cff",
    grad: "linear-gradient(135deg, #4e7cff 0%, #6d60fa 100%)",
    items: [
      {
        id: "cert-1",
        name: "DSC (Digital Signature Certificate Class 3)",
        description: "Issuance and activation of secure encrypted DSC tokens for directors, C-suite executives, and authorized signers.",
        tag: "Encrypted Token",
        features: ["FIPS-140-2 Level 2 Token", "Encrypted Key Storage", "Remote Identity Verification", "2-Year Validity"]
      },
      {
        id: "cert-2",
        name: "ISO Certification",
        description: "End-to-end documentation audit, gap analysis, and fast-track processing for ISO 9001, ISO 27001, and quality management standards.",
        tag: "Audit & Quality",
        features: ["Certified External Lead Auditor", "Gap Analysis Report", "Documentation Drafting", "Guaranteed Compliance Pass"]
      },
      {
        id: "cert-3",
        name: "GST Registration",
        description: "Official Goods and Services Tax (GSTIN) registration, ARN generation, and state tax portal filing.",
        tag: "Tax Identification",
        features: ["State Portal Filing", "ARN Generation", "Input Tax Credit Setup", "100% Verified Filing"]
      },
      {
        id: "cert-4",
        name: "Private Limited Company Registration",
        description: "Incorporation of Private Limited Company with MCA approval, SPICe+ filing, MoA/AoA drafting, and PAN/TAN allotment.",
        tag: "Corporate Setup",
        features: ["SPICe+ MCA Filing", "MoA & AoA Drafting", "DIN & Digital Signature", "PAN & TAN Allotment"]
      },
      {
        id: "cert-5",
        name: "Section 8 Company Registration",
        description: "Incorporation support for non-profit companies, micro-finance institutions, and social welfare organizations.",
        tag: "Non-Profit Entity",
        features: ["MCA Section 8 License", "Social Purpose MoA", "FCRA Eligibility", "Government Approvals"]
      },
      {
        id: "cert-6",
        name: "GeM Registration",
        description: "Government e-Marketplace (GeM) seller portal onboarding, OEM vendor assessment, and catalog uploading.",
        tag: "Govt Procurement",
        features: ["Seller Portal Onboarding", "OEM Assessment Support", "Category Listing", "Bidding Readiness"]
      },
      {
        id: "cert-7",
        name: "LLP Registration",
        description: "Limited Liability Partnership (LLP) incorporation, LLP agreement drafting, and MCA name reservation.",
        tag: "Partnership Entity",
        features: ["RUN-LLP Name Approval", "LLP Agreement Drafting", "Partner DPIN Allotment", "Statutory Certificate"]
      },
      {
        id: "cert-8",
        name: "One Person Company (OPC) Registration",
        description: "Corporate entity registration for solo entrepreneurs with limited liability protection and nominee setup.",
        tag: "Single Founder",
        features: ["Solo Founder Protection", "Nominee Incorporation", "SPICe+ MCA Filing", "PAN & TAN Included"]
      },
      {
        id: "cert-9",
        name: "12A & 80G Registration",
        description: "Income Tax Department 12A and 80G certification for NGOs, trusts, and non-profits to enable tax-deductible donations.",
        tag: "Tax Exemption",
        features: ["Income Tax Exemption", "Donor Tax Benefit", "5-Year Validity", "Full Compliance Check"]
      },
      {
        id: "cert-10",
        name: "Trademark Registration",
        description: "Brand name, logo, and trademark TM filing, classification search, and IP attorney representation.",
        tag: "Intellectual Property",
        features: ["Class 1-45 Trademark Search", "TM Application Filing", "IP Attorney Review", "Objection Clearance"]
      },
      {
        id: "cert-11",
        name: "ITR Filing & Compliance",
        description: "Annual Income Tax Return (ITR) preparation, financial statement auditing, and e-filing for corporates and firms.",
        tag: "Tax Filing",
        features: ["CA Financial Audit", "Tax Computation Sheet", "E-Filing Portal Ack", "Tax Savings Optimization"]
      },
      {
        id: "cert-12",
        name: "CSR Registration (CSR-1)",
        description: "Ministry of Corporate Affairs CSR-1 filing for eligible entities to receive corporate CSR grants.",
        tag: "Social Responsibility",
        features: ["MCA CSR-1 Certificate", "Unique Entity Number", "Corporate Grant Eligibility", "Portal Verification"]
      },
      {
        id: "cert-13",
        name: "DARPAN Registration (NITI Aayog)",
        description: "NITI Aayog NGO Darpan portal enrollment and unique ID generation for central government grant participation.",
        tag: "NITI Aayog Portal",
        features: ["NITI Aayog Unique ID", "Government Grant Eligibility", "Vetted Profile Listing", "Ministry Sync"]
      },
      {
        id: "cert-14",
        name: "Annual Corporate Statutory Filing",
        description: "MCA annual statutory compliance certification, Form AOC-4 & MGT-7 filings, and corporate secretarial audit.",
        tag: "Statutory Filing",
        features: ["Form AOC-4 & MGT-7", "Board Meeting Minutes", "Secretarial Audit", "Zero Penalty Guarantee"]
      }
    ]
  },
  {
    categoryKey: "it",
    title: "IT Infrastructure & Security",
    iconName: "it",
    tone: "#9a74e9",
    grad: "linear-gradient(135deg, #9a74e9 0%, #bba3fb 100%)",
    items: [
      {
        id: "it-1",
        name: "Enterprise Web Portal & CRM Maintenance",
        description: "24/7 technical monitoring, database backup management, vulnerability patching, and SLA incident response for corporate web portals.",
        tag: "24/7 SLA Guarantee",
        features: ["99.99% Guaranteed SLA Uptime", "Automated Hourly Database Backups", "Dedicated DevOps Lead", "Zero-Downtime Patching"]
      },
      {
        id: "it-2",
        name: "Cybersecurity Vulnerability & Pen-Test Audit",
        description: "Rigorous penetration testing, cloud firewall inspection, and threat surface auditing for enterprise IT infrastructure.",
        tag: "Security Penetration",
        features: ["OWASP Top 10 Assessment", "Network Vulnerability Scan", "Executive Risk Report", "Remediation Checklist"]
      }
    ]
  },
  {
    categoryKey: "marketing",
    title: "Marketing & Brand Growth",
    iconName: "marketing",
    tone: "#44bfb0",
    grad: "linear-gradient(135deg, #44bfb0 0%, #2b9e90 100%)",
    items: [
      {
        id: "mk-1",
        name: "Brand Identity & Corporate Collateral Suite",
        description: "Professional brand style guides, pitch decks, investor presentations, stationery, and corporate identity design assets.",
        tag: "Brand Identity",
        features: ["Vector Logo & Assets", "Comprehensive Brand Guidelines", "Interactive Pitch Deck Template", "Social Media Kit"]
      },
      {
        id: "mk-2",
        name: "Targeted B2B Digital Growth Campaign",
        description: "Multi-channel B2B digital acquisition campaigns across LinkedIn, Google Ads, and targeted industry media.",
        tag: "Growth Campaign",
        features: ["Targeted Account Prospecting", "High-Converting Ad Creatives", "Bi-Weekly Performance Dashboard", "A/B Landing Page Testing"]
      }
    ]
  }
];

export default function MoreServicesPage({
  onEnrollScheme,
  enrolledPlanNames = [],
  pendingRequests = [],
  assignedSalesPerson,
  salesRole,
  dedicatedTeam,
  userEmail,
}) {
  const [activeCategory, setActiveCategory] = React.useState("all");
  const [requestedService, setRequestedService] = React.useState(null);
  const [submittedService, setSubmittedService] = React.useState(null);
  const [requestNotes, setRequestNotes] = React.useState("");
  const [optimisticRequested, setOptimisticRequested] = React.useState(new Set());
  const [, setSyncTick] = React.useState(0);

  React.useEffect(() => {
    const handleUpdate = () => setSyncTick((t) => t + 1);
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("agni_pending_updated", handleUpdate);
    window.addEventListener("agni_clients_updated", handleUpdate);
    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("agni_pending_updated", handleUpdate);
      window.removeEventListener("agni_clients_updated", handleUpdate);
    };
  }, []);

  // Bug #4 fix: Clear optimisticRequested for schemes that are now declined or approved.
  // Ensures the "Request Scheme" button reverts after a salesperson declines the request.
  React.useEffect(() => {
    function clearSettledOptimistic() {
      try {
        const saved = localStorage.getItem("agni_pending_scheme_requests");
        if (!saved) return;
        const list = JSON.parse(saved);
        if (!Array.isArray(list) || list.length === 0) return;
        const resolvedEmail = String(userEmail || localStorage.getItem("agni_user_email") || localStorage.getItem("agni_email") || "").toLowerCase().trim();
        const settled = new Set();
        const normFn = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        list.forEach((r) => {
          const rEmail = String(r.clientEmail || r.email || "").toLowerCase().trim();
          const emailMatch = !resolvedEmail || !rEmail || rEmail === resolvedEmail;
          if (!emailMatch) return;
          const statusStr = String(r.status || "").toLowerCase();
          if (statusStr.includes("decline") || statusStr.includes("reject") || statusStr.includes("approved")) {
            const sNorm = normFn(r.schemeName || r.name);
            const sName = String(r.schemeName || r.name || "").toLowerCase().trim();
            if (sNorm) settled.add(sNorm);
            if (sName) settled.add(sName);
          }
        });
        if (settled.size === 0) return;
        setOptimisticRequested((prev) => {
          const next = new Set(prev);
          settled.forEach((key) => next.delete(key));
          return next.size === prev.size ? prev : next;
        });
      } catch (e) { }
    }
    clearSettledOptimistic();
    window.addEventListener("agni_pending_updated", clearSettledOptimistic);
    window.addEventListener("storage", clearSettledOptimistic);
    return () => {
      window.removeEventListener("agni_pending_updated", clearSettledOptimistic);
      window.removeEventListener("storage", clearSettledOptimistic);
    };
  }, [userEmail]);

  const norm = (str) => String(str || "").toLowerCase().replace(/[^a-z0-9]/g, "");

  const isServiceRequested = React.useCallback((service) => {
    if (!service) return false;
    const sName = String(service.name || "").toLowerCase().trim();
    const sNorm = norm(sName);
    if (!sNorm) return false;

    // 1. Authoritative check: pendingRequests prop from PostgreSQL database
    const matchingPendingProp = (pendingRequests || []).find((r) => {
      const rNorm = norm(r.schemeName || r.name);
      return rNorm && (rNorm === sNorm || rNorm.includes(sNorm) || sNorm.includes(rNorm));
    });

    if (matchingPendingProp) {
      const statusStr = String(matchingPendingProp.status || "").toLowerCase();
      if (statusStr.includes("decline") || statusStr.includes("reject") || statusStr.includes("approved")) {
        return false;
      }
      if (!matchingPendingProp.status || statusStr.includes("pending")) {
        return true;
      }
    }

    // 2. Active in-memory optimistic request
    if (optimisticRequested.has(sName) || optimisticRequested.has(sNorm)) return true;

    // 3. Optional fallback to localStorage cache
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const saved = localStorage.getItem("agni_pending_scheme_requests");
        if (saved) {
          const list = JSON.parse(saved);
          if (Array.isArray(list)) {
            const resolvedEmail = String(userEmail || localStorage.getItem("agni_user_email") || localStorage.getItem("agni_email") || "").toLowerCase().trim();
            const match = list.find((r) => {
              const rEmail = String(r.clientEmail || r.email || "").toLowerCase().trim();
              const emailMatch = !resolvedEmail || !rEmail || rEmail === resolvedEmail;
              const rNorm = norm(r.schemeName || r.name);
              return emailMatch && rNorm && (rNorm === sNorm || rNorm.includes(sNorm) || sNorm.includes(rNorm));
            });
            if (match) {
              const statusStr = String(match.status || "").toLowerCase();
              if (statusStr.includes("decline") || statusStr.includes("reject") || statusStr.includes("approved")) {
                return false;
              }
              if (!match.status || statusStr.includes("pending")) {
                return true;
              }
            }
          }
        }
      }
    } catch (e) { }

    return false;
  }, [optimisticRequested, pendingRequests, userEmail]);

  const isServiceEnrolled = React.useCallback((service) => {
    if (!service) return false;
    const sNorm = norm(service.name);
    if (!sNorm) return false;
    return (enrolledPlanNames || []).some((p) => {
      const pNorm = norm(p);
      return pNorm && (pNorm === sNorm || pNorm.includes(sNorm) || sNorm.includes(pNorm));
    });
  }, [enrolledPlanNames]);

  const salesLeadName = React.useMemo(() => {
    if (assignedSalesPerson) return assignedSalesPerson;
    if (dedicatedTeam?.salesRepName) return dedicatedTeam.salesRepName;

    try {
      const saved = localStorage.getItem("agni_branch_clients") || localStorage.getItem("agni_sales_clients");
      if (saved) {
        const parsed = JSON.parse(saved);
        const email = (userEmail || localStorage.getItem("agni_user_email") || "").trim().toLowerCase();
        const rawMatch = parsed.find(
          (c) => c.email && email && c.email.toLowerCase().trim() === email
        );
        if (rawMatch) {
          const sr = rawMatch.assignedSalesPerson || rawMatch.owner || rawMatch.salesRepresentative || rawMatch.salesperson;
          const foundName = typeof sr === "string" ? sr : (sr?.name || "");
          if (foundName) return normalizeSalesPersonName(foundName);
        }
      }
    } catch (e) { }

    const email = userEmail || localStorage.getItem("agni_user_email") || "";
    const details = getManagerBranchDetails(email);
    const riyaMatch = details?.salespersons?.find((s) => s.toLowerCase().includes("riya"));
    if (riyaMatch) return riyaMatch;
    return details?.salespersons?.[0] || "Riya Mukherjee";
  }, [assignedSalesPerson, dedicatedTeam, userEmail]);

  const salesLeadRole = salesRole || dedicatedTeam?.salesRepRole || "Assigned Sales Representative";

  const filteredGroups = serviceGroups.filter(g => activeCategory === "all" || g.categoryKey === activeCategory);
  const totalServices = serviceGroups.reduce((acc, g) => acc + g.items.length, 0);

  function handleSubmit(e) {
    e.preventDefault();
    if (requestedService) {
      if (isServiceRequested(requestedService) || isServiceEnrolled(requestedService)) {
        setRequestedService(null);
        return;
      }
      const sNameLower = String(requestedService.name).toLowerCase().trim();
      const sNorm = norm(sNameLower);
      setOptimisticRequested((prev) => {
        const next = new Set(prev);
        next.add(sNameLower);
        next.add(sNorm);
        return next;
      });
      if (onEnrollScheme) {
        onEnrollScheme({
          name: requestedService.name,
          tag: requestedService.tag || "Enterprise Service",
          category: requestedService.categoryKey || activeCategory,
          price: requestedService.price || "Standard Active",
          cover: "Service Enrolled",
          description: requestedService.description || requestedService.desc || "Active service requested by client.",
          notes: requestNotes,
        });
      }
      setSubmittedService({
        name: requestedService.name
      });
      setRequestedService(null);
      setRequestNotes("");
    }
  }

  return (
    <div className="cd-subpage-container">
      {/* Header Intro */}
      <div className="cd-subpage-intro">
        <div>
          <span className="cd-kicker">ENTERPRISE SOLUTIONS MARKETPLACE</span>
          <h2>Explore Additional Services</h2>
          <p>Browse specialized corporate services across IT, compliance, marketing, and licensing tailored for your organization.</p>
        </div>
        <span className="cd-count-pill">{totalServices} Services Available</span>
      </div>      {/* Category Filter Tabs */}
      <div className="cd-category-filter-tabs">
        <button
          type="button"
          className={`cd-filter-tab ${activeCategory === "all" ? "active" : ""}`}
          onClick={() => setActiveCategory("all")}
        >
          All Categories ({totalServices})
        </button>
        <button
          type="button"
          className={`cd-filter-tab ${activeCategory === "certification" ? "active" : ""}`}
          onClick={() => setActiveCategory("certification")}
        >
          Certificate & Licensing
        </button>
        <button
          type="button"
          className={`cd-filter-tab ${activeCategory === "it" ? "active" : ""}`}
          onClick={() => setActiveCategory("it")}
        >
          IT & Security
        </button>
        <button
          type="button"
          className={`cd-filter-tab ${activeCategory === "marketing" ? "active" : ""}`}
          onClick={() => setActiveCategory("marketing")}
        >
          Marketing & Growth
        </button>
      </div>

      {/* Submitted Success Banner */}
      {submittedService && (
        <div className="cd-alert-success-banner cd-alert-scheme-banner">
          <div className="cd-alert-icon-wrap">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className="cd-alert-content">
            <span className="cd-alert-title">Service Request Submitted</span>
            <span className="cd-alert-desc">
              Service request for <strong className="cd-alert-scheme-highlight">{submittedService.name}</strong> sent to your assigned sales lead, <strong className="cd-alert-lead-highlight">{salesLeadName}</strong>! They will contact you within 2 business hours.
            </span>
          </div>
          <button type="button" className="cd-alert-close-btn" onClick={() => setSubmittedService(null)} title="Dismiss">×</button>
        </div>
      )}

      {/* Service Groups Grid */}
      <div className="cd-service-groups-layout">
        {filteredGroups.map(group => (
          <section key={group.title} className="cd-service-group-section">
            <div className="cd-service-group-head">
              <div className="cd-service-group-icon" style={{ background: group.grad, color: '#ffffff' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
              </div>
              <h3>{group.title}</h3>
            </div>

            <div className="cd-service-items-grid">
              {group.items.map(service => {
                const isEnrolled = isServiceEnrolled(service);
                const isRequested = isServiceRequested(service);

                return (
                  <article key={service.id} className="cd-service-card">
                    <div className="cd-service-card-top">
                      <span
                        className={`cd-match-badge ${isRequested ? "cd-badge-requested" : isEnrolled ? "cd-badge-enrolled" : ""}`}
                        style={{
                          background: isRequested ? 'rgba(245, 158, 11, 0.16)' : isEnrolled ? 'rgba(68, 191, 176, 0.16)' : 'rgba(78, 124, 255, 0.12)',
                          color: isRequested ? '#f59e0b' : isEnrolled ? '#44bfb0' : '#4e7cff'
                        }}
                      >
                        {isEnrolled ? "Enrolled Service" : isRequested ? "Requested (Under Review)" : service.tag}
                      </span>
                    </div>

                    <h4>{service.name}</h4>
                    <p>{service.description}</p>

                    <div className="cd-feature-bullets" style={{ marginBottom: 20 }}>
                      {service.features.map(f => (
                        <span key={f} className="cd-feature-chip">✓ {f}</span>
                      ))}
                    </div>

                    <button
                      type="button"
                      className={`cd-req-service-btn ${isRequested ? "cd-btn-requested" : isEnrolled ? "cd-btn-enrolled" : ""}`}
                      disabled={isEnrolled || isRequested}
                      onClick={() => !isEnrolled && !isRequested && setRequestedService({ ...service, categoryKey: group.categoryKey })}
                      style={{
                        opacity: isEnrolled || isRequested ? 0.9 : 1,
                        cursor: isEnrolled || isRequested ? "not-allowed" : "pointer"
                      }}
                    >
                      <span>
                        {isEnrolled ? "Scheme Enrolled" : isRequested ? "Requested for Scheme" : "Request Scheme"}
                      </span>
                      {isRequested ? (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                      ) : isEnrolled ? (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      ) : (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M5 12h14" /><path d="m13 6 6 6-6 6" />
                        </svg>
                      )}
                    </button>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Service Request Wizard Modal */}
      {requestedService && (
        <div className="cd-modal-backdrop" onMouseDown={() => setRequestedService(null)}>
          <section className="cd-modal cd-modal-glass" onMouseDown={(e) => e.stopPropagation()}>
            <button type="button" className="cd-modal-close" onClick={() => setRequestedService(null)}>×</button>

            <div className="cd-modal-head-pill">
              <span className="cd-match-badge" style={{ background: 'rgba(78, 124, 255, 0.12)', color: '#4e7cff' }}>
                {requestedService.tag}
              </span>
            </div>

            <h2 className="cd-modal-title">{requestedService.name}</h2>
            <p className="cd-modal-desc">{requestedService.description}</p>

            <div className="cd-scheme-meta-box" style={{ gridTemplateColumns: '1fr', marginBottom: 24 }}>
              <div>
                <span>Assigned Sales Lead</span>
                <strong>{salesLeadName} ({salesLeadRole})</strong>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="cd-form">

              <label>
                <span>Specific Instructions / Corporate Scope</span>
                <textarea
                  rows="3"
                  value={requestNotes}
                  onChange={(e) => setRequestNotes(e.target.value)}
                  placeholder="Specify headcount, target dates, or specialized corporate scope..."
                />
              </label>

              <button
                type="submit"
                className="cd-submit-btn cd-submit-btn-glow"
                disabled={isServiceRequested(requestedService) || isServiceEnrolled(requestedService)}
              >
                {isServiceEnrolled(requestedService)
                  ? "Service Already Active"
                  : isServiceRequested(requestedService)
                    ? "Service Request Already Pending"
                    : `Send Request to ${salesLeadName}`}
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
