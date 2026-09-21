import React, { useState, useEffect, useMemo } from "react";
import { mockEligibleSchemes } from "../mockData/mockEligibleSchemes";

function cleanDescription(desc) {
  if (!desc) return "";
  return desc.replace(/up to ₹?10 Lakhs?\s*/gi, "").replace(/\s+/g, " ").trim();
}

function readStoredSchemes(userEmail, clientInfo) {
  try {
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

export default function EligibilityPage({ onEnrollScheme, enrolledPlanNames = [], userEmail, clientInfo }) {
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [appliedScheme, setAppliedScheme] = useState(null);

  const [schemesList, setSchemesList] = useState(() => readStoredSchemes(userEmail, clientInfo));

  useEffect(() => {
    function syncSchemes() {
      setSchemesList(readStoredSchemes(userEmail, clientInfo));
    }

    syncSchemes();
    window.addEventListener("storage", syncSchemes);
    const interval = setInterval(syncSchemes, 1500);
    return () => {
      window.removeEventListener("storage", syncSchemes);
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
    const schemeTitle = scheme.schemeName || scheme.name;
    setAppliedScheme(schemeTitle);
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
        <div className="cd-alert-success-banner" style={{ background: "rgba(245, 158, 11, 0.15)", border: "1px solid rgba(245, 158, 11, 0.3)", color: "#f59e0b", marginBottom: 20 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6 9 17l-5-5" /></svg>
          <span>Application request for <strong>{appliedScheme}</strong> sent directly to your assigned Sales Representative! Upon approval, your Active Services will update.</span>
          <button type="button" onClick={() => setAppliedScheme(null)}>×</button>
        </div>
      )}

      {/* Schemes Grid */}
      {visibleSchemes.length > 0 && (
        <div className="cd-eligibility-grid">
          {visibleSchemes.map((scheme) => {
            const isEnrolled = enrolledPlanNames.includes((scheme.schemeName || scheme.name || "").toLowerCase());
            const processTag = scheme.processType === "interview"
              ? "Interview Evaluation"
              : scheme.processType === "application_interview"
                ? "Application + Pitch"
                : "Direct Scheme Application";

            return (
              <article key={scheme.id || scheme.schemeName} className="cd-eligibility-card cd-eligibility-card-enhanced">
                <div className="cd-eligibility-card-head">
                  <span className="cd-match-badge cd-match-glow">
                    <i className="cd-pulse-green" style={{ width: 7, height: 7, background: '#44bfb0' }} />
                    Eligible
                  </span>
                  <span className="cd-scheme-tag">{processTag}</span>
                </div>

                <h3>{scheme.schemeName || scheme.name}</h3>
                <p>{cleanDescription(scheme.description)}</p>

                <div className="cd-eligibility-meta-grid">
                  <div>
                    <span>Scheme Status</span>
                    <strong className="cd-cover-amount" style={{ color: '#44bfb0' }}>Eligible</strong>
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
                  className="cd-req-service-btn"
                  disabled={isEnrolled}
                  onClick={() => setSelectedScheme(scheme)}
                  style={{ opacity: isEnrolled ? 0.6 : 1 }}
                >
                  <span>{isEnrolled ? "Scheme Enrolled" : "Apply For Scheme"}</span>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>
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
              onClick={() => handleApply(selectedScheme)}
            >
              Submit Application to Sales Representative
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
