import { AGNIVRIDHI_LOGO_BASE64, AGNIVRIDHI_STAMP_BASE64 } from "./invoiceAssets.js";

// Indian GST State Map (Codes 01 to 38)
export const GST_STATE_MAP = {
  "01": "Jammu and Kashmir",
  "02": "Himachal Pradesh",
  "03": "Punjab",
  "04": "Chandigarh",
  "05": "Uttarakhand",
  "06": "Haryana",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  "10": "Bihar",
  "11": "Sikkim",
  "12": "Arunachal Pradesh",
  "13": "Nagaland",
  "14": "Manipur",
  "15": "Mizoram",
  "16": "Tripura",
  "17": "Meghalaya",
  "18": "Assam",
  "19": "West Bengal",
  "20": "Jharkhand",
  "21": "Odisha",
  "22": "Chhattisgarh",
  "23": "Madhya Pradesh",
  "24": "Gujarat",
  "26": "Dadra and Nagar Haveli and Daman and Diu",
  "27": "Maharashtra",
  "28": "Andhra Pradesh",
  "29": "Karnataka",
  "30": "Goa",
  "31": "Lakshadweep",
  "32": "Kerala",
  "33": "Tamil Nadu",
  "34": "Puducherry",
  "35": "Andaman and Nicobar Islands",
  "36": "Telangana",
  "37": "Andhra Pradesh",
  "38": "Ladakh"
};

const STATE_TO_CODE = {};
for (const [code, name] of Object.entries(GST_STATE_MAP)) {
  STATE_TO_CODE[name.toLowerCase()] = code;
}
STATE_TO_CODE["up"] = "09";
STATE_TO_CODE["mp"] = "23";
STATE_TO_CODE["tn"] = "33";
STATE_TO_CODE["wb"] = "19";
STATE_TO_CODE["mh"] = "27";
STATE_TO_CODE["uk"] = "05";
STATE_TO_CODE["ap"] = "37";
STATE_TO_CODE["ts"] = "36";
STATE_TO_CODE["odisha"] = "21";
STATE_TO_CODE["orissa"] = "21";
STATE_TO_CODE["pondicherry"] = "34";

/**
 * Derives the Place of Supply with 2-digit state code, e.g. "Telangana (36)".
 */
export function getPlaceOfSupplyWithCode(placeOrState, address, gstin) {
  if (placeOrState && typeof placeOrState === "string" && /\(\d{2}\)/.test(placeOrState)) {
    return placeOrState.trim();
  }

  // 1. First 2 digits of GSTIN indicate state code
  if (gstin && typeof gstin === "string") {
    const cleanGst = gstin.trim();
    if (/^\d{2}/.test(cleanGst)) {
      const code = cleanGst.slice(0, 2);
      if (GST_STATE_MAP[code]) {
        return `${GST_STATE_MAP[code]} (${code})`;
      }
    }
  }

  // 2. Direct match with state/place
  if (placeOrState && typeof placeOrState === "string") {
    const cleanPlace = placeOrState.trim().toLowerCase();
    if (STATE_TO_CODE[cleanPlace]) {
      const code = STATE_TO_CODE[cleanPlace];
      return `${GST_STATE_MAP[code]} (${code})`;
    }
    for (const [sName, sCode] of Object.entries(STATE_TO_CODE)) {
      if (cleanPlace.includes(sName)) {
        return `${GST_STATE_MAP[sCode]} (${sCode})`;
      }
    }
  }

  // 3. Search in address
  if (address && typeof address === "string") {
    const cleanAddr = address.toLowerCase();
    for (const [sName, sCode] of Object.entries(STATE_TO_CODE)) {
      const regex = new RegExp(`\\b${sName}\\b`, "i");
      if (regex.test(cleanAddr)) {
        return `${GST_STATE_MAP[sCode]} (${sCode})`;
      }
    }
  }

  return "Uttar Pradesh (09)";
}

/**
 * Converts Indian currency numbers to words (e.g. 17700 -> SEVENTEEN THOUSAND SEVEN HUNDRED RUPEES ONLY).
 */
export function numberToWordsINR(amount) {
  const num = Math.round(Number(amount) || 0);
  if (num === 0) return "ZERO RUPEES ONLY";

  const a = [
    "", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE",
    "TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN",
    "SEVENTEEN", "EIGHTEEN", "NINETEEN"
  ];
  const b = [
    "", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"
  ];

  function convertTwoDigits(n) {
    if (n < 20) return a[n];
    const tens = b[Math.floor(n / 10)];
    const ones = a[n % 10];
    return ones ? `${tens} ${ones}` : tens;
  }

  function convertThreeDigits(n) {
    let str = "";
    if (Math.floor(n / 100) > 0) {
      str += a[Math.floor(n / 100)] + " HUNDRED ";
    }
    const rem = n % 100;
    if (rem > 0) {
      str += convertTwoDigits(rem);
    }
    return str.trim();
  }

  let words = "";

  const crore = Math.floor(num / 10000000);
  let rem = num % 10000000;

  const lakh = Math.floor(rem / 100000);
  rem = rem % 100000;

  const thousand = Math.floor(rem / 1000);
  rem = rem % 1000;

  const hundred = rem;

  if (crore > 0) {
    words += convertTwoDigits(crore) + " CRORE ";
  }
  if (lakh > 0) {
    words += convertTwoDigits(lakh) + " LAKH ";
  }
  if (thousand > 0) {
    words += convertTwoDigits(thousand) + " THOUSAND ";
  }
  if (hundred > 0) {
    words += convertThreeDigits(hundred) + " ";
  }

  return words.trim() + " RUPEES ONLY";
}

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatHeaderDate(dateObj) {
  const d = dateObj || new Date();
  return `${MONTHS_SHORT[d.getMonth()]} ${String(d.getDate()).padStart(2, "0")}, ${d.getFullYear()}`;
}

function formatFooterDate(dateObj) {
  const d = dateObj || new Date();
  return `${String(d.getDate()).padStart(2, "0")} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

function formatAmount(val) {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(val || 0);
}

function formatIntAmount(val) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0
  }).format(val || 0);
}

/**
 * Format address lines nicely with HTML breaks.
 */
function formatClientAddress(addrStr, city, state, pincode) {
  if (!addrStr && !city && !state) {
    return "India";
  }

  if (addrStr && addrStr.trim()) {
    // If address already has commas, split by comma or newline for balanced lines
    const parts = addrStr.split(/[\r\n]+/).map(p => p.trim()).filter(Boolean);
    if (parts.length > 1) {
      return parts.join("<br>");
    }
    const commaParts = addrStr.split(",").map(p => p.trim()).filter(Boolean);
    if (commaParts.length > 2) {
      const line1 = commaParts.slice(0, 2).join(", ");
      const line2 = commaParts.slice(2, 4).join(", ");
      const line3 = commaParts.slice(4).join(", ");
      return [line1, line2, line3].filter(Boolean).join("<br>");
    }
    return addrStr;
  }

  const parts = [];
  if (city) parts.push(city);
  if (state) parts.push(state);
  const loc = parts.join(", ");
  return `${loc}${pincode ? `, India - ${pincode}` : ", India"}`;
}

/**
 * Generates the official AgniVridhi Tax Invoice HTML matching the exact design.
 */
export function generateInvoiceHTML(invoice = {}) {
  const typeStr = (invoice.type || invoice.invoiceType || "").toLowerCase();
  const isProforma = typeStr.includes("proforma") || typeStr.includes("performa");
  const isGstInvoice = typeStr.includes("gst") && !typeStr.includes("tax");

  const quantity = Number(invoice.quantity) || 1;
  const rate = Number(invoice.rate || invoice.pitchedAmount || invoice.amount || 0);

  // For GST Invoice (cash payment), there is NO GST!
  const hasGst = !isGstInvoice && Number(invoice.gstPercent !== undefined ? invoice.gstPercent : 18) > 0;
  const gstPercent = hasGst ? Number(invoice.gstPercent !== undefined ? invoice.gstPercent : 18) : 0;
  const taxableAmount = invoice.taxableAmount !== undefined ? Number(invoice.taxableAmount) : (quantity * rate);
  const totalGst = hasGst ? (invoice.totalGst !== undefined ? Number(invoice.totalGst) : (taxableAmount * (gstPercent / 100))) : 0;
  const totalAmount = hasGst ? (invoice.totalAmount ? Number(invoice.totalAmount) : (taxableAmount + totalGst)) : taxableAmount;

  // Requirement: Invoice date should be current date
  const now = new Date();
  const invoiceDate = invoice.issueDate ? new Date(invoice.issueDate) : now;
  const headerDateStr = formatHeaderDate(isNaN(invoiceDate.getTime()) ? now : invoiceDate);
  const footerDateStr = formatFooterDate(isNaN(invoiceDate.getTime()) ? now : invoiceDate);

  // Client Details (Fetched from DB / Invoice)
  const clientName = (
    invoice.clientName ||
    invoice.client?.companyName ||
    invoice.client?.name ||
    invoice.company ||
    "AAKIBUKI CREATIVE ART (OPC) PRIVATE LIMITED"
  ).toUpperCase();

  const clientGstinRaw = (
    invoice.gstin ||
    invoice.gstNo ||
    invoice.client?.gstNumber ||
    ""
  ).trim();

  // Requirement: "if client have GSTIn then only show it in invoice else don't show..."
  const hasGstin = Boolean(clientGstinRaw && clientGstinRaw.toUpperCase() !== "NONE" && clientGstinRaw.toUpperCase() !== "N/A");
  const clientGstin = hasGstin ? clientGstinRaw : "";

  // Requirement: "fetch GSTIN,PAN and email from database..."
  let clientPan = (
    invoice.pan ||
    invoice.panNumber ||
    invoice.client?.companyPan ||
    invoice.client?.panNumber ||
    ""
  ).trim();
  // Auto-extract PAN from GSTIN if PAN not explicitly provided (Indian GSTIN chars 3-12)
  if (!clientPan && hasGstin && clientGstin.length >= 12) {
    clientPan = clientGstin.substring(2, 12).toUpperCase();
  }

  const clientEmail = (
    invoice.email ||
    invoice.clientEmail ||
    invoice.client?.email ||
    ""
  ).trim();

  const clientPhone = (
    invoice.phone ||
    invoice.mobile ||
    invoice.client?.contactNumber ||
    invoice.client?.phone ||
    ""
  ).trim();

  const rawAddress = invoice.address || invoice.client?.address || "";
  const formattedAddress = formatClientAddress(
    rawAddress,
    invoice.city || invoice.client?.city,
    invoice.state || invoice.client?.state,
    invoice.pincode || invoice.client?.pincode
  );

  // Requirement: "Place of Supply: should be the area in address with code(like Telangana (36))..."
  const placeOfSupplyWithCode = getPlaceOfSupplyWithCode(
    invoice.placeOfSupply,
    rawAddress,
    clientGstin
  );

  const isIgst = !placeOfSupplyWithCode.toLowerCase().includes("uttar pradesh");
  let docTitle = "Tax Invoice";
  if (isProforma) {
    docTitle = "Proforma Invoice";
  } else if (isGstInvoice) {
    docTitle = "GST Invoice";
  }

  // Requirement: Invoice number e.g. INV-yyyymmdd-001
  let rawInvoiceNo = invoice.id || invoice.invoiceNo || "";
  if (rawInvoiceNo.includes("/")) {
    const slashMatch = rawInvoiceNo.match(/^(?:INV|PI)-(\d{2})\/(\d{2})\/(\d{4})-(\d+)$/);
    if (slashMatch) {
      rawInvoiceNo = `INV-${slashMatch[3]}${slashMatch[2]}${slashMatch[1]}-${slashMatch[4]}`;
    } else {
      rawInvoiceNo = rawInvoiceNo.replace(/\//g, "");
    }
  }
  const invoiceNo = rawInvoiceNo || `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-001`;

  // Item description & HSN/SAC
  const description = invoice.description || "PMEGP";
  const hsnSac = invoice.hsnSac || "998311";

  // Amounts in Words
  const totalInWords = numberToWordsINR(totalAmount);
  const taxInWords = numberToWordsINR(totalGst);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${invoiceNo} - ${docTitle}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm 12mm 12mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #111827;
      background: #ffffff;
      font-size: 11px;
      line-height: 1.4;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .invoice-wrapper {
      max-width: 820px;
      margin: 0 auto;
      padding: 10px 14px;
      position: relative;
    }
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
    }
    .header-title {
      font-size: 27px;
      font-weight: 700;
      color: #5945b2;
      letter-spacing: -0.4px;
      margin-bottom: 8px;
    }
    .header-meta {
      font-size: 11.5px;
      line-height: 1.55;
      color: #374151;
    }
    .header-meta-row {
      display: flex;
      align-items: center;
    }
    .header-meta-label {
      width: 96px;
      color: #4b5563;
    }
    .header-meta-val {
      color: #111827;
      font-weight: 700;
    }
    .header-logo img {
      width: 78px;
      height: 78px;
      object-fit: contain;
    }
    .cards-row {
      display: flex;
      gap: 16px;
      margin-bottom: 18px;
    }
    .address-card {
      flex: 1;
      background-color: #f6f4fb;
      border-radius: 6px;
      padding: 14px 18px;
      font-size: 11px;
    }
    .card-kicker {
      font-size: 15px;
      font-weight: 700;
      color: #5945b2;
      margin-bottom: 6px;
    }
    .card-name {
      font-size: 11.5px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 4px;
      line-height: 1.35;
    }
    .card-address {
      font-size: 11px;
      color: #374151;
      line-height: 1.45;
      margin-bottom: 8px;
    }
    .card-meta-list {
      font-size: 11px;
      color: #1f2937;
      line-height: 1.48;
    }
    .card-meta-list strong {
      font-weight: 700;
    }
    .supply-row {
      display: flex;
      justify-content: space-around;
      font-size: 11.5px;
      font-weight: 600;
      color: #111827;
      margin: 16px 0 10px 0;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      margin-bottom: 14px;
    }
    .items-table th {
      background-color: #5438a6;
      color: #ffffff;
      font-weight: 600;
      padding: 8px 10px;
      text-align: left;
      border: none;
    }
    .items-table td {
      padding: 8px 10px;
      border: none;
      vertical-align: middle;
    }
    .items-table tbody tr.item-row {
      background-color: #f8f7fc;
      border-bottom: 1px solid #ebe9f5;
    }
    .items-table tbody tr.total-row {
      background-color: #edebf6;
      font-weight: 700;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    .summary-split {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
    }
    .words-col {
      width: 54%;
      font-size: 11px;
      font-weight: 700;
      line-height: 1.5;
      color: #111827;
      text-transform: uppercase;
      padding-top: 4px;
    }
    .totals-col {
      width: 38%;
    }
    .totals-inner-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11.5px;
    }
    .totals-inner-table td {
      padding: 4px 0;
    }
    .totals-inner-table .grand-total-row td {
      border-top: 1.5px solid #111827;
      border-bottom: 2px solid #111827;
      padding: 6px 0;
      font-size: 14px;
      font-weight: 800;
      color: #111827;
    }
    .stamp-sign-wrap {
      text-align: right;
      margin-top: 10px;
      margin-bottom: 10px;
    }
    .stamp-sign-box {
      display: inline-block;
      text-align: center;
    }
    .stamp-sign-box img {
      width: 90px;
      height: 90px;
      object-fit: contain;
      display: block;
      margin: 0 auto 2px auto;
    }
    .stamp-sign-label {
      font-size: 11.5px;
      font-weight: 600;
      color: #111827;
    }
    .tax-breakdown-table {
      width: 100%;
      border-collapse: collapse;
      border: 1.5px solid #000000;
      font-size: 11px;
      margin-top: 8px;
      margin-bottom: 10px;
    }
    .tax-breakdown-table th,
    .tax-breakdown-table td {
      border: 1px solid #000000;
      padding: 5px 8px;
    }
    .tax-breakdown-table th {
      font-weight: 700;
      background-color: transparent;
      color: #000000;
    }
    .tax-words-box {
      border: 1.5px solid #000000;
      padding: 6px 10px;
      font-size: 11px;
      font-weight: 700;
      color: #111827;
      text-transform: uppercase;
      margin-top: 10px;
      margin-bottom: 22px;
      page-break-inside: avoid;
    }
    .running-footer {
      border-top: 1px dashed #cbd5e1;
      padding-top: 8px;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #4b5563;
      page-break-inside: avoid;
    }
    .footer-col-title {
      color: #6b7280;
      font-size: 9px;
      margin-bottom: 2px;
    }
    .footer-col-val {
      color: #111827;
      font-weight: 700;
    }
    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      .invoice-wrapper {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-wrapper">
    <!-- Header: Title & Logo -->
    <div class="header-top">
      <div>
        <h1 class="header-title">${docTitle}</h1>
        <div class="header-meta">
          <div class="header-meta-row">
            <span class="header-meta-label">Invoice No #</span>
            <span class="header-meta-val">${invoiceNo}</span>
          </div>
          <div class="header-meta-row">
            <span class="header-meta-label">Invoice Date</span>
            <span class="header-meta-val">${headerDateStr}</span>
          </div>
        </div>
      </div>
      <div class="header-logo">
        <img src="${AGNIVRIDHI_LOGO_BASE64}" alt="AgniVridhi India Logo" />
      </div>
    </div>

    <!-- Billed By & Billed To Cards -->
    <div class="cards-row">
      <!-- Billed By (Static) -->
      <div class="address-card">
        <div class="card-kicker">Billed By</div>
        <div class="card-name">AgniVridhi India</div>
        <div class="card-address">
          UrbTech Trade Centre, Sector 132,<br>
          Noida,<br>
          Uttar Pradesh, India - 201304
        </div>
        <div class="card-meta-list">
          <div><strong>GSTIN:</strong> 09ABCCA3869R1ZU</div>
          <div><strong>PAN:</strong> ABCCA3869R</div>
          <div><strong>Email:</strong> akash@agnivridhiindia.com</div>
          <div><strong>Phone:</strong> +91 92895 55190</div>
        </div>
      </div>

      <!-- Billed To (Dynamic) -->
      <div class="address-card">
        <div class="card-kicker">Billed To</div>
        <div class="card-name">${clientName}</div>
        <div class="card-address">${formattedAddress}</div>
        <div class="card-meta-list">
          ${hasGstin ? `<div><strong>GSTIN:</strong> ${clientGstin}</div>` : ""}
          ${clientPan ? `<div><strong>PAN:</strong> ${clientPan}</div>` : ""}
          ${clientEmail ? `<div><strong>Email:</strong> ${clientEmail}</div>` : ""}
          ${clientPhone ? `<div><strong>Phone:</strong> ${clientPhone}</div>` : ""}
        </div>
      </div>
    </div>

    <!-- Country & Place of Supply -->
    <div class="supply-row">
      <span>Country of Supply: India</span>
      <span>Place of Supply: ${placeOfSupplyWithCode}</span>
    </div>

    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 32%;">Item</th>
          <th style="width: 10%;" class="text-center">GST Rate</th>
          <th style="width: 8%;" class="text-center">Quantity</th>
          <th style="width: 12%;" class="text-right">Rate</th>
          <th style="width: 13%;" class="text-right">Amount</th>
          <th style="width: 12%;" class="text-right">${isIgst ? "IGST" : "CGST/SGST"}</th>
          <th style="width: 13%;" class="text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        <tr class="item-row">
          <td>1. &nbsp; ${description} (HSN/SAC: ${hsnSac})</td>
          <td class="text-center">${gstPercent}%</td>
          <td class="text-center">${quantity}</td>
          <td class="text-right">₹${formatIntAmount(rate)}</td>
          <td class="text-right">₹${formatAmount(taxableAmount)}</td>
          <td class="text-right">₹${formatAmount(totalGst)}</td>
          <td class="text-right">₹${formatAmount(totalAmount)}</td>
        </tr>
        <tr class="total-row">
          <td>Total</td>
          <td></td>
          <td class="text-center">${quantity}</td>
          <td></td>
          <td class="text-right">₹${formatAmount(taxableAmount)}</td>
          <td></td>
          <td class="text-right">₹${formatAmount(totalAmount)}</td>
        </tr>
      </tbody>
    </table>

    <!-- Words and Totals Summary -->
    <div class="summary-split">
      <div class="words-col">
        Total (in words) : ${totalInWords}
      </div>
      <div class="totals-col">
        <table class="totals-inner-table">
          <tr>
            <td style="color: #374151;">Amount</td>
            <td class="text-right" style="font-weight: 600;">₹${formatAmount(taxableAmount)}</td>
          </tr>
          ${hasGst ? (isIgst ? `
          <tr>
            <td style="color: #374151;">IGST (${gstPercent}%)</td>
            <td class="text-right" style="font-weight: 600;">₹${formatAmount(totalGst)}</td>
          </tr>
          ` : `
          <tr>
            <td style="color: #374151;">CGST (${(gstPercent / 2).toFixed(1)}%)</td>
            <td class="text-right" style="font-weight: 600;">₹${formatAmount(totalGst / 2)}</td>
          </tr>
          <tr>
            <td style="color: #374151;">SGST (${(gstPercent / 2).toFixed(1)}%)</td>
            <td class="text-right" style="font-weight: 600;">₹${formatAmount(totalGst / 2)}</td>
          </tr>
          `) : ""}
          <tr class="grand-total-row">
            <td>Total (INR)</td>
            <td class="text-right">₹${formatAmount(totalAmount)}</td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Stamp & Authorised Signatory -->
    <div class="stamp-sign-wrap">
      <div class="stamp-sign-box">
        ${!isProforma ? `<img src="${AGNIVRIDHI_STAMP_BASE64}" alt="AgniVridhi Authorised Signatory Stamp" />` : `<div style="height: 60px;"></div>`}
        <div class="stamp-sign-label">Authorised Signatory</div>
      </div>
    </div>

    ${hasGst ? `
    <!-- Tax Breakdown Table -->
    <table class="tax-breakdown-table">
      <thead>
        <tr>
          <th rowspan="2" style="width: 28%; text-align: left;">Tax Rate</th>
          <th colspan="2" style="width: 44%; text-align: center;">${isIgst ? "IGST" : "GST"}</th>
          <th rowspan="2" style="width: 28%; text-align: right;">Total</th>
        </tr>
        <tr>
          <th style="width: 20%; text-align: center;">Rate</th>
          <th style="width: 24%; text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${gstPercent}%</td>
          <td class="text-center">${gstPercent}%</td>
          <td class="text-right">₹${formatIntAmount(totalGst)}</td>
          <td class="text-right">₹${formatIntAmount(totalGst)}</td>
        </tr>
        <tr style="font-weight: 700;">
          <td>Total</td>
          <td></td>
          <td class="text-right">₹${formatIntAmount(totalGst)}</td>
          <td class="text-right">₹${formatIntAmount(totalGst)}</td>
        </tr>
      </tbody>
    </table>

    <!-- Total Tax in Words -->
    <div class="tax-words-box">
      Total Tax In Words: ${taxInWords}
    </div>
    ` : ""}

    <!-- Running Footer -->
    <div class="running-footer">
      <div>
        <div class="footer-col-title">Invoice No</div>
        <div class="footer-col-val">${invoiceNo}</div>
      </div>
      <div>
        <div class="footer-col-title">Invoice Date</div>
        <div class="footer-col-val">${footerDateStr}</div>
      </div>
      <div style="max-width: 45%;">
        <div class="footer-col-title">Billed To</div>
        <div class="footer-col-val" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${clientName}
        </div>
      </div>
      <div style="text-align: right;">
        <div class="footer-col-title">&nbsp;</div>
        <div class="footer-col-val">Page 1 of 1</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}
