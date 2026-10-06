import React, { useState, useEffect, useMemo } from "react";
import { mockEligibleSchemes } from "../mockData/mockEligibleSchemes";
import { apiFetch } from "../services/apiClient";

function cleanDescription(desc) {
  if (!desc) return "";
  return desc.replace(/up to ₹?10 Lakhs?\s*/gi, "").replace(/\s+/g, " ").trim();
}

function readStoredSchemes(userEmail, clientInfo) {
  try {
    if (clientInfo?.eligibleSchemes && Array.isArray(clientInfo.eligibleSchemes) && clientInfo.eligibleSchemes.length > 0) {
      return clientInfo.eligibleSchemes;
    }
    if (userEmail) {
      const dedicated = localStorage.getItem(`agni_client_eligible_schemes_${userEmail.toLowerCase().trim()}`);
      if (dedicated) {
        const parsed = JSON.parse(dedicated);
        if (Array.isArray(parsed)) return parsed;
      }
    }
    if (clientInfo?.companyName) {
      const dedicated = localStorage.getItem(`agni_client_eligible_schemes_${clientInfo.companyName.toLowerCase().trim()}`);
      if (dedicated) {
        const parsed = JSON.parse(dedicated);
        if (Array.isArray(parsed)) return parsed;
      }
    }

    const saved = localStorage.getItem("agni_sales_clients") || localStorage.getItem("agni_branch_clients");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const match = parsed.find((c) => c.email && userEmail && c.email.toLowerCase().trim() === userEmail.toLowerCase().trim())
          || parsed.find((c) => c.company && clientInfo?.companyName && c.company.toLowerCase().trim().includes(clientInfo.companyName.toLowerCase().trim()));
        if (match && Array.isArray(match.eligibleSchemes)) {
          return match.eligibleSchemes;
        }
      }
    }
  } catch (e) { }
  // Without salesperson showing/unlocking eligible schemes, return empty list []
  return [];
}

export default function EligibilityPage({ onEnrollScheme, enrolledPlanNames = [], pendingRequests = [], userEmail, clientInfo }) {
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [appliedScheme, setAppliedScheme] = useState(null);
  const [optimisticRequested, setOptimisticRequested] = useState(new Set());

  const [schemesList, setSchemesList] = useState(() => readStoredSchemes(userEmail, clientInfo));

  const norm = (str) => String(str || "").toLowerCase().replace(/[^a-z0-9]/g, "");

  const isSchemeRequested = React.useCallback((scheme) => {
    if (!scheme) return false;
    const sName = String(scheme.schemeName || scheme.name || "").toLowerCase().trim();
    const sNorm = norm(sName);
    if (!sNorm) return false;

    // Check localStorage first so a decline or approval explicitly supersedes optimisticRequested
    try {
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
    } catch (e) {}

    const inPendingProp = (pendingRequests || []).some((r) => {
      const rNorm = norm(r.schemeName || r.name);
      const isMatch = rNorm && (rNorm === sNorm || rNorm.includes(sNorm) || sNorm.includes(rNorm));
      const statusStr = String(r.status || "").toLowerCase();
      const isPending = (!r.status || statusStr.includes("pending")) && !statusStr.includes("decline") && !statusStr.includes("reject");
      return isMatch && isPending;
    });
    if (inPendingProp) return true;

    if (optimisticRequested.has(sName) || optimisticRequested.has(sNorm)) return true;

    return false;
  }, [optimisticRequested, pendingRequests, userEmail]);

  useEffect(() => {
    let isMounted = true;

    async function syncSchemes() {
      // 1. Check local cache or clientInfo first
      const stored = readStoredSchemes(userEmail, clientInfo);
      if (stored && stored.length > 0 && isMounted) {
        setSchemesList(stored);
      }

      // 2. Fetch latest saved state from Neon DB via API
      try {
        const res = await apiFetch("/clients/my-profile");
        if (res.ok) {
          const resData = await res.json();
          const dbSchemes = resData.data?.eligibleSchemes;
          if (Array.isArray(dbSchemes) && isMounted) {
            setSchemesList(dbSchemes);
            if (userEmail) {
              try {
                localStorage.setItem(`agni_client_eligible_schemes_${userEmail.toLowerCase().trim()}`, JSON.stringify(dbSchemes));
              } catch (e) {}
            }
          }
        }
      } catch (err) {
        // Fallback silently to existing local schemes
      }
    }

    syncSchemes();
    window.addEventListener("storage", syncSchemes);
    window.addEventListener("agni_clients_updated", syncSchemes);
    window.addEventListener("agni_pending_updated", syncSchemes);
    const interval = setInterval(syncSchemes, 3000);
    return () => {
      isMounted = false;
      window.removeEventListener("storage", syncSchemes);
      window.removeEventListener("agni_clients_updated", syncSchemes);
      window.removeEventListener("agni_pending_updated", syncSchemes);
      clearInterval(interval);
    };
  }, [userEmail, clientInfo]);

  // STRICT FILTER: Show schemes enabled by Salesperson UNTIL the client enrolls in them
  const visibleSchemes = useMemo(() => {
    const enrolledLower = (enrolledPlanNames || []).map((p) => String(p).toLowerCase());
    return (schemesList || []).filter((s) => {
      const isVisible = s.visibleToClient === true || String(s.visibleToClient) === "true";
      const sName = String(s.schemeName || s.name || "").toLowerCase();
      const isAlreadyEnrolled = enrolledLower.some((pName) => pName && (pName.includes(sName) || sName.includes(pName)));
      return isVisible && !isAlreadyEnrolled;
    });
  }, [schemesList, enrolledPlanNames]);

  function handleApply(scheme) {
    if (!scheme || isSchemeRequested(scheme)) return;
    const schemeTitle = scheme.schemeName || scheme.name;
    const sNameLower = String(schemeTitle).toLowerCase().trim();
    const sNorm = norm(sNameLower);
    setAppliedScheme(schemeTitle);
    setOptimisticRequested((prev) => {
      const next = new Set(prev);
      next.add(sNameLower);
      next.add(sNorm);
      return next;
    });
    if (onEnrollScheme) {
      onEnrollScheme({
        name: schemeTitle,
        description: scheme.description,
        tag: scheme.processType === "interview" ? "Interview Evaluation" : scheme.processType === "application_interview" ? "Application + Pitch" : "Direct Scheme Application",
        price: "Government / Subsidy Scheme",
        features: ["Government Approved Framework", "Verified Eligibility Criteria", "Direct Application Tracking"],
      });
    }
    setSelectedScheme(null);
  }

  const companyDisplayName = clientInfo?.companyName || "Acme Industries";

  return (
    <div className="cd-subpage-container">
      {/* Page Header Intro */}
      <div className="cd-subpage-intro">
        <div>
          <span className="cd-kicker">SCHEME MATCHING & ELIGIBILITY</span>
          <h2>Eligible Schemes for {companyDisplayName}</h2>
          <p>Government &amp; Institutional schemes evaluated and unlocked by your assigned Sales Officer.</p>
        </div>
        <span className="cd-count-pill">{visibleSchemes.length} Schemes Unlocked</span>
      </div>

      {/* Corporate Compatibility Banner */}
      <div className="cd-eligibility-compatibility-card">
        <div className="cd-compat-icon-wrap">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg>
        </div>
        <div className="cd-compat-info">
          <div className="cd-compat-title">
            <h3>Verified Eligible Corporate Schemes</h3>
            <span className="cd-match-badge" style={{ background: 'rgba(68, 191, 176, 0.18)', color: '#44bfb0' }}>
              ● Profile Verified
            </span>
          </div>
          <p>Schemes displayed below have been reviewed and approved for client visibility by your assigned Sales Officer.</p>
        </div>
      </div>

      {/* Applied Banner Notice */}
      {appliedScheme && (
        <div className="cd-alert-success-banner cd-alert-scheme-banner">
          <div className="cd-alert-icon-wrap">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className="cd-alert-content">
            <span className="cd-alert-title">Application Request Submitted</span>
            <span className="cd-alert-desc">
              Application request for <strong className="cd-alert-scheme-highlight">{appliedScheme}</strong> sent directly to your assigned Sales Representative! Upon approval, your Active Services will update.
            </span>
          </div>
          <button type="button" className="cd-alert-close-btn" onClick={() => setAppliedScheme(null)} title="Dismiss">×</button>
        </div>
      )}

      {/* Schemes Grid */}
      {visibleSchemes.length > 0 && (
        <div className="cd-eligibility-grid">
          {visibleSchemes.map((scheme) => {
            const sNorm = norm(scheme.schemeName || scheme.name);
            const isEnrolled = (enrolledPlanNames || []).some((p) => {
              const pNorm = norm(p);
              return pNorm && (pNorm === sNorm || pNorm.includes(sNorm) || sNorm.includes(pNorm));
            });
            const isRequested = isSchemeRequested(scheme);
            const processTag = scheme.processType === "interview"
              ? "Interview Evaluation"
              : scheme.processType === "application_interview"
                ? "Application + Pitch"
                : "Direct Scheme Application";

            return (
              <article key={scheme.id || scheme.schemeName} className="cd-eligibility-card cd-eligibility-card-enhanced">
                <div className="cd-eligibility-card-head">
                  <span className={`cd-match-badge ${isRequested ? "cd-badge-requested" : isEnrolled ? "cd-badge-enrolled" : "cd-match-glow"}`}>
                    <i className={isRequested ? "cd-pulse-amber" : isEnrolled ? "cd-pulse-green" : "cd-pulse-green"} style={{ width: 7, height: 7, background: isRequested ? '#f59e0b' : '#44bfb0' }} />
                    {isEnrolled ? "Enrolled" : isRequested ? "Requested" : "Eligible"}
                  </span>
                  <span className="cd-scheme-tag">{processTag}</span>
                </div>

                <h3>{scheme.schemeName || scheme.name}</h3>
                <p>{cleanDescription(scheme.description)}</p>

                <div className="cd-eligibility-meta-grid">
                  <div>
                    <span>Scheme Status</span>
                    <strong className="cd-cover-amount" style={{ color: isRequested ? '#f59e0b' : '#44bfb0' }}>
                      {isEnrolled ? "Enrolled" : isRequested ? "Requested (Under Review)" : "Eligible"}
                    </strong>
                  </div>
                  <div>
                    <span>Workflow</span>
                    <strong>{scheme.processType || "Government Scheme"}</strong>
                  </div>
                </div>

                <div className="cd-feature-bullets">
                  <span className="cd-feature-chip">✓ Verified Eligibility Criteria</span>
                  <span className="cd-feature-chip">✓ Direct Sales Officer Tracking</span>
                </div>

                <button
                  type="button"
                  className={`cd-req-service-btn ${isRequested ? "cd-btn-requested" : isEnrolled ? "cd-btn-enrolled" : ""}`}
                  disabled={isEnrolled || isRequested}
                  onClick={() => !isEnrolled && !isRequested && setSelectedScheme(scheme)}
                  style={{
                    opacity: isEnrolled || isRequested ? 0.9 : 1,
                    cursor: isEnrolled || isRequested ? "not-allowed" : "pointer"
                  }}
                >
                  <span>
                    {isEnrolled ? "Scheme Enrolled" : isRequested ? "Requested for Scheme" : "Apply For Scheme"}
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
      )}

      {/* Scheme Application Modal */}
      {selectedScheme && (
        <div className="cd-modal-backdrop" onMouseDown={() => setSelectedScheme(null)}>
          <section className="cd-modal cd-modal-glass" onMouseDown={(e) => e.stopPropagation()}>
            <button type="button" className="cd-modal-close" onClick={() => setSelectedScheme(null)}>×</button>

            <div className="cd-modal-head-pill">
              <span className="cd-match-badge" style={{ background: 'rgba(68, 191, 176, 0.15)', color: '#44bfb0' }}>
                ● Eligible
              </span>
              <span className="cd-scheme-tag">{selectedScheme.processType || "Government Scheme"}</span>
            </div>

            <h2 className="cd-modal-title">Apply for {selectedScheme.schemeName || selectedScheme.name}</h2>
            <p className="cd-modal-desc">{cleanDescription(selectedScheme.description)}</p>

            <div className="cd-scheme-meta-box" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 24 }}>
              <div>
                <span>Scheme Status</span>
                <strong style={{ color: '#44bfb0' }}>Eligible</strong>
              </div>
              <div>
                <span>Eligibility Status</span>
                <strong style={{ color: '#44bfb0' }}>Verified Eligible</strong>
              </div>
            </div>

            <button
              type="button"
              className="cd-submit-btn cd-submit-btn-glow"
              disabled={isSchemeRequested(selectedScheme)}
              onClick={() => handleApply(selectedScheme)}
            >
              {isSchemeRequested(selectedScheme) ? "Application Already Submitted" : "Submit Application to Sales Representative"}
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
