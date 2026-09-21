/**
 * Agni CRM — docxService
 * 
 * Generates exact 7-page (Common Scheme) and 8-page (Private Funding) 
 * agreement document text and PDF files dynamically matching user PDF templates.
 * 
 * Dynamic Placeholders:
 *   - (FULL DATE) / (DATE DD/MM/YYYY) => fields.date
 *   - (COMPANY NAME) => fields.company
 *   - (COMPANY ADDRESS) => fields.address
 *   - (PRICE PITCHED BY THE SALES PERSON) => fields.pitched
 *   - (TOKEN MONEY RECEIVED) => fields.received
 *   - (PAYMENT LEFT) / (PAYMENT REMAINING) => fields.left
 *   - (DISPERSMENT RATE) => fields.rate
 * 
 * Note: All dynamic values render in plain black text without blue highlights
 * so the client sees a seamless, authentic legal document.
 */

import {
  agreementService,
  TEMPLATE_TYPES,
  TEMPLATE_NAMES,
  TEMPLATE_FILES,
  getTemplateTypeForService,
  normalizeAgreementData,
} from "../../services/agreementService";

export const TEMPLATES = {
  SCHEME: {
    name: TEMPLATE_NAMES.SCHEME,
    file: TEMPLATE_FILES.SCHEME,
  },
  PRIVATE_FUNDING: {
    name: TEMPLATE_NAMES.PRIVATE_FUNDING,
    file: TEMPLATE_FILES.PRIVATE_FUNDING,
  },
};

export { getTemplateTypeForService, TEMPLATE_TYPES, TEMPLATE_NAMES, TEMPLATE_FILES };

export function cleanCurrencyValue(val) {
  if (val === null || val === undefined || val === "") return "0";
  let str = String(val).trim();
  if (/^\d+$/.test(str)) {
    return Number(str).toLocaleString("en-IN");
  }
  return str.replace(/^₹\s*/, "");
}

/**
 * Extracts and formats dynamic values from agreement record
 */
export function getAgreementDynamicFields(agr) {
  const norm = normalizeAgreementData(agr) || {};
  const date = norm.agreementDate || norm.agreement?.date || norm.createdAt || "09/09/2026";
  const company = norm.companyName || norm.client?.companyName || norm.clientName || "Client Company Name";
  const address = norm.companyAddress || norm.client?.address || norm.address || "Client Registered Address";
  const pitched = norm.pitchedMoney || norm.agreement?.pricing?.pitched || "50,000";
  const received = norm.paymentReceived || norm.agreement?.pricing?.received || "20,000";
  const left = norm.paymentLeft || norm.agreement?.pricing?.left || "30,000";
  let rate = norm.disbursementRate || norm.agreement?.pricing?.successRate || "5%";
  if (typeof rate === "string" && !rate.includes("%") && !isNaN(Number(rate.replace(/[^0-9.]/g, "")))) {
    rate = `${rate}%`;
  }

  const isPrivate =
    norm.scheme?.type === TEMPLATE_TYPES.PRIVATE_FUNDING ||
    norm.templateType === TEMPLATE_TYPES.PRIVATE_FUNDING ||
    (norm.scheme?.name && norm.scheme.name.toLowerCase().includes("private funding")) ||
    (norm.serviceType && norm.serviceType.toLowerCase().includes("private funding"));

  return {
    date,
    company,
    address,
    pitched,
    received,
    left,
    rate,
    isPrivate,
    schemeName: norm.scheme?.name || norm.serviceType || "PMEGP",
    id: norm.id || "AGR-WZ-2026-001",
    appId: norm.applicationId || norm.appId || "APP-WZ-2026-001",
    clientName: norm.clientName || company,
  };
}

// Circular Company Seal Stamp SVG
const sealStampSvg = `
  <svg width="60" height="60" viewBox="0 0 100 100" style="display:inline-block; vertical-align:middle;">
    <circle cx="50" cy="50" r="46" fill="none" stroke="#1e3a8a" stroke-width="2" />
    <circle cx="50" cy="50" r="40" fill="none" stroke="#1e3a8a" stroke-width="0.8" stroke-dasharray="2 2" />
    <circle cx="50" cy="50" r="38" fill="none" stroke="#1e3a8a" stroke-width="1.2" />
    <path id="sealArcTop" d="M 18 50 A 32 32 0 1 1 82 50" fill="none" />
    <text font-size="7" font-family="Arial, sans-serif" font-weight="bold" fill="#1e3a8a" letter-spacing="0.4">
      <textPath href="#sealArcTop" startOffset="50%" text-anchor="middle">AGNIVRIDHI INDIA</textPath>
    </text>
    <path id="sealArcBot" d="M 82 50 A 32 32 0 0 1 18 50" fill="none" />
    <text font-size="7" font-family="Arial, sans-serif" font-weight="bold" fill="#1e3a8a" letter-spacing="0.4">
      <textPath href="#sealArcBot" startOffset="50%" text-anchor="middle">PRIVATE LIMITED</textPath>
    </text>
    <path d="M 50 28 C 45 38 42 43 42 50 C 42 56 46 60 50 60 C 54 60 58 56 58 50 C 58 43 55 38 50 28 Z M 50 40 C 52 45 54 48 54 52 C 54 55 52 57 50 57 C 48 57 46 55 46 52 C 46 48 48 45 50 40 Z" fill="#1e3a8a" />
  </svg>
`;

// Cursive Rahul Signature SVG
const rahulSignatureSvg = `
  <svg width="130" height="50" viewBox="0 0 160 70" fill="none" stroke="#1e3a8a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-top:6px;">
    <path d="M 20 50 C 25 20, 35 15, 40 35 C 45 50, 48 45, 55 35 C 60 25, 65 30, 68 45 C 72 35, 78 35, 82 45 C 86 35, 92 35, 96 45 C 100 40, 105 40, 110 45 L 115 45 M 120 47 A 2 2 0 1 1 120 46" />
    <path d="M 15 58 L 135 52" stroke-width="2" />
  </svg>
`;

/**
 * Generates exact multi-page document HTML matching PDF templates
 */
export function generateAgreementDocumentHtml(agr) {
  const fields = getAgreementDynamicFields(agr);
  const pitchedVal = cleanCurrencyValue(fields.pitched);
  const receivedVal = cleanCurrencyValue(fields.received);
  const leftVal = cleanCurrencyValue(fields.left);

  if (fields.isPrivate) {
    // ── PRIVATE FUNDING AGREEMENT (8 PAGES) ──
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${fields.company} Agreement</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 15mm 15mm 15mm 15mm;
          }
          @media print {
            html, body { background: #ffffff !important; color: #000000 !important; margin: 0 !important; padding: 0 !important; }
            .page { page-break-after: always; break-after: page; min-height: 96vh; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box; }
          }
          body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; line-height: 1.55; color: #000000; margin: 0; padding: 0; background: #e2e8f0; }
          .page { background: #ffffff; width: 210mm; min-height: 297mm; margin: 20px auto; padding: 20mm 20mm 15mm 20mm; box-sizing: border-box; box-shadow: 0 4px 15px rgba(0,0,0,0.1); display: flex; flex-direction: column; justify-content: space-between; position: relative; }
          .page-content { flex: 1; }
          h1 { text-align: center; font-size: 18pt; font-weight: bold; margin-bottom: 24px; text-transform: uppercase; color: #000000; }
          h2 { font-size: 11pt; font-weight: bold; margin-top: 14px; margin-bottom: 6px; color: #000000; }
          p { margin-bottom: 10px; text-align: justify; color: #000000; }
          ul { margin-top: 4px; margin-bottom: 10px; padding-left: 24px; }
          li { margin-bottom: 6px; color: #000000; }
          .dynamic-val { color: #000000; font-weight: bold; }
          .footer-strip { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #cbd5e1; padding-top: 8px; margin-top: 16px; font-size: 10pt; font-weight: bold; color: #000000; }
          .signature-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          .signature-table td { width: 50%; border: 1px solid #000000; padding: 10px 12px; vertical-align: top; font-size: 10.5pt; }
          .undertaking-header { text-align: center; font-size: 14pt; font-weight: bold; margin-bottom: 16px; text-transform: uppercase; }
          ol { padding-left: 20px; margin-top: 6px; }
          ol li { margin-bottom: 10px; text-align: justify; }
        </style>
      </head>
      <body>
        <!-- PAGE 1 -->
        <div class="page">
          <div class="page-content">
            <h1>CONSULTANCY SERVICE AGREEMENT</h1>
            <p>This <strong>CONSULTANCY SERVICE AGREEMENT</strong> (the “Agreement”) is entered into on this <span class="dynamic-val">${fields.date}</span>, by and between:</p>
            <ul>
              <li><strong>Agnivridhi India</strong>, hereinafter referred to as the <em>Service Provider</em>, having its principal place of business at <strong>Lg-02, H-165, Sector 63, Noida, Gautam Buddha Nagar, Noida, Uttar Pradesh, India, 201301</strong>;</li>
            </ul>
            <p>and</p>
            <ul>
              <li><strong><span class="dynamic-val">${fields.company}</span></strong> hereinafter referred to as the <em>Service Receiver</em>, having its principal place of business at 202, Vandana Golden Springs, Near Ryan International School, <strong><span class="dynamic-val">${fields.address}</span></strong>.</li>
            </ul>
            <p><strong>WHEREAS</strong>, the Service Provider agrees to provide consultancy services for assisting the Service Receiver in raising Private Funding by facilitating investor outreach, investor introductions, investor meeting coordination, pitch presentation support, and related consultancy services.</p>
            <h2>1) Definitions</h2>
            <p>a) <strong>Agreement</strong>: Refers to this Agreement and all annexures or amendments made in writing and mutually agreed upon by both parties.</p>
            <p>b) <strong>Service Provider</strong>: The party providing the consultancy services in exchange for payment.</p>
            <p>c) <strong>Service Receiver</strong>: The party receiving and availing the consultancy services.</p>
            <h2>2) Covenants of the Service Provider</h2>
            <p>a) review and assist in preparation of Pitch Deck, Business Profile, Financial Projections, Investor Memorandum, and other documents required for investor discussions under the <strong>CONSULTANCY SERVICE</strong> based on the information and data received from the Service Receiver. Upon request, the Service Provider may also submit the application on behalf of the Service Receiver.</p>
            <p>b) The Service Provider agrees to maintain strict confidentiality of all information and documents provided by the Service Receiver and shall not disclose them to any third party except authorized personnel.</p>
            <h2>3) Covenants of the Service Receiver</h2>
            <p>a) The Service Receiver acknowledges that the registration and application process is subject to change as per applicable norms and has no objection if delays arise due to such changes.</p>
            <p>b) The Service Receiver agrees to pay a Consultancy fee of <strong>₹<span class="dynamic-val">${pitchedVal}</span></strong> as per the following structure:</p>
          </div>
          <div class="footer-strip">
            <span>Service Provider</span>
            <div>${sealStampSvg}</div>
            <span>Service Receiver</span>
          </div>
        </div>

        <!-- PAGE 2 -->
        <div class="page">
          <div class="page-content">
            <ul>
              <li>Stage 1: <strong>₹<span class="dynamic-val">${receivedVal}</span></strong> as token money, payable at the time of signing this Agreement.</li>
              <li>Stage 2: <strong>₹<span class="dynamic-val">${leftVal}</span></strong> At the time of Interview</li>
              <li>Stage 3: <strong><span class="dynamic-val">${fields.rate}</span></strong> as success fee of the funded amount, payable after the disbursement.</li>
            </ul>
            <p>c) The Service Receiver shall provide all required documents requested by the Service Provider for processing the application.</p>
            <p>d) Refund Clause:</p>
            <ul>
              <li>All payments made to Agnivridhi India are strictly non-refundable once services have commenced.</li>
              <li>Delays or rejections by the bank or authority will not constitute grounds for refund<br>Services will commence only after signing this Agreement.</li>
            </ul>
            <p>e) All payments must be made only to Agnivridhi India’s official bank account.</p>
            <ul>
              <li>The Company shall not be responsible for any payment made which is not mentioned in this agreement payment terms.</li>
              <li>Such payments will not be recognized or refunded by the Company.</li>
            </ul>
            <h2>4. Funding Process</h2>
            <p>The funding process shall include:</p>
            <p>• Business Profile Review.</p>
            <p>• Pitch Deck and Financial Review.</p>
            <p>• Investor Identification and Outreach.</p>
            <p>• Coordination with prospective Investors.</p>
            <p>• Scheduling Investor Meetings.</p>
            <p>• Facilitation of Investor Discussions.</p>
            <p>• Follow-up regarding Investor Feedback.</p>
            <p>The process flow shall generally follow:</p>
            <p><strong>Business Review → Investor Outreach → Investor Meeting → Investor Evaluation → Funding Decision</strong></p>
            <p>The Service Provider's role shall remain limited to facilitation and coordination only.</p>
            <h2>5. Funding Eligibility</h2>
            <p>Funding eligibility shall depend upon:</p>
            <p>• Business viability.</p>
            <p>• Revenue model.</p>
          </div>
          <div class="footer-strip">
            <span>Service Provider</span>
            <div>${sealStampSvg}</div>
            <span>Service Receiver</span>
          </div>
        </div>

        <!-- PAGE 3 -->
        <div class="page">
          <div class="page-content">
            <p>• Management capability.</p>
            <p>• Financial performance.</p>
            <p>• Market opportunity.</p>
            <p>• Investor preferences.</p>
            <p>The Service Provider shall not be responsible for rejection by any investor.</p>
            <h2>6. Investor Evaluation</h2>
            <p>The Service Receiver acknowledges that investors may independently conduct due diligence, financial review, management assessment, and market evaluation before making any investment decision.</p>
            <h2>7. Duration & Processing Timeline</h2>
            <p>Investor funding timelines depend entirely upon investor evaluation and internal decision-making processes.</p>
            <p>The Service Provider shall not be responsible for delays caused by investors, due diligence requirements, negotiations, or market conditions.</p>
            <h2>8. Documentation & Procedures</h2>
            <p>The Service Receiver shall provide:</p>
            <p>• Pitch Deck</p>
            <p>• Financial Statements</p>
            <p>• Company Profile</p>
            <p>• Business Plan</p>
            <p>• Incorporation Documents</p>
            <p>The Service Provider shall assist in reviewing and organizing such documentation.</p>
            <h2>9. Company Duties & Responsibilities</h2>
            <p>Agnivridhi India shall:</p>
            <p>Review funding documents.</p>
            <p>• Approach suitable investors.</p>
            <p>• Coordinate investor communications.</p>
            <p>• Schedule a maximum of Two (2) Investor Meetings.</p>
            <p>• Facilitate discussions between investors and the Service Receiver.</p>
            <p>The Company's responsibility is strictly limited to consultation, investor introductions, meeting coordination, and facilitation only.</p>
            <p><strong>The Company does not guarantee funding, investment approval, valuation, or issuance of any term sheet.</strong></p>
          </div>
          <div class="footer-strip">
            <span>Service Provider</span>
            <div>${sealStampSvg}</div>
            <span>Service Receiver</span>
          </div>
        </div>

        <!-- PAGE 4 -->
        <div class="page">
          <div class="page-content">
            <h2>10. Client Duties & Responsibilities</h2>
            <p>The Client must:</p>
            <ul>
              <li>Provide accurate information and documents.</li>
              <li>Respond promptly to all communications.</li>
              <li>Bear all government, bank, and third-party fees directly if applicable.</li>
            </ul>
            <p>Failure to cooperate may result in delay or termination of service without refund.</p>
            <h2>11. Investor Decision Process</h2>
            <p>The Service Receiver understands that:</p>
            <p>• The final funding decision shall rest solely with the Investor.</p>
            <p>• Investors may approve, reject, delay, negotiate, or withdraw from investment discussions at their sole discretion.</p>
            <p>• The Service Provider has no authority to influence investor decisions.</p>
            <p>• The Service Provider's obligations shall be deemed substantially fulfilled upon scheduling and coordinating up to Two (2) Investor Meetings.</p>
            <h2>12. Time Limitation & Workflow</h2>
            <p>The estimated duration for investor outreach and meetings may vary depending upon investor availability and response time.</p>
            <p>The Service Provider shall not be responsible for delays caused by investors or external parties.</p>
            <h2>13. Liability Disclaimer</h2>
            <p>The Company shall not be liable for:</p>
            <p>The Company shall not be liable for:</p>
            <p>• Investor rejection.</p>
            <p>• Investor withdrawal.</p>
            <p>• Funding delays.</p>
            <p>• Valuation disagreements.</p>
            <p>• Failure to secure funding.</p>
            <p>• Investor due diligence observations.</p>
            <p>• Commercial terms proposed by investors.</p>
            <p>• Any financial loss incurred by the Client.</p>
            <h2>14) Term</h2>
            <p>This Agreement automatically expires if the Service Receiver fails to provide required documents or information within 30 days from the date of signing.</p>
            <p>In such cases, no refund or adjustment will be applicable.</p>
          </div>
          <div class="footer-strip">
            <span>Service Provider</span>
            <div>${sealStampSvg}</div>
            <span>Service Receiver</span>
          </div>
        </div>

        <!-- PAGE 5 -->
        <div class="page">
          <div class="page-content">
            <p>This Agreement shall be valid for a period of three (3) months from the date of execution, unless terminated earlier in accordance with the terms herein.</p>
            <h2>15) Termination</h2>
            <p>a) Either party may terminate this Agreement by giving a <strong>30-day prior written notice</strong>.</p>
            <p>b) Immediate Termination: The Service Provider reserves the right to terminate this Agreement with immediate effect if the Service Receiver fails to comply with any clause of this Agreement.</p>
            <p>c) Termination shall not affect the Service Provider’s right to claim payment for services rendered up to the termination date.</p>
            <h2>16) Relationship</h2>
            <p>This Agreement does not create any employment, agency, or partnership relationship between the parties. Each party is an independent contractor.</p>
            <h2>17) Third Parties</h2>
            <p>This Agreement does not grant any rights or claims to third parties.</p>
            <h2>18) Modification</h2>
            <p>Any changes to this Agreement must be made in writing and signed by both parties.</p>
            <h2>19) Severability</h2>
            <p>If any clause is held to be invalid, the rest of the Agreement remains enforceable and in effect.</p>
            <h2>20) Enforcement and Waiver</h2>
            <p>Failure to enforce any part of this Agreement does not constitute a waiver of that part in the future.</p>
            <h2>21) Effective Date</h2>
            <p>The effective date of this Agreement shall be <strong><span class="dynamic-val">${fields.date}</span></strong>, regardless of the actual date of signature.</p>
            <h2>22) Governing Law</h2>
            <p>In the event of any dispute or disagreement arising out of this Agreement, the same shall first be resolved through mutual discussion.</p>
            <p>If unresolved within 15 days, it shall be referred to a <strong>sole arbitrator</strong> appointed mutually under the <strong>Arbitration and Conciliation Act, 1996</strong>.</p>
            <p>The arbitration shall be conducted in English at Delhi.</p>
            <h2>23) Notices</h2>
            <p>All notices shall be sent via registered post or email to the addresses mentioned or last known.</p>
            <h2>24) Entire Agreement</h2>
            <p>This document constitutes the <strong>entire agreement</strong> between the parties and supersedes all prior communications.</p>
          </div>
          <div class="footer-strip">
            <span>Service Provider</span>
            <div>${sealStampSvg}</div>
            <span>Service Receiver</span>
          </div>
        </div>

        <!-- PAGE 6 -->
        <div class="page">
          <div class="page-content">
            <h2>25) Counterparts</h2>
            <p>This Agreement may be signed in counterparts, all of which together will constitute one agreement.</p>
            <h2>26. Acceptance & Acknowledgment</h2>
            <p>The Service Receiver acknowledges and agrees that:</p>
            <p>a) Agnivridhi India Private Limited acts solely as a consultant and facilitator.</p>
            <p>b) The Service Provider is responsible only for investor outreach, coordination, and scheduling of up to Two (2) Investor Meetings.</p>
            <p>c) No guarantee of funding, investment, valuation, approval, or timeline has been provided.</p>
            <p>d) The final decision regarding investment shall rest solely with the Investor.</p>
            <p>e) Investor rejection, delay, withdrawal, or non-investment shall not constitute grounds for refund, compensation, or legal claim against the Service Provider.</p>
            <p>f) Upon scheduling and coordinating Two (2) Investor Meetings, the Service Provider's primary obligations shall be deemed fulfilled.</p>
          </div>
          <div class="footer-strip">
            <span>Service Provider</span>
            <div>${sealStampSvg}</div>
            <span>Service Receiver</span>
          </div>
        </div>

        <!-- PAGE 7 -->
        <div class="page">
          <div class="page-content">
            <p><strong>IN WITNESS WHEREOF</strong>, the undersigned have executed this Agreement on the day and year first written above.</p>
            <table class="signature-table">
              <tr>
                <td>
                  Signed and delivered for and on behalf of<br><br>
                  <strong>Name: Agnivridhi India Private Limited</strong><br>
                  Title: Director<br>
                  Date: <span class="dynamic-val">${fields.date}</span><br><br>
                  Signature:<br>
                  ${rahulSignatureSvg}
                </td>
                <td>
                  I have read and understood the provisions of this Agreement &amp; hereby accept the same.<br><br>
                  <strong>Name: <span class="dynamic-val">${fields.company}</span></strong><br>
                  Title: Director<br>
                  Date: <span class="dynamic-val">${fields.date}</span><br><br>
                  Signature:
                </td>
              </tr>
            </table>
          </div>
          <div class="footer-strip">
            <span>Service Provider</span>
            <div>${sealStampSvg}</div>
            <span>Service Receiver</span>
          </div>
        </div>

        <!-- PAGE 8 -->
        <div class="page">
          <div class="page-content">
            <div class="undertaking-header">UNDERTAKING</div>
            <p>I, the Director/Partner of <strong><span class="dynamic-val">${fields.company}</span></strong> do hereby undertake as follows:</p>
            <ol type="i">
              <li>That I shall fully comply with all the sub-clauses stated under Clause (3) of the Consultancy Service Agreement. Any failure to do so shall result in immediate termination of this Agreement and forfeiture of the amount paid.</li>
              <li>All official communications shall be through the company’s registered email domain (<strong>Legal@agnivridhiindia.com</strong>) or via written letters.<br>Communications or commitments made via WhatsApp, calls, or personal chats will not be considered official or binding.</li>
              <li>I understand and acknowledge that providing false, misleading, or incomplete information will render this Agreement voidable at the sole discretion of the Service Provider and the fee shall be non-refundable.</li>
              <li>I hereby confirm that I have read, understood, and accepted all the terms and conditions mentioned on the official website of the Service Provider at www.agnivridhiindia.com, as well as those laid out in this Agreement.</li>
            </ol>
          </div>
          <div class="footer-strip">
            <span>Service Provider</span>
            <div>${sealStampSvg}</div>
            <span>Service Receiver</span>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // ── COMMON SCHEME AGREEMENT (EXACT 7 PAGES) ──
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${fields.company} Agreement</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 15mm 15mm 15mm 15mm;
        }
        @media print {
          html, body { background: #ffffff !important; color: #000000 !important; margin: 0 !important; padding: 0 !important; }
          .page { page-break-after: always; break-after: page; min-height: 96vh; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box; }
        }
        body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; line-height: 1.55; color: #000000; margin: 0; padding: 0; background: #e2e8f0; }
        .page { background: #ffffff; width: 210mm; min-height: 297mm; margin: 20px auto; padding: 20mm 20mm 15mm 20mm; box-sizing: border-box; box-shadow: 0 4px 15px rgba(0,0,0,0.1); display: flex; flex-direction: column; justify-content: space-between; position: relative; }
        .page-content { flex: 1; }
        h1 { text-align: center; font-size: 18pt; font-weight: bold; margin-bottom: 24px; text-transform: uppercase; color: #000000; }
        h2 { font-size: 11pt; font-weight: bold; margin-top: 14px; margin-bottom: 6px; color: #000000; }
        p { margin-bottom: 10px; text-align: justify; color: #000000; }
        ul { margin-top: 4px; margin-bottom: 10px; padding-left: 24px; }
        li { margin-bottom: 6px; color: #000000; }
        .dynamic-val { color: #000000; font-weight: bold; }
        .footer-strip { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #cbd5e1; padding-top: 8px; margin-top: 16px; font-size: 10pt; font-weight: bold; color: #000000; }
        .signature-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .signature-table td { width: 50%; border: 1px solid #000000; padding: 10px 12px; vertical-align: top; font-size: 10.5pt; }
        .undertaking-header { text-align: center; font-size: 14pt; font-weight: bold; margin-bottom: 16px; text-transform: uppercase; }
        ol { padding-left: 20px; margin-top: 6px; }
        ol li { margin-bottom: 10px; text-align: justify; }
      </style>
    </head>
    <body>
      <!-- PAGE 1 -->
      <div class="page">
        <div class="page-content">
          <h1>CONSULTANCY SERVICE AGREEMENT</h1>
          <p>This <strong>CONSULTANCY SERVICE AGREEMENT</strong> (the “Agreement”) is entered into on this <span class="dynamic-val">${fields.date}</span>, by and between:</p>
          <ul>
            <li><strong>Agnivridhi India</strong>, hereinafter referred to as the <em>Service Provider</em>, having its principal place of business at <strong>Lg-02, H-165, Sector 63, Noida, Gautam Buddha Nagar, Noida, Uttar Pradesh, India, 201301</strong>;</li>
          </ul>
          <p>and</p>
          <ul>
            <li><strong><span class="dynamic-val">${fields.company}</span></strong> hereinafter referred to as the <em>Service Receiver</em>, having its principal place of business at <strong><span class="dynamic-val">${fields.address}</span></strong>.</li>
          </ul>
          <p><strong>WHEREAS</strong>, the Service Provider agrees to provide consultancy services for assisting the Service Receiver in availing benefits under the <strong>CONSULTANCY SERVICE</strong> including assistance in form filling and completion of the necessary documentation as required under the scheme.</p>
          <h2>1) Definitions</h2>
          <p>a) <strong>Agreement</strong>: Refers to this Agreement and all annexures or amendments made in writing and mutually agreed upon by both parties.</p>
          <p>b) <strong>Service Provider</strong>: The party providing the consultancy services in exchange for payment.</p>
          <p>c) <strong>Service Receiver</strong>: The party receiving and availing the consultancy services.</p>
          <h2>2) Covenants of the Service Provider</h2>
          <p>a) The Service Provider shall prepare all the necessary documents for filing the application under the <strong>CONSULTANCY SERVICE</strong> based on the information and data received from the Service Receiver. Upon request, the Service Provider may also submit the application on behalf of the Service Receiver.</p>
          <p>b) The Service Provider agrees to maintain strict confidentiality of all information and documents provided by the Service Receiver and shall not disclose them to any third party except authorized personnel.</p>
          <h2>3) Covenants of the Service Receiver</h2>
          <p>a) The Service Receiver acknowledges that the registration and application process is subject to change as per applicable norms and has no objection if delays arise due to such changes.</p>
          <p>b) The Service Receiver agrees to pay a Consultancy fee of <strong>₹<span class="dynamic-val">${pitchedVal}</span></strong> as per the following structure:</p>
          <ul>
            <li>Stage 1: <strong>₹<span class="dynamic-val">${receivedVal}</span></strong> as token money, payable at the time of signing this Agreement.</li>
            <li>Stage 2: <strong>₹<span class="dynamic-val">${leftVal}</span></strong> to initiate the preparation of reports and commence the work.</li>
          </ul>
        </div>
        <div class="footer-strip">
          <span>Service Provider</span>
          <div>${sealStampSvg}</div>
          <span>Service Receiver</span>
        </div>
      </div>

      <!-- PAGE 2 -->
      <div class="page">
        <div class="page-content">
          <ul>
            <li>Stage 3: <strong><span class="dynamic-val">${fields.rate}</span></strong> as success fee of the funded amount, payable after the disbursement.</li>
          </ul>
          <p>c) The Service Receiver shall provide all required documents requested by the Service Provider for processing the application.</p>
          <p>d) Refund Clause:</p>
          <ul>
            <li>All payments made to Agnivridhi India are strictly non-refundable once services have commenced.</li>
            <li>Refunds shall be made only if the Service Provider fails to initiate or deliver the consultancy work as per the receiving complete client documentation.</li>
            <li>Delays or rejections by the bank or authority will not constitute grounds for refund<br>Services will commence only after signing this Agreement.</li>
          </ul>
          <p>e) All payments must be made only to Agnivridhi India’s official bank account.</p>
          <ul>
            <li>The Company shall not be responsible for any payment made which is not mentioned in this agreement payment terms.</li>
            <li>Such payments will not be recognized or refunded by the Company.</li>
          </ul>
          <h2>4. Scheme Details & Process</h2>
          <p>The loan process shall include:</p>
          <ul>
            <li>Application preparation under the selected <strong>Government Scheme/ Any Other Schemes</strong>.</li>
            <li>Submission to the authorized <strong>Bank / Financial Institution/or any other Body</strong>.</li>
            <li>Coordination with the concerned department for approval and disbursement.</li>
          </ul>
          <p>The process flow will follow government protocol from <strong>Scheme → Bank → Beneficiary</strong>.</p>
          <h2>5. Eligibility Criteria</h2>
          <p>Eligibility will depend on the documents and project details provided by the Client. Agnivridhi India will not be responsible for rejection due to incorrect, false, or incomplete documents or information supplied by the Client.</p>
          <h2>6. Waiver Benefits & Interest Subsidy</h2>
          <p>Any interest waiver, moratorium, or subsidy under the chosen scheme shall be governed by official scheme guidelines. The Company will not be liable if such waivers are later modified, delayed, or cancelled by the authority.</p>
          <h2>7. Duration & Processing Timeline</h2>
          <p>The <strong>loan/grant duration or approval timeline</strong> depends solely on the concerned <strong>Bank / Financial Institution /Private Body/ Government Authority</strong>.</p>
          <p>Agnivridhi India has no control over this period. Delays or extended processing time cannot be grounds for refund or compensation claims.</p>
          <h2>8. Documentation & Procedures</h2>
        </div>
        <div class="footer-strip">
          <span>Service Provider</span>
          <div>${sealStampSvg}</div>
          <span>Service Receiver</span>
        </div>
      </div>

      <!-- PAGE 3 -->
      <div class="page">
        <div class="page-content">
          <p>All required documents (KYC, financials, collateral details, etc.) must be submitted by the Client within the requested time frame.</p>
          <p>The <strong>Project Report and Financial Projections</strong> shall be prepared by Agnivridhi India’s scope.</p>
          <h2>9. Company Duties & Responsibilities</h2>
          <p>Agnivridhi India shall:</p>
          <ul>
            <li>Guide the Client in preparing all documentation.</li>
            <li>Coordinate between the Client, and relevant authorities.</li>
            <li>Submit the application under the chosen scheme.</li>
            <li>Follow up for status updates until loan sanction/disbursement.</li>
          </ul>
          <p>The Company’s responsibility is limited to <strong>consultation, documentation, and coordination only</strong>.</p>
          <h2>10. Client Duties & Responsibilities</h2>
          <p>The Client must:</p>
          <ul>
            <li>Provide accurate information and documents.</li>
            <li>Respond promptly to all communications.</li>
            <li>Bear all government, bank, and third-party fees directly if applicable.</li>
          </ul>
          <p>Failure to cooperate may result in delay or termination of service without refund.</p>
          <h2>11. Department & Sanction Process</h2>
          <p>The sanctioning authority will be the concerned <strong>Bank / NBFC / Government Department/ Private Bodies</strong> as per the selected scheme.</p>
          <p>The <strong>Sanction Letter</strong> will be issued officially by that authority and communicated directly to the Client.</p>
          <p>Agnivridhi India’s role ends upon submission, coordination, and approval assistance.</p>
          <h2>12. Time Limitation & Workflow</h2>
          <p>The estimated duration for documentation, submission, and sanction may vary from <strong>30 to 180 working days</strong>, depending on authority response time.</p>
          <p>Agnivridhi India shall not be held responsible for any delay or rejection caused by external agencies.</p>
          <h2>13. Liability Disclaimer</h2>
          <p>The Company shall not be liable for:</p>
          <ul>
            <li>Any delay, rejection, or modification by banks/government bodies/the financial Institution.</li>
            <li>Policy or scheme changes by the government/Lender.</li>
            <li>Any financial loss incurred by the Client due to delay in sanction/disbursement.</li>
          </ul>
          <h2>14) Term</h2>
        </div>
        <div class="footer-strip">
          <span>Service Provider</span>
          <div>${sealStampSvg}</div>
          <span>Service Receiver</span>
        </div>
      </div>

      <!-- PAGE 4 -->
      <div class="page">
        <div class="page-content">
          <p>This Agreement automatically expires if the Service Receiver fails to provide required documents or information within 30 days from the date of signing.</p>
          <p>In such cases, no refund or adjustment will be applicable.</p>
          <p>This Agreement shall be valid for a period of three (3) months from the date of execution, unless terminated earlier in accordance with the terms herein.</p>
          <h2>15) Termination</h2>
          <p>a) Either party may terminate this Agreement by giving a <strong>30-day prior written notice</strong>.</p>
          <p>b) Immediate Termination: The Service Provider reserves the right to terminate this Agreement with immediate effect if the Service Receiver fails to comply with any clause of this Agreement.</p>
          <p>c) Termination shall not affect the Service Provider’s right to claim payment for services rendered up to the termination date.</p>
          <h2>16) Relationship</h2>
          <p>This Agreement does not create any employment, agency, or partnership relationship between the parties. Each party is an independent contractor.</p>
          <h2>17) Third Parties</h2>
          <p>This Agreement does not grant any rights or claims to third parties.</p>
          <h2>18) Modification</h2>
          <p>Any changes to this Agreement must be made in writing and signed by both parties.</p>
          <h2>19) Severability</h2>
          <p>If any clause is held to be invalid, the rest of the Agreement remains enforceable and in effect.</p>
          <h2>20) Enforcement and Waiver</h2>
          <p>Failure to enforce any part of this Agreement does not constitute a waiver of that part in the future.</p>
          <h2>21) Effective Date</h2>
          <p>The effective date of this Agreement shall be <strong><span class="dynamic-val">${fields.date}</span></strong>, regardless of the actual date of signature.</p>
          <h2>22) Governing Law</h2>
          <p>In the event of any dispute or disagreement arising out of this Agreement, the same shall first be resolved through mutual discussion.</p>
          <p>If unresolved within 15 days, it shall be referred to a <strong>sole arbitrator</strong> appointed mutually under the <strong>Arbitration and Conciliation Act, 1996</strong>.</p>
          <p>The arbitration shall be conducted in English at Delhi.</p>
          <h2>23) Notices</h2>
          <p>All notices shall be sent via registered post or email to the addresses mentioned or last known.</p>
          <h2>24) Entire Agreement</h2>
        </div>
        <div class="footer-strip">
          <span>Service Provider</span>
          <div>${sealStampSvg}</div>
          <span>Service Receiver</span>
        </div>
      </div>

      <!-- PAGE 5 -->
      <div class="page">
        <div class="page-content">
          <p>This document constitutes the <strong>entire agreement</strong> between the parties and supersedes all prior communications.</p>
          <h2>25) Counterparts</h2>
          <p>This Agreement may be signed in counterparts, all of which together will constitute one agreement.</p>
          <h2>26. Acceptance & Acknowledgment</h2>
          <p>Both parties confirm that they have read and understood all the terms and conditions of this Agreement and voluntarily agree to be bound by it.</p>
          <p>The Service Receiver understands and acknowledges that the consultancy process involves external departments and banks, and outcomes may vary depending on their internal assessments. Agnivridhi India provides consultancy support only and does not assure any guaranteed sanction or time frame</p>
        </div>
        <div class="footer-strip">
          <span>Service Provider</span>
          <div>${sealStampSvg}</div>
          <span>Service Receiver</span>
        </div>
      </div>

      <!-- PAGE 6 -->
      <div class="page">
        <div class="page-content">
          <p><strong>IN WITNESS WHEREOF</strong>, the undersigned have executed this Agreement on the day and year first written above.</p>
          <table class="signature-table">
            <tr>
              <td>
                Signed and delivered for and on behalf of<br><br>
                <strong>Name: Agnivridhi India Private Limited</strong><br>
                Title: Director<br>
                Date: <span class="dynamic-val">${fields.date}</span><br><br>
                Signature:<br>
                ${rahulSignatureSvg}
              </td>
              <td>
                I have read and understood the provisions of this Agreement &amp; hereby accept the same.<br><br>
                <strong>Name: <span class="dynamic-val">${fields.company}</span></strong><br>
                Title: Director<br>
                Date: <span class="dynamic-val">${fields.date}</span><br><br>
                Signature:
              </td>
            </tr>
          </table>
        </div>
        <div class="footer-strip">
          <span>Service Provider</span>
          <div>${sealStampSvg}</div>
          <span>Service Receiver</span>
        </div>
      </div>

      <!-- PAGE 7 -->
      <div class="page">
        <div class="page-content">
          <div class="undertaking-header">UNDERTAKING</div>
          <p>I, the Director/Partner of <strong><span class="dynamic-val">${fields.company}</span></strong> do hereby undertake as follows:</p>
          <ol type="i">
            <li>That I shall fully comply with all the sub-clauses stated under Clause (3) of the Consultancy Service Agreement. Any failure to do so shall result in immediate termination of this Agreement and forfeiture of the amount paid.</li>
            <li>All official communications shall be through the company’s registered email domain (<strong>Legal@agnivridhiindia.com</strong>) or via written letters.<br>Communications or commitments made via WhatsApp, calls, or personal chats will not be considered official or binding.</li>
            <li>I understand and acknowledge that providing false, misleading, or incomplete information will render this Agreement voidable at the sole discretion of the Service Provider and the fee shall be non-refundable.</li>
            <li>I hereby confirm that I have read, understood, and accepted all the terms and conditions mentioned on the official website of the Service Provider at www.agnivridhiindia.com, as well as those laid out in this Agreement.</li>
          </ol>
        </div>
        <div class="footer-strip">
          <span>Service Provider</span>
          <div>${sealStampSvg}</div>
          <span>Service Receiver</span>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Service method for requesting agreement generation
 */
export async function generateDocxAgreement(payload) {
  return agreementService.generateAgreement(payload);
}

/**
 * Triggers clean PDF document generation / print view
 */
export function downloadPdfFile(agr, filename) {
  const fields = getAgreementDynamicFields(agr);
  const cleanCompany = (fields.company || "Client").trim();
  const htmlContent = generateAgreementDocumentHtml(agr);
  const outFilename = filename || `${cleanCompany} Agreement.pdf`;

  // Open printable PDF tab
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.title = `${cleanCompany} Agreement`;
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      try {
        printWindow.print();
      } catch (e) {
        console.warn("Auto print failed:", e);
      }
    }, 400);
    return { success: true, filename: outFilename, openedWindow: true };
  } else {
    // Fallback: Download printable HTML document if popup was blocked
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = outFilename.replace(/\.pdf$/, ".html");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return { success: true, filename: outFilename };
  }
}

/**
 * Triggers browser download of generated agreement document (.docx)
 */
export function downloadDocxFile(agr, filename) {
  return downloadPdfFile(agr, filename);
}

export default agreementService;
