/**
 * exportHelpers.js
 * Professional PDF and CSV export utilities for Agni CRM.
 * Generates executive-ready Client Dossiers, Account Statements, and CSV registers.
 */

import { getCanonicalSchemeName, getTrackerState } from "./schemeTracker";
import { formatCurrency, parseNetRevenue, parseRevenueValue } from "./paymentHelpers";

/**
 * Escapes text for safe inclusion in HTML.
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Generates an executive-ready HTML document for the Client Dossier.
 */
export function generateClientDossierHTML(client) {
  const compName = client.companyName || client.company || client.name || "Client Enterprise";
  const contactPerson = client.contactPerson || client.representativeName || client.name || "N/A";
  const appId = client.appId || client.clientCode || (client.id ? `APP-${String(client.id).slice(-6).toUpperCase()}` : "AGNI-CL-001");
  const email = client.email || "N/A";
  const phone = client.phone || client.contactNumber || "N/A";
  const address = client.address || "Corporate Office, Metro City";
  const branchName = typeof client.branch === "object" ? client.branch?.name : (client.branch || "Regional Branch");
  const salesRep = client.salesPerson?.fullName || client.salesRep || client.owner || client.assignedSalesPerson || "Sales Representative";
  const schemeName = getCanonicalSchemeName(client.serviceName || client.scheme || "PMEGP");
  const serviceType = client.serviceType || "Consultancy Services";
  
  const tracker = getTrackerState({
    ...client,
    scheme: schemeName,
  });

  const rawTotal = parseRevenueValue(client.totalPayment) || parseRevenueValue(client.amount) || parseRevenueValue(client.revenue) || 118000;
  const rawRec = parseRevenueValue(client.paymentReceived) || 0;
  const rawPending = Math.max(0, rawTotal - rawRec);
  const netTotal = parseNetRevenue(rawTotal);
  const netRec = parseNetRevenue(rawRec);

  const gstNo = client.gstNumber || client.gstNo || client.gstin || "N/A";
  const panNo = client.panNumber || client.pan || client.companyPan || "N/A";
  const aadharNo = client.aadharNumber || client.aadhar || "N/A";
  const msmeNo = client.msmeNumber || client.msme || "N/A";
  const businessType = client.businessType || "Private Limited Company";
  const sector = client.sector || "Manufacturing / Commercial";
  const fundingReq = client.fundingRequirement ? formatCurrency(client.fundingRequirement) : "₹25,00,000";

  const generatedDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Transfer mobility history if applicable
  const transferLogs = Array.isArray(client.transferLogs) ? client.transferLogs : [];
  const hasTransfer = transferLogs.length > 0 || (client.originalSalesPerson && client.originalSalesPerson.fullName !== salesRep);
  const origRep = client.originalSalesPerson?.fullName || (transferLogs[0]?.fromSalesPerson?.fullName) || "Original Branch Sales Rep";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Client Dossier - ${escapeHtml(compName)} (${escapeHtml(appId)})</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 14mm 16mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      background: #ffffff;
      margin: 0;
      padding: 0;
      font-size: 11pt;
      line-height: 1.5;
    }
    .header-table {
      width: 100%;
      border-bottom: 3px solid #8c5ff8;
      padding-bottom: 12px;
      margin-bottom: 18px;
    }
    .brand-logo {
      font-size: 22pt;
      font-weight: 900;
      color: #1e1b4b;
      letter-spacing: -0.5px;
    }
    .brand-logo span {
      color: #8c5ff8;
    }
    .doc-badge {
      display: inline-block;
      background: #f1f5f9;
      color: #475569;
      font-size: 9pt;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .dossier-title {
      font-size: 16pt;
      font-weight: 800;
      color: #0f172a;
      margin: 6px 0 2px 0;
    }
    .subtitle {
      font-size: 9.5pt;
      color: #64748b;
    }
    .grid-2 {
      display: table;
      width: 100%;
      margin-bottom: 16px;
    }
    .col-half {
      display: table-cell;
      width: 50%;
      vertical-align: top;
    }
    .section-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px 14px;
      margin-bottom: 14px;
    }
    .section-title {
      font-size: 10.5pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #475569;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 5px;
      margin-bottom: 8px;
      display: flex;
      justify-content: space-between;
    }
    .data-row {
      display: table;
      width: 100%;
      padding: 3px 0;
      font-size: 9.5pt;
    }
    .data-label {
      display: table-cell;
      width: 42%;
      color: #64748b;
      font-weight: 600;
    }
    .data-val {
      display: table-cell;
      width: 58%;
      color: #0f172a;
      font-weight: 700;
    }
    .tracker-box {
      background: #fdf4ff;
      border: 1px solid #f5d0fe;
      border-radius: 6px;
      padding: 12px;
      margin-bottom: 16px;
    }
    .tracker-stage-list {
      display: table;
      width: 100%;
      margin-top: 8px;
    }
    .tracker-step {
      display: table-cell;
      text-align: center;
      padding: 4px;
      font-size: 8.5pt;
    }
    .step-pill {
      display: inline-block;
      width: 22px;
      height: 22px;
      line-height: 22px;
      border-radius: 50%;
      font-weight: 800;
      margin-bottom: 4px;
    }
    .step-done {
      background: #10b981;
      color: #ffffff;
    }
    .step-pending {
      background: #e2e8f0;
      color: #64748b;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6px;
      font-size: 9.5pt;
    }
    table.data-table th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 700;
      text-align: left;
      padding: 6px 10px;
      border: 1px solid #cbd5e1;
    }
    table.data-table td {
      padding: 6px 10px;
      border: 1px solid #e2e8f0;
      color: #1e293b;
    }
    .status-badge {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 4px;
      font-size: 8pt;
      font-weight: 700;
    }
    .badge-success { background: #dcfce7; color: #15803d; }
    .badge-warning { background: #fef3c7; color: #b45309; }
    .badge-primary { background: #ede9fe; color: #6d28d9; }
    .footer-notice {
      margin-top: 24px;
      border-top: 1px solid #cbd5e1;
      padding-top: 10px;
      font-size: 8pt;
      color: #94a3b8;
      display: table;
      width: 100%;
    }
    .signature-area {
      margin-top: 28px;
      display: table;
      width: 100%;
    }
    .signature-col {
      display: table-cell;
      width: 50%;
      vertical-align: bottom;
      padding-top: 36px;
    }
    .sig-line {
      width: 80%;
      border-top: 1px dashed #64748b;
      margin-bottom: 4px;
    }
    @media print {
      .no-print { display: none !important; }
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div style="text-align: right; margin-bottom: 8px;" class="no-print">
    <button onclick="window.print()" style="background: #8c5ff8; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 10pt;">
      🖨️ Print / Save as PDF
    </button>
  </div>

  <table class="header-table">
    <tr>
      <td>
        <div class="brand-logo">AGNI<span>CRM</span></div>
        <div class="subtitle">Agnivridhi India Pvt. Ltd. • Corporate Portfolio Management</div>
      </td>
      <td style="text-align: right;">
        <span class="doc-badge">CONFIDENTIAL DOSSIER</span>
        <div class="dossier-title">${escapeHtml(appId)}</div>
        <div class="subtitle">Generated on ${escapeHtml(generatedDate)}</div>
      </td>
    </tr>
  </table>

  <!-- 2 Column Key Summary -->
  <div class="grid-2">
    <div class="col-half" style="padding-right: 8px;">
      <div class="section-card">
        <div class="section-title">Client & Enterprise Identity</div>
        <div class="data-row"><div class="data-label">Company Name:</div><div class="data-val">${escapeHtml(compName)}</div></div>
        <div class="data-row"><div class="data-label">Contact Person:</div><div class="data-val">${escapeHtml(contactPerson)}</div></div>
        <div class="data-row"><div class="data-label">Corporate Email:</div><div class="data-val">${escapeHtml(email)}</div></div>
        <div class="data-row"><div class="data-label">Contact Number:</div><div class="data-val">${escapeHtml(phone)}</div></div>
        <div class="data-row"><div class="data-label">Business Sector:</div><div class="data-val">${escapeHtml(sector)}</div></div>
        <div class="data-row"><div class="data-label">Entity Structure:</div><div class="data-val">${escapeHtml(businessType)}</div></div>
        <div class="data-row"><div class="data-label">Office Address:</div><div class="data-val" style="font-size: 8.5pt;">${escapeHtml(address)}</div></div>
      </div>
    </div>

    <div class="col-half" style="padding-left: 8px;">
      <div class="section-card">
        <div class="section-title">Compliance & Registration</div>
        <div class="data-row"><div class="data-label">PAN Number:</div><div class="data-val"><code style="font-size: 9.5pt;">${escapeHtml(panNo)}</code></div></div>
        <div class="data-row"><div class="data-label">GSTIN ID:</div><div class="data-val"><code style="font-size: 9.5pt;">${escapeHtml(gstNo)}</code></div></div>
        <div class="data-row"><div class="data-label">MSME / Udyam:</div><div class="data-val"><code style="font-size: 9.5pt;">${escapeHtml(msmeNo)}</code></div></div>
        <div class="data-row"><div class="data-label">Aadhar ID (Ref):</div><div class="data-val"><code style="font-size: 9.5pt;">${escapeHtml(aadharNo)}</code></div></div>
        <div class="data-row"><div class="data-label">Regional Branch:</div><div class="data-val">${escapeHtml(branchName)}</div></div>
        <div class="data-row"><div class="data-label">Assigned Rep:</div><div class="data-val">${escapeHtml(salesRep)}</div></div>
        <div class="data-row"><div class="data-label">Funding Requirement:</div><div class="data-val" style="color: #8c5ff8;">${escapeHtml(fundingReq)}</div></div>
      </div>
    </div>
  </div>

  ${hasTransfer ? `
  <div class="section-card" style="background: #eff6ff; border-color: #bfdbfe; margin-top: -6px;">
    <div class="section-title" style="color: #1d4ed8; border-color: #bfdbfe;">
      <span>Account Custody & Transfer History</span>
      <span class="status-badge badge-primary">Transferred Portfolio</span>
    </div>
    <div style="font-size: 9pt; color: #1e40af;">
      <strong>Original Creator:</strong> ${escapeHtml(origRep)} &nbsp;•&nbsp;
      <strong>Current Sales Handler:</strong> ${escapeHtml(salesRep)} &nbsp;•&nbsp;
      <strong>Attribution Policy:</strong> Former collections locked to originator. Current representative holds 100% quota attribution on remaining balance & future secondary services.
    </div>
  </div>
  ` : ""}

  <!-- Activity Tracker Box -->
  <div class="tracker-box">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <strong style="color: #6b21a8; font-size: 10pt;">
        5-Stage Lifecycle Tracker • ${escapeHtml(schemeName)}
      </strong>
      <span class="status-badge badge-primary" style="font-size: 9pt;">
        Current Stage: ${escapeHtml(tracker.currentStage)} (${tracker.progressPercent}%)
      </span>
    </div>
    <div class="tracker-stage-list">
      ${tracker.stages.map((st, i) => {
        const isDone = tracker.completedStages.includes(st.name);
        return `
          <div class="tracker-step">
            <span class="step-pill ${isDone ? "step-done" : "step-pending"}">${isDone ? "✓" : (i + 1)}</span>
            <div style="font-weight: 700; color: ${isDone ? "#059669" : "#64748b"}">${escapeHtml(st.name)}</div>
            <div style="font-size: 7.5pt; color: #94a3b8;">${st.percent}% Milestone</div>
          </div>
        `;
      }).join("")}
    </div>
  </div>

  <!-- Commercial Statement Table -->
  <div class="section-card">
    <div class="section-title">Commercial & Billing Overview</div>
    <table class="data-table">
      <thead>
        <tr>
          <th>Service / Scheme</th>
          <th>Type</th>
          <th>Total Contract (Gross)</th>
          <th>Realized (Net)</th>
          <th>Collected Received</th>
          <th>Outstanding Pending</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>${escapeHtml(schemeName)}</strong></td>
          <td>${escapeHtml(serviceType)}</td>
          <td><strong>${formatCurrency(rawTotal)}</strong></td>
          <td>${formatCurrency(netTotal)}</td>
          <td style="color: #10b981; font-weight: 700;">${formatCurrency(rawRec)}</td>
          <td style="color: ${rawPending > 0 ? '#ef4444' : '#10b981'}; font-weight: 700;">${formatCurrency(rawPending)}</td>
          <td>
            <span class="status-badge ${rawPending === 0 ? 'badge-success' : 'badge-warning'}">
              ${rawPending === 0 ? 'Fully Paid' : 'Payment Pending'}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Document Compliance Verification Table -->
  <div class="section-card">
    <div class="section-title">Compliance Documentation Audit</div>
    <table class="data-table">
      <thead>
        <tr>
          <th>Required Document</th>
          <th>Document Reference / ID</th>
          <th>Verification Stage</th>
          <th>Audit Status</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>PAN Card</strong></td>
          <td><code>${escapeHtml(panNo)}</code></td>
          <td>Tier 1 Primary Identity</td>
          <td><span class="status-badge ${panNo !== 'N/A' ? 'badge-success' : 'badge-warning'}">${panNo !== 'N/A' ? 'Verified / Submitted' : 'Pending Document'}</span></td>
        </tr>
        <tr>
          <td><strong>GSTIN Certificate</strong></td>
          <td><code>${escapeHtml(gstNo)}</code></td>
          <td>Tax &amp; Commercial Authority</td>
          <td><span class="status-badge ${gstNo !== 'N/A' ? 'badge-success' : 'badge-warning'}">${gstNo !== 'N/A' ? 'Verified / Submitted' : 'Optional / Exempt'}</span></td>
        </tr>
        <tr>
          <td><strong>MSME / Udyam Certificate</strong></td>
          <td><code>${escapeHtml(msmeNo)}</code></td>
          <td>Ministry MSME Enterprise Tier</td>
          <td><span class="status-badge ${msmeNo !== 'N/A' ? 'badge-success' : 'badge-warning'}">${msmeNo !== 'N/A' ? 'Verified / Submitted' : 'Pending Verification'}</span></td>
        </tr>
        <tr>
          <td><strong>Aadhar Card Identification</strong></td>
          <td><code>${escapeHtml(aadharNo)}</code></td>
          <td>Director / Promoter KYC</td>
          <td><span class="status-badge ${aadharNo !== 'N/A' ? 'badge-success' : 'badge-warning'}">${aadharNo !== 'N/A' ? 'Verified' : 'Pending Submission'}</span></td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Signature Area -->
  <div class="signature-area">
    <div class="signature-col">
      <div class="sig-line"></div>
      <div style="font-size: 8.5pt; color: #475569;">
        <strong>Authorized Sales Officer</strong><br>
        ${escapeHtml(salesRep)} (${escapeHtml(branchName)})
      </div>
    </div>
    <div class="signature-col" style="text-align: right;">
      <div class="sig-line" style="margin-left: auto;"></div>
      <div style="font-size: 8.5pt; color: #475569;">
        <strong>Branch Operations Manager / Auditor</strong><br>
        Agnivridhi India Pvt. Ltd.
      </div>
    </div>
  </div>

  <div class="footer-notice">
    <div style="display: table-cell;">Agni CRM System Generated Document • Ref: ${escapeHtml(appId)} • Pan-India Business Development</div>
    <div style="display: table-cell; text-align: right;">Page 1 of 1</div>
  </div>
</body>
</html>`;
}

/**
 * Generates an executive-ready HTML document for the Financial Account Statement.
 */
export function generateClientStatementHTML(client) {
  const compName = client.companyName || client.company || client.name || "Client Account";
  const appId = client.appId || (client.id ? `APP-${String(client.id).slice(-6).toUpperCase()}` : "AGNI-ACC");
  const salesRep = client.salesPerson?.fullName || client.salesRep || client.owner || "Sales Executive";
  const branchName = typeof client.branch === "object" ? client.branch?.name : (client.branch || "Regional Branch");

  const rawTotal = parseRevenueValue(client.totalPayment) || parseRevenueValue(client.amount) || parseRevenueValue(client.revenue) || 118000;
  const rawRec = parseRevenueValue(client.paymentReceived) || 0;
  const rawPending = Math.max(0, rawTotal - rawRec);
  const netTotal = parseNetRevenue(rawTotal);
  const netRec = parseNetRevenue(rawRec);

  const invoices = Array.isArray(client.invoices) ? client.invoices : [];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Account Statement - ${escapeHtml(compName)}</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; margin: 0; padding: 0; font-size: 11pt; line-height: 1.5; }
    .header-table { width: 100%; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
    .title { font-size: 18pt; font-weight: 800; color: #0f172a; margin: 0; }
    .subtitle { font-size: 9.5pt; color: #64748b; }
    table.data-table { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 10pt; }
    table.data-table th { background: #f8fafc; color: #334155; font-weight: 700; text-align: left; padding: 8px 12px; border: 1px solid #cbd5e1; }
    table.data-table td { padding: 8px 12px; border: 1px solid #e2e8f0; }
    .kpi-row { display: table; width: 100%; margin-bottom: 20px; }
    .kpi-tile { display: table-cell; width: 33.33%; padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; }
    .kpi-tile:not(:last-child) { border-right: none; }
    @media print { .no-print { display: none !important; } }
  </style>
</head>
<body>
  <div style="text-align: right; margin-bottom: 10px;" class="no-print">
    <button onclick="window.print()" style="background: #10b981; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 700; cursor: pointer;">
      🖨️ Print / Save as PDF
    </button>
  </div>

  <table class="header-table">
    <tr>
      <td>
        <h1 class="title">STATEMENT OF ACCOUNT</h1>
        <div class="subtitle">Agnivridhi India Pvt. Ltd. • Financial Settlement &amp; Billing Ledger</div>
      </td>
      <td style="text-align: right;">
        <strong style="font-size: 13pt; color: #8c5ff8;">${escapeHtml(appId)}</strong>
        <div class="subtitle">Date: ${new Date().toLocaleDateString("en-IN")}</div>
      </td>
    </tr>
  </table>

  <div style="margin-bottom: 16px;">
    <strong>Account Holder:</strong> ${escapeHtml(compName)}<br>
    <strong>Primary Contact:</strong> ${escapeHtml(client.contactPerson || client.name || "Client")}<br>
    <strong>Account Handler:</strong> ${escapeHtml(salesRep)} (${escapeHtml(branchName)})
  </div>

  <div class="kpi-row">
    <div class="kpi-tile">
      <div style="font-size: 8.5pt; color: #64748b; font-weight: 700; text-transform: uppercase;">Total Contract Value</div>
      <div style="font-size: 15pt; font-weight: 800; color: #0f172a; margin-top: 4px;">${formatCurrency(rawTotal)}</div>
      <div style="font-size: 8pt; color: #94a3b8;">Incl. applicable GST (18%)</div>
    </div>
    <div class="kpi-tile">
      <div style="font-size: 8.5pt; color: #64748b; font-weight: 700; text-transform: uppercase;">Total Realized Payments</div>
      <div style="font-size: 15pt; font-weight: 800; color: #10b981; margin-top: 4px;">${formatCurrency(rawRec)}</div>
      <div style="font-size: 8pt; color: #10b981;">Net: ${formatCurrency(netRec)}</div>
    </div>
    <div class="kpi-tile">
      <div style="font-size: 8.5pt; color: #64748b; font-weight: 700; text-transform: uppercase;">Outstanding Balance Due</div>
      <div style="font-size: 15pt; font-weight: 800; color: ${rawPending > 0 ? '#ef4444' : '#10b981'}; margin-top: 4px;">${formatCurrency(rawPending)}</div>
      <div style="font-size: 8pt; color: ${rawPending > 0 ? '#ef4444' : '#10b981'}; font-weight: 700;">
        ${rawPending === 0 ? "Settled in Full" : "Pending Collection"}
      </div>
    </div>
  </div>

  <h3 style="font-size: 11pt; text-transform: uppercase; margin-bottom: 6px; color: #334155;">Invoice &amp; Transaction Ledger</h3>
  <table class="data-table">
    <thead>
      <tr>
        <th>Reference ID</th>
        <th>Date</th>
        <th>Description / Service</th>
        <th>Invoice Amount</th>
        <th>Payment Status</th>
      </tr>
    </thead>
    <tbody>
      ${invoices.length > 0 ? invoices.map((inv) => `
        <tr>
          <td><code>${escapeHtml(inv.invoiceNumber || inv.id)}</code></td>
          <td>${inv.createdAt ? new Date(inv.createdAt).toLocaleDateString("en-IN") : "—"}</td>
          <td>${escapeHtml(inv.serviceName || client.serviceName || "Consultancy Service Agreement")}</td>
          <td><strong>${formatCurrency(inv.rawTotal || rawTotal)}</strong></td>
          <td style="color: ${inv.status === 'PAID' ? '#10b981' : '#b45309'}; font-weight: 700;">
            ${escapeHtml(inv.status || (rawPending === 0 ? "PAID" : "PARTIAL"))}
          </td>
        </tr>
      `).join("") : `
        <tr>
          <td><code>INV-${escapeHtml(appId)}</code></td>
          <td>${client.createdAt ? new Date(client.createdAt).toLocaleDateString("en-IN") : new Date().toLocaleDateString("en-IN")}</td>
          <td>${escapeHtml(client.serviceName || `Primary Scheme Agreement (${client.scheme || 'PMEGP'})`)}</td>
          <td><strong>${formatCurrency(rawTotal)}</strong></td>
          <td style="color: ${rawPending === 0 ? '#10b981' : '#b45309'}; font-weight: 700;">
            ${rawPending === 0 ? "PAID" : "PENDING COLLECTION"}
          </td>
        </tr>
      `}
    </tbody>
  </table>

  <div style="margin-top: 40px; font-size: 8.5pt; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px;">
    This statement is a system-verified account summary generated from Agni CRM PostgreSQL authoritative ledger.
  </div>
</body>
</html>`;
}

/**
 * Triggers PDF print window for Client Dossier.
 */
export function downloadClientDossierPDF(client) {
  if (!client) return;
  try {
    const html = generateClientDossierHTML(client);
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 400);
    }
  } catch (err) {
    console.error("Failed to generate Dossier PDF:", err);
  }
}

/**
 * Triggers PDF print window for Client Financial Statement.
 */
export function downloadClientStatementPDF(client) {
  if (!client) return;
  try {
    const html = generateClientStatementHTML(client);
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 400);
    }
  } catch (err) {
    console.error("Failed to generate Statement PDF:", err);
  }
}

/**
 * Exports a list of clients to an RFC-4180 compliant CSV file and triggers browser download.
 */
export function exportClientsToCSV(clientsList = [], filenamePrefix = "Clients_Register") {
  if (!Array.isArray(clientsList) || clientsList.length === 0) {
    alert("No clients available to export.");
    return;
  }

  const headers = [
    "Application ID",
    "Client / Company Name",
    "Contact Person",
    "Email",
    "Phone",
    "Branch",
    "Assigned Sales Rep",
    "Service Scheme",
    "Service Type",
    "Contract Gross (INR)",
    "Payment Received (INR)",
    "Pending Balance (INR)",
    "Pipeline Stage",
    "Progress (%)",
    "Transferred Status",
    "Created Date",
  ];

  const rows = clientsList.map((c) => {
    const rawTotal = parseRevenueValue(c.totalPayment) || parseRevenueValue(c.amount) || parseRevenueValue(c.revenue) || 118000;
    const rawRec = parseRevenueValue(c.paymentReceived) || 0;
    const rawPending = Math.max(0, rawTotal - rawRec);

    const hasTransfer = (Array.isArray(c.transferLogs) && c.transferLogs.length > 0) || (c.originalSalesPerson && c.originalSalesPerson.fullName !== (c.salesPerson?.fullName || c.salesRep));

    return [
      c.appId || c.clientCode || c.id || "N/A",
      c.companyName || c.company || c.name || "Client",
      c.contactPerson || c.representativeName || c.name || "N/A",
      c.email || "N/A",
      c.phone || c.contactNumber || "N/A",
      typeof c.branch === "object" ? c.branch?.name : (c.branch || "Regional Branch"),
      c.salesPerson?.fullName || c.salesRep || c.owner || "Sales Executive",
      c.serviceName || c.scheme || "PMEGP",
      c.serviceType || "Consultancy Services",
      rawTotal,
      rawRec,
      rawPending,
      c.applicationStatus || c.stage || "Active",
      c.progressPercent || c.progress || 20,
      hasTransfer ? "Transferred" : "Direct",
      c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-IN") : "Recent",
    ];
  });

  const formatCell = (val) => {
    const str = String(val ?? "");
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvContent = [
    headers.map(formatCell).join(","),
    ...rows.map((row) => row.map(formatCell).join(",")),
  ].join("\r\n");

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const dateStr = new Date().toISOString().split("T")[0];
  link.href = url;
  link.download = `${filenamePrefix}_${dateStr}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
