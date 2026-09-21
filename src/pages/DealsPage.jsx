import React from "react";

const offersMetrics = [
  { label: "Active Offers", value: "4 Available", color: "#4e7cff", bg: "rgba(78, 124, 255, 0.12)" },
  { label: "Assigned Sales Lead", value: "Mia Rose", color: "#44bfb0", bg: "rgba(68, 191, 176, 0.12)" },
  { label: "Deal of the Month", value: "Health Shield", color: "#9a74e9", bg: "rgba(154, 116, 233, 0.12)" },
  { label: "Expiring Soon", value: "1 Deal (12d left)", color: "#f2aa38", bg: "rgba(242, 170, 56, 0.12)" }
];

const serviceOffersData = [
  {
    id: 1,
    title: "Corporate Health Shield - Enterprise Package",
    category: "Health & Benefits",
    discountBadge: "25% OFF",
    originalPrice: "₹1,200/mo",
    offerPrice: "₹899/mo per member",
    validTill: "31 Aug 2026",
    code: "HEALTH25",
    salesRep: "Mia Rose",
    repRole: "Senior Sales Lead",
    summary: "Exclusive 25% discount on comprehensive group health insurance for your corporate headcount with zero waiting period.",
    highlights: ["Free Annual Health Checkup", "Cashless network across 8,000+ hospitals", "Maternity & OPD Cover included"]
  },
  {
    id: 2,
    title: "Cyber Security & Infra Audit Suite",
    category: "IT Infrastructure",
    discountBadge: "SAVE ₹35,000",
    originalPrice: "₹1,50,000",
    offerPrice: "₹1,15,000/yr",
    validTill: "15 Sep 2026",
    code: "CYBERSEC35",
    salesRep: "Noah Kim",
    repRole: "IT Solution Lead",
    summary: "Complete penetration testing, cloud server vulnerability assessment, and 24/7 dedicated security monitoring.",
    highlights: ["Automated Hourly Backups", "99.99% Uptime Guarantee", "Dedicated SOC Incident Manager"]
  },
  {
    id: 3,
    title: "Digital Brand Growth & PR Campaign",
    category: "Marketing & Growth",
    discountBadge: "15% CASHBACK",
    originalPrice: "₹80,000",
    offerPrice: "₹68,000",
    validTill: "30 Aug 2026",
    code: "GROWTH15",
    salesRep: "Mia Rose",
    repRole: "Senior Sales Lead",
    summary: "Integrated social media campaign, press releases, and targeted digital ads to scale your corporate market reach.",
    highlights: ["Custom Brand Collateral", "Bi-weekly Analytics Report", "Dedicated Growth Lead"]
  },
  {
    id: 4,
    title: "Mudra Export Certification Bundle",
    category: "Licensing & Compliance",
    discountBadge: "FREE SETUP",
    originalPrice: "₹45,00,000 Cover",
    offerPrice: "Zero Setup Fee",
    validTill: "10 Sep 2026",
    code: "FREEMUDRA",
    salesRep: "Kansish",
    repRole: "Account Manager",
    summary: "Waived documentation and processing fees on Mudra Export Credit Certification for foreign trade.",
    highlights: ["Fast-track Documentation", "Government Subsidy Assistance", "Compliance Guarantee"]
  }
];

export default function DealsPage() {
  const [selectedOffer, setSelectedOffer] = React.useState(null);
  const [notifiedOffers, setNotifiedOffers] = React.useState([]);
  const [lastNotificationMsg, setLastNotificationMsg] = React.useState(null);

  function handleSendNotification(offer) {
    setNotifiedOffers(prev => [...prev, offer.id]);
    setLastNotificationMsg(`Notification sent to ${offer.salesRep} (${offer.repRole}) for "${offer.title}". They will get in touch shortly.`);
    setSelectedOffer(null);
  }

  return (
    <div className="cd-subpage-container">
      {/* Header Intro */}
      <div className="cd-subpage-intro">
        <div>
          <span className="cd-kicker">EXCLUSIVES & SAVINGS</span>
          <h2>Service Offers & Promotional Deals</h2>
          <p>Explore special discounts and bundle deals. Claiming an offer notifies your assigned sales lead instantly.</p>
        </div>
        <span className="cd-count-pill">{serviceOffersData.length} Live Offers Available</span>
      </div>

      {/* Sales Lead Alert Notice */}
      {lastNotificationMsg && (
        <div className="cd-alert-success-banner">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"/></svg>
          <span>{lastNotificationMsg}</span>
          <button type="button" onClick={() => setLastNotificationMsg(null)}>×</button>
        </div>
      )}

      {/* Metrics Banner */}
      <div className="cd-metrics-grid" style={{ marginBottom: 28 }}>
        {offersMetrics.map(item => (
          <article key={item.label} className="cd-metric-card">
            <div className="cd-metric-icon-box" style={{ background: item.bg, color: item.color }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
            </div>
            <div className="cd-metric-info">
              <span className="cd-metric-value">{item.value}</span>
              <span className="cd-metric-label">{item.label}</span>
            </div>
          </article>
        ))}
      </div>

      {/* Offers Grid */}
      <div className="cd-deals-grid">
        {serviceOffersData.map((offer) => {
          const isNotified = notifiedOffers.includes(offer.id);
          return (
            <article key={offer.id} className="cd-deal-card">
              <div className="cd-deal-card-head">
                <span className="cd-match-badge" style={{ background: 'rgba(242, 170, 56, 0.15)', color: '#f2aa38' }}>
                  {offer.discountBadge}
                </span>
                <span className="cd-scheme-tag">{offer.category}</span>
              </div>
              <h3>{offer.title}</h3>
              <p className="cd-deal-summary">{offer.summary}</p>

              <div className="cd-deal-meta-row">
                <div>
                  <span>Offer Price</span>
                  <strong className="cd-deal-value">{offer.offerPrice}</strong>
                  <s style={{ fontSize: 11, color: '#94a3b8', display: 'block' }}>{offer.originalPrice}</s>
                </div>
                <div>
                  <span>Assigned Sales Lead</span>
                  <strong>{offer.salesRep}</strong>
                </div>
              </div>

              <div className="cd-feature-bullets" style={{ marginBottom: 20 }}>
                {offer.highlights.map(h => (
                  <span key={h} className="cd-feature-chip">✓ {h}</span>
                ))}
              </div>

              {isNotified ? (
                <div className="cd-alert-success-banner" style={{ padding: '10px 14px', fontSize: 13, background: 'rgba(78, 124, 255, 0.12)', color: '#4e7cff', borderColor: 'rgba(78, 124, 255, 0.3)' }}>
                  <span>✓ Notification Sent to {offer.salesRep}</span>
                </div>
              ) : (
                <button
                  type="button"
                  className="cd-req-service-btn"
                  onClick={() => setSelectedOffer(offer)}
                >
                  <span>Claim Offer</span>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>
                </button>
              )}
            </article>
          );
        })}
      </div>

      {/* Claim Offer / Send Notification Modal */}
      {selectedOffer && (
        <div className="cd-modal-backdrop" onMouseDown={() => setSelectedOffer(null)}>
          <section className="cd-modal cd-modal-glass" onMouseDown={(e) => e.stopPropagation()}>
            <button type="button" className="cd-modal-close" onClick={() => setSelectedOffer(null)}>×</button>
            <span className="cd-match-badge" style={{ background: 'rgba(242, 170, 56, 0.15)', color: '#f2aa38', marginBottom: 12 }}>
              {selectedOffer.discountBadge}
            </span>
            <h2>Claim {selectedOffer.title}</h2>
            <p className="cd-modal-desc">
              Claiming this offer will immediately notify your assigned sales lead, <strong>{selectedOffer.salesRep}</strong> ({selectedOffer.repRole}), to apply this special pricing to your account.
            </p>

            <div className="cd-scheme-meta-box" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 20 }}>
              <div>
                <span>Discounted Offer Rate</span>
                <strong style={{ color: '#4e7cff' }}>{selectedOffer.offerPrice}</strong>
              </div>
              <div>
                <span>Recipient Sales Representative</span>
                <strong>{selectedOffer.salesRep}</strong>
              </div>
            </div>

            <button
              type="button"
              className="cd-submit-btn cd-submit-btn-glow"
              onClick={() => handleSendNotification(selectedOffer)}
            >
              Send Notification to {selectedOffer.salesRep}
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
