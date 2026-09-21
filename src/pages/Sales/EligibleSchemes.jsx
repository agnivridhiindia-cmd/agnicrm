import React, { useMemo, useState } from "react";

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function cleanDescription(desc) {
  if (!desc) return "";
  return desc.replace(/up to ₹?10 Lakhs?\s*/gi, "").replace(/\s+/g, " ").trim();
}

function SchemeCard({ scheme, onToggle, isEnrolled }) {
  return (
    <article className={`eligible-scheme-card sales-eligible-card ${isEnrolled ? "scheme-card-locked" : ""}`} style={{ opacity: isEnrolled ? 0.8 : 1 }}>
      <div className="eligible-card-top">
        <div className="eligible-icon">{scheme.schemeName.slice(0, 2).toUpperCase()}</div>
        <span
          className="eligible-badge"
          style={
            isEnrolled
              ? { background: "rgba(224, 128, 97, 0.18)", color: "#e08061" }
              : undefined
          }
        >
          {isEnrolled ? "🔒 Enrolled Plan (Locked)" : "Eligible"}
        </span>
      </div>

      <h3>{scheme.schemeName}</h3>
      <p>{cleanDescription(scheme.description)}</p>

      <div className="eligible-meta-row">
        <div>
          <span className="eligible-meta-label">Visibility</span>
          <strong style={{ color: isEnrolled ? "#e08061" : undefined }}>
            {isEnrolled ? "Locked (Active)" : scheme.visibleToClient ? "Visible" : "Hidden"}
          </strong>
        </div>
        <div>
          <span className="eligible-meta-label">Updated</span>
          <strong>{formatDate(scheme.lastUpdated)}</strong>
        </div>
      </div>

      <div style={{ marginTop: 8 }}>
        <label className="toggle-row" htmlFor={`scheme-${scheme.id}`}>
          <span>{isEnrolled ? "Locked (Active Plan)" : "Show to Client"}</span>
          <button
            id={`scheme-${scheme.id}`}
            type="button"
            className={`toggle-pill ${scheme.visibleToClient ? "active" : ""}`}
            onClick={() => !isEnrolled && onToggle(scheme.id)}
            disabled={isEnrolled}
            style={{ cursor: isEnrolled ? "not-allowed" : "pointer", opacity: isEnrolled ? 0.4 : 1 }}
            aria-pressed={scheme.visibleToClient}
          >
            <i />
          </button>
        </label>
        {isEnrolled && (
          <small style={{ fontSize: 11, color: "#e08061", display: "block", marginTop: 4 }}>
            🔒 Client is already enrolled in this scheme. Locked to prevent accidental visibility edits.
          </small>
        )}
      </div>
    </article>
  );
}

function EmptyState() {
  return (
    <div className="eligible-empty-state">
      <div className="eligible-empty-icon">✦</div>
      <h3>No eligible schemes were found for this client.</h3>
      <p>Eligible recommendations will appear here once the system generates them.</p>
    </div>
  );
}

export default function EligibleSchemes({ initialSchemes = [], enrolledSchemes = [], onSave }) {
  const [schemes, setSchemes] = useState(initialSchemes);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [savedMessage, setSavedMessage] = useState("");

  const filteredSchemes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const nextSchemes = (schemes || []).filter((scheme) => {
      if (!scheme.eligible) return false;
      if (!query) return true;
      return scheme.schemeName.toLowerCase().includes(query);
    });

    const sorted = [...nextSchemes].sort((left, right) => {
      if (sortBy === "az") {
        return left.schemeName.localeCompare(right.schemeName);
      }
      if (sortBy === "za") {
        return right.schemeName.localeCompare(left.schemeName);
      }
      if (sortBy === "oldest") {
        return new Date(left.lastUpdated) - new Date(right.lastUpdated);
      }
      return new Date(right.lastUpdated) - new Date(left.lastUpdated);
    });

    return sorted;
  }, [schemes, searchQuery, sortBy]);

  const recommendedSchemes = useMemo(
    () => filteredSchemes.filter((scheme) => scheme.visibleToClient),
    [filteredSchemes]
  );

  const hiddenSchemes = useMemo(
    () => filteredSchemes.filter((scheme) => !scheme.visibleToClient),
    [filteredSchemes]
  );

  const handleToggle = (schemeId) => {
    setSchemes((prev) => {
      const updated = prev.map((scheme) =>
        scheme.id === schemeId ? { ...scheme, visibleToClient: !scheme.visibleToClient, updatedBy: "Sales Person" } : scheme
      );

      // Schedule the onSave call to avoid setState during render warnings
      if (typeof onSave === 'function') {
        setTimeout(() => onSave(updated), 0);
      }
      return updated;
    });
  };

  const handleSave = () => {
    setSavedMessage("Recommended schemes updated successfully.");
    window.setTimeout(() => setSavedMessage(""), 2200);
    if (typeof onSave === 'function') {
      onSave(schemes);
    }
  };

  return (
    <section className="eligible-schemes-section">
      <div className="eligible-schemes-card">
        <div className="panel-header eligible-panel-header">
          <div>
            <p className="eyebrow">Client recommendation workflow</p>
            <h2>Eligible Schemes</h2>
            <p className="eligible-section-description">
              These schemes are generated based on the client’s submitted information. You can choose which eligible schemes should be visible to the client.
            </p>
          </div>
        </div>

        <div className="eligible-controls">
          <label className="field-label eligible-control-field">
            <span>Search schemes</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search schemes..."
            />
          </label>
          <label className="field-label eligible-control-field">
            <span>Sort by</span>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="az">A-Z</option>
              <option value="za">Z-A</option>
            </select>
          </label>
        </div>

        {filteredSchemes.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="eligible-scheme-grid sales-eligible-grid">
            {filteredSchemes.map((scheme) => {
              const isEnrolled = (enrolledSchemes || []).some(
                (name) => name && name.toLowerCase() === scheme.schemeName.toLowerCase()
              );
              return (
                <SchemeCard
                  key={scheme.id}
                  scheme={scheme}
                  onToggle={handleToggle}
                  isEnrolled={isEnrolled}
                />
              );
            })}
          </div>
        )}

        <button type="button" className="primary-button eligible-save-button" onClick={handleSave}>
          Save Recommendations
        </button>

        {savedMessage ? <p className="eligible-toast">{savedMessage}</p> : null}

        <div className="eligible-summary-grid">
          <div className="eligible-summary-card">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Visible to client</p>
                <h3>Recommended Schemes</h3>
              </div>
            </div>
            {recommendedSchemes.length === 0 ? (
              <p className="eligible-summary-empty">No schemes are currently recommended for this client.</p>
            ) : (
              <ul className="eligible-summary-list">
                {recommendedSchemes.map((scheme) => (
                  <li key={scheme.id}>{scheme.schemeName}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="eligible-summary-card">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Hidden from client</p>
                <h3>Hidden Eligible Schemes</h3>
              </div>
            </div>
            {hiddenSchemes.length === 0 ? (
              <p className="eligible-summary-empty">All eligible schemes are currently visible to the client.</p>
            ) : (
              <ul className="eligible-summary-list">
                {hiddenSchemes.map((scheme) => (
                  <li key={scheme.id}>{scheme.schemeName}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
