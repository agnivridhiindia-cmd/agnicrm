import React, { useState, useMemo, useEffect } from "react";
import { apiFetch } from "../../services/apiClient";
import Modal from "../../components/Modal";
import Icon from "../../components/Icon";
import { mockClients } from "./mockClients";
import { isClientCreatedByUser } from "./hooks/useSalesClients";
import { useApiInvoices } from "../../hooks/useApiInvoices";
import { useApiClients } from "../../hooks/useApiClients";

const INVOICE_TABS = ["All Invoices", "Proforma Invoices", "Tax Invoices"];

const formatCurrency = (val) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val || 0);

const formatDateDisplay = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = String(d.getDate()).padStart(2, "0");
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
};

const generateInvoiceId = (type, existingInvoices) => {
  const isProforma = (type || "").toLowerCase().includes("proforma");
  const prefix = isProforma ? "PI" : "INV";
  const now = new Date();
  const dateStamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const count = existingInvoices.length + 1;
  return `${prefix}-${dateStamp}-${String(count).padStart(3, "0")}`;
};

export function generateInvoiceHTML(invoice) {
  const quantity = Number(invoice.quantity) || 1;
  const rate = Number(invoice.rate || invoice.pitchedAmount || invoice.amount || 0);
  const taxableAmount = quantity * rate;
  const gstPercent = Number(invoice.gstPercent) !== undefined ? Number(invoice.gstPercent) : 18;
  const totalGst = taxableAmount * (gstPercent / 100);
  const totalAmount = invoice.totalAmount ? Number(invoice.totalAmount) : (taxableAmount + totalGst);

  const isIgst = (invoice.placeOfSupply || "Uttar Pradesh").trim().toLowerCase() !== "uttar pradesh";
  const isProforma = (invoice.type || "").toLowerCase().includes("proforma");
  const docTitle = isProforma ? "PROFORMA INVOICE" : "TAX INVOICE";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${invoice.id} - ${docTitle}</title>
  <style>
    @page { size: A4; margin: 12mm; }
    * { box-sizing: border-box; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #000;
      margin: 0;
      padding: 15px;
      position: relative;
      background: #fff;
    }
    .watermark {
      position: fixed;
      top: 45%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      font-size: 85px;
      font-weight: bold;
      color: rgba(0, 0, 0, 0.035);
      white-space: nowrap;
      pointer-events: none;
      z-index: 0;
      font-family: Arial, sans-serif;
    }
    .content {
      position: relative;
      z-index: 1;
    }
    .header-company {
      text-align: center;
      margin-bottom: 18px;
    }
    .company-title {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: 0.5px;
      margin: 0 0 4px 0;
      color: #000;
    }
    .company-subtitle {
      font-size: 13px;
      margin: 0 0 6px 0;
      color: #333;
      font-weight: 500;
    }
    .company-details {
      font-size: 11px;
      line-height: 1.45;
      color: #222;
    }
    .doc-title {
      text-align: center;
      font-size: 22px;
      font-weight: 800;
      color: #0066cc;
      letter-spacing: 1px;
      margin: 18px 0 14px 0;
      text-transform: uppercase;
    }
    .meta-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
      font-size: 11.5px;
    }
    .meta-table td {
      border: 1px solid #000;
      padding: 6px 10px;
    }
    .meta-label {
      font-weight: bold;
      width: 15%;
      background: #fafafa;
    }
    .meta-val {
      width: 35%;
    }
    .billed-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 18px;
      font-size: 11.5px;
    }
    .billed-table td {
      border: 1px solid #000;
      padding: 10px;
      vertical-align: top;
      width: 50%;
    }
    .billed-header {
      font-weight: bold;
      font-size: 12.5px;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .billed-name {
      font-weight: bold;
      font-size: 12.5px;
      margin-bottom: 4px;
      color: #000;
    }
    .billed-text {
      line-height: 1.45;
      color: #111;
    }
    .item-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 0px;
      font-size: 11.5px;
    }
    .item-table th {
      background-color: #000;
      color: #fff;
      padding: 8px 10px;
      font-weight: bold;
      text-align: left;
      border: 1px solid #000;
    }
    .item-table td {
      border: 1px solid #000;
      padding: 8px 10px;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .totals-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 18px;
      font-size: 11.5px;
    }
    .totals-table td {
      border: 1px solid #000;
      padding: 6px 10px;
    }
    .total-row-black td {
      background-color: #000;
      color: #fff;
      font-weight: bold;
      font-size: 12.5px;
    }
    .note-box {
      background-color: #f8f9fa;
      border: 1px solid #e2e8f0;
      padding: 9px 12px;
      font-size: 11px;
      font-style: italic;
      color: #444;
      margin-bottom: 22px;
      line-height: 1.4;
    }
    .footer-text {
      text-align: center;
      font-size: 10.5px;
      color: #555;
      line-height: 1.5;
    }
    .footer-thanks {
      font-weight: bold;
      margin-top: 4px;
      color: #222;
    }
  </style>
</head>
<body>
  <div class="watermark">Agnivridhi India</div>
  <div class="content">
    <div class="header-company">
      <div class="company-title">AGNIVRIDHI INDIA</div>
      <div class="company-subtitle">Business Consultancy & Advisory Services</div>
      <div class="company-details">
        A-116, Urbtech Trade Centre, Sector-132, Chhaprauli Bengar<br>
        Gautam Buddha Nagar, Dadri, Uttar Pradesh - 201304, India<br>
        Email: account@agnivridhiindia.com<br>
        GSTIN: 09ABCCA3869R1ZU | PAN: ABCCA3869R | CIN: U70200UP2025PTC218739
      </div>
    </div>

    <div class="doc-title">${docTitle}</div>

    <table class="meta-table">
      <tr>
        <td class="meta-label">Invoice No:</td>
        <td class="meta-val"><strong>${invoice.id}</strong></td>
        <td class="meta-label">Invoice Date:</td>
        <td class="meta-val">${formatDateDisplay(invoice.issueDate)}</td>
      </tr>
      <tr>
        <td class="meta-label">Page:</td>
        <td class="meta-val">1 of 1</td>
        <td class="meta-label">${invoice.dueDate ? "Due Date:" : ""}</td>
        <td class="meta-val">${invoice.dueDate ? formatDateDisplay(invoice.dueDate) : ""}</td>
      </tr>
    </table>

    <table class="billed-table">
      <tr>
        <td>
          <div class="billed-header">BILLED TO</div>
          <div class="billed-name">${invoice.clientName || "Client"}</div>
          <div class="billed-text">
            ${invoice.contactPerson ? `${invoice.contactPerson}<br>` : ""}
            ${invoice.address ? `${invoice.address}<br>` : ""}
            ${[invoice.city, invoice.state].filter(Boolean).join(", ")}${invoice.pincode ? ` - ${invoice.pincode}` : ""}<br>
            GSTIN: ${invoice.gstin || "None"}<br>
            Contact: ${invoice.mobile || "N/A"}
          </div>
        </td>
        <td>
          <div class="billed-header">BILLED FROM</div>
          <div class="billed-name">AGNIVRIDHI INDIA</div>
          <div class="billed-text">
            A-116, Urbtech Trade Centre, Sector-132<br>
            Chhaprauli Bengar, Gautam Buddha Nagar<br>
            Dadri, Uttar Pradesh - 201304, India<br>
            GSTIN: 09ABCCA3869R1ZU<br>
            Email: account@agnivridhiindia.com
          </div>
        </td>
      </tr>
    </table>

    <table class="item-table">
      <thead>
        <tr>
          <th style="width: 5%; text-align: center;">#</th>
          <th style="width: 45%;">Description</th>
          <th style="width: 15%; text-align: center;">HSN/SAC</th>
          <th style="width: 10%; text-align: center;">Qty</th>
          <th style="width: 12.5%; text-align: right;">Rate (Rs.)</th>
          <th style="width: 12.5%; text-align: right;">Amount (Rs.)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="text-center">1</td>
          <td>${invoice.description || "Service"}</td>
          <td class="text-center">${invoice.hsnSac || "998372"}</td>
          <td class="text-center">${quantity}</td>
          <td class="text-right">${rate.toFixed(2)}</td>
          <td class="text-right">${taxableAmount.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>

    <table class="totals-table">
      <tr>
        <td style="width: 65%; border: none;"></td>
        <td style="width: 20%; font-weight: bold;">Taxable Amount:</td>
        <td style="width: 15%; text-align: right;">Rs. ${taxableAmount.toFixed(2)}</td>
      </tr>
      ${isIgst ? `
      <tr>
        <td style="border: none;"></td>
        <td style="font-weight: bold;">IGST @ ${gstPercent}%:</td>
        <td style="text-align: right;">Rs. ${totalGst.toFixed(2)}</td>
      </tr>
      ` : `
      <tr>
        <td style="border: none;"></td>
        <td style="font-weight: bold;">CGST @ ${(gstPercent / 2).toFixed(1)}%:</td>
        <td style="text-align: right;">Rs. ${(totalGst / 2).toFixed(2)}</td>
      </tr>
      <tr>
        <td style="border: none;"></td>
        <td style="font-weight: bold;">SGST @ ${(gstPercent / 2).toFixed(1)}%:</td>
        <td style="text-align: right;">Rs. ${(totalGst / 2).toFixed(2)}</td>
      </tr>
      `}
      <tr class="total-row-black">
        <td style="border: none; background: transparent;"></td>
        <td style="font-weight: bold;">Total Amount:</td>
        <td style="text-align: right;">Rs. ${totalAmount.toFixed(2)}</td>
      </tr>
    </table>

    <div class="note-box">
      ${isProforma ?
        'Note: This is a Proforma Invoice issued for estimation and documentation purposes only. It is not a demand for payment and is subject to change at the time of final Tax Invoice.' :
        'Note: This is an official Tax Invoice issued by Agnivridhi India. Payment due within 15 days of issuance.'
      }
    </div>

    <div class="footer-text">
      This is an electronically generated document, no signature is required.<br>
      Terms & Conditions: Payment due within 15 days. All disputes subject to jurisdiction of courts in Noida. Agnivridhi India<br>
      <div class="footer-thanks">Thank you for your business!</div>
    </div>
  </div>
</body>
</html>`;
}

function CreateInvoiceModal({ clients, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    type: "Proforma Invoice",
    selectedClientId: "",
    clientName: "",
    contactPerson: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    gstin: "",
    mobile: "",
    issueDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    description: "",
    hsnSac: "998372",
    gstPercent: 18,
    quantity: 1,
    rate: 10000,
    placeOfSupply: "Uttar Pradesh",
    notes: "",
  });

  const [validationError, setValidationError] = useState("");

  const parseAddressDetails = (addrStr) => {
    if (!addrStr) return { city: "", state: "", pincode: "" };
    let city = "";
    let state = "";
    let pincode = "";

    const pinMatch = addrStr.match(/\b\d{6}\b/);
    if (pinMatch) {
      pincode = pinMatch[0];
    }

    const parts = addrStr.split(",").map((p) => p.trim());
    if (parts.length >= 2) {
      const lastPart = parts[parts.length - 1];
      const secondLast = parts[parts.length - 2];

      if (secondLast) {
        city = secondLast.replace(/\d+/g, "").trim();
      }
      if (lastPart) {
        state = lastPart.replace(/\d+/g, "").replace(/-/g, "").trim();
      }
    } else if (parts.length === 1) {
      city = parts[0];
    }

    return { city, state, pincode };
  };

  const handleClientSelect = (e) => {
    const clientId = e.target.value;
    const client = clients.find((c) => String(c.id) === String(clientId) || String(c.email) === String(clientId));

    if (client) {
      // Fetch any submitted onboarding document form data for this client
      let docData = client.documentData || {};
      const clientEmailKey = (client.email || "").trim().toLowerCase();
      try {
        const savedDoc =
          (clientEmailKey && localStorage.getItem(`agni_client_doc_data_${clientEmailKey}`)) ||
          localStorage.getItem("agni_client_doc_data_active");
        if (savedDoc) {
          const parsedDoc = JSON.parse(savedDoc);
          if (parsedDoc && typeof parsedDoc === "object") {
            docData = { ...docData, ...parsedDoc };
          }
        }
      } catch (err) {}

      const clientNameVal = docData.companyName || client.company || client.companyName || client.name || "";
      const contactPersonVal = docData.representativeName || client.contactPerson || client.representativeName || client.name || "";
      const fullAddr = docData.address || client.address || client.fullAddress || client.streetAddress || "";
      const parsedAddr = parseAddressDetails(fullAddr);

      const cityVal = client.city || parsedAddr.city || "";
      const stateVal = client.state || parsedAddr.state || "Uttar Pradesh";
      const pincodeVal = client.pincode || client.pin || client.zip || parsedAddr.pincode || "";

      const gstinVal = docData.gstNumber || client.gstNumber || client.gstin || client.gstNo || client.gst || "";
      const mobileVal = docData.contactNumber || client.phone || client.mobile || client.contactPhone || "";
      const descVal = docData.fundingPurpose || docData.companyDescription || client.scheme || client.serviceName || client.serviceType || "";

      // Use totalPayment (GST-inclusive consultancy fee shown in sales dashboard)
      // Base rate = totalPayment / 1.18 so that base + 18% GST = totalPayment exactly.
      // Fall back to pitchedMoney, pitchedAmount, amount if totalPayment not set.
      const rawTotal =
        parseFloat(client.totalPayment) ||
        parseFloat(client.pitchedMoney) ||
        parseFloat(client.pitchedAmount) ||
        parseFloat(client.amount) ||
        0;
      // Derive base rate by stripping GST from the total
      const baseRate = rawTotal > 0 ? Math.round(rawTotal / 1.18) : 10000;

      setFormData((prev) => ({
        ...prev,
        selectedClientId: clientId,
        clientName: clientNameVal,
        contactPerson: contactPersonVal,
        address: fullAddr,
        city: cityVal,
        state: stateVal,
        pincode: pincodeVal,
        gstin: gstinVal,
        mobile: mobileVal,
        rate: baseRate,
        gstPercent: 18,
        placeOfSupply: stateVal || prev.placeOfSupply || "Uttar Pradesh",
        description: descVal || prev.description || "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        selectedClientId: "",
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const quantity = Number(formData.quantity) || 1;
  const rate = Number(formData.rate) || Number(formData.pitchedAmount) || Number(formData.amount) || 0;
  const taxableAmount = quantity * rate;
  const gstPercent = Number(formData.gstPercent) !== undefined ? Number(formData.gstPercent) : 18;
  const totalGst = taxableAmount * (gstPercent / 100);
  const totalAmount = taxableAmount + totalGst;
  const isIgst = (formData.placeOfSupply || "").trim().toLowerCase() !== "uttar pradesh";

  const handleSubmit = (e) => {
    e?.preventDefault();
    setValidationError("");

    if (formData.type === "Tax Invoice" && !formData.selectedClientId && !formData.clientName) {
      setValidationError("Target Client selection or Client Name is required for Tax Invoice.");
      return;
    }

    if (!formData.description.trim()) {
      setValidationError("Service/Product Description is required.");
      return;
    }

    if (!formData.issueDate) {
      setValidationError("Issue Date is required.");
      return;
    }

    const isProforma = (formData.type || "").toLowerCase().includes("proforma") || (formData.type || "").toLowerCase().includes("performa");
    const initialStatus = !isProforma ? "Paid" : (formData.status || "Pending");

    const newInv = {
      ...formData,
      quantity: Number(formData.quantity) || 1,
      rate: Number(formData.rate) || 0,
      gstPercent: Number(formData.gstPercent) || 0,
      taxableAmount,
      totalGst,
      totalAmount,
      status: initialStatus,
      createdAt: new Date().toISOString(),
    };

    onSubmit(newInv);
  };

  return (
    <Modal onClose={onClose} closeLabel="Close">
      <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 780 }}>
        {/* Header Bar */}
        <div
          style={{
            background: "linear-gradient(135deg, #1877f2 0%, #0056b3 100%)",
            color: "#fff",
            padding: "14px 20px",
            margin: "-24px -24px 16px -24px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 16,
            fontWeight: 700,
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
            boxShadow: "0 4px 12px rgba(24, 119, 242, 0.2)",
          }}
        >
          <span style={{ fontSize: 20 }}>📄</span>
          <span>Invoice Details</span>
        </div>

        {validationError && (
          <div style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5", padding: "10px 14px", borderRadius: 8, fontSize: 13 }}>
            ⚠️ {validationError}
          </div>
        )}

        {/* Row 1: Type & Select Client */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
              Type <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 6, border: "1px solid #d0d5dd", font: "inherit", fontSize: 13.5 }}
            >
              <option value="Proforma Invoice">Proforma Invoice</option>
              <option value="Tax Invoice">Tax Invoice</option>
            </select>
            <small style={{ display: "block", color: "#667085", fontSize: 11.5, marginTop: 4, lineHeight: 1.3 }}>
              Proforma: enter full client details if not selecting existing client. Tax: existing client required.
            </small>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
              Select Client
            </label>
            <select
              name="selectedClientId"
              value={formData.selectedClientId}
              onChange={handleClientSelect}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 6, border: "1px solid #d0d5dd", font: "inherit", fontSize: 13.5 }}
            >
              <option value="">---------</option>
              {clients.map((c) => {
                const cName = c.company || c.companyName || c.name || "Client";
                const cContact = c.contactPerson || c.representativeName || "";
                const cScheme = c.scheme || c.schemeName || c.serviceType || c.serviceName || "";
                return (
                  <option key={c.id || c.email} value={c.id || c.email}>
                    {cName}
                    {cContact ? ` (${cContact})` : ""}
                    {cScheme ? ` — ${cScheme}` : ""}
                    {c.phone ? ` — ${c.phone}` : ""}
                  </option>
                );
              })}
            </select>
            <small style={{ display: "block", color: "#667085", fontSize: 11.5, marginTop: 4 }}>
              Required for Tax Invoice
            </small>
          </div>
        </div>

        {/* Row 2: Client Name & Contact Person */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
              Client Name
            </label>
            <input
              type="text"
              name="clientName"
              value={formData.clientName}
              onChange={handleChange}
              placeholder="Enter client/company name (for Proforma)"
              style={{ width: "100%", padding: "9px 12px", borderRadius: 6, border: "1px solid #d0d5dd", font: "inherit", fontSize: 13.5 }}
            />
            <small style={{ display: "block", color: "#667085", fontSize: 11.5, marginTop: 4 }}>
              Manual entry for Proforma
            </small>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
              Contact Person
            </label>
            <input
              type="text"
              name="contactPerson"
              value={formData.contactPerson}
              onChange={handleChange}
              placeholder="Contact person name"
              style={{ width: "100%", padding: "9px 12px", borderRadius: 6, border: "1px solid #d0d5dd", font: "inherit", fontSize: 13.5 }}
            />
          </div>
        </div>

        {/* Row 3: Address */}
        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
            Address
          </label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Full address"
            rows={2}
            style={{ width: "100%", padding: "9px 12px", borderRadius: 6, border: "1px solid #d0d5dd", font: "inherit", fontSize: 13.5, resize: "vertical" }}
          />
        </div>

        {/* Row 4: City, State, Pincode */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>City</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="City"
              style={{ width: "100%", padding: "9px 12px", borderRadius: 6, border: "1px solid #d0d5dd", font: "inherit", fontSize: 13.5 }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>State</label>
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
              placeholder="State"
              style={{ width: "100%", padding: "9px 12px", borderRadius: 6, border: "1px solid #d0d5dd", font: "inherit", fontSize: 13.5 }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Pincode</label>
            <input
              type="text"
              name="pincode"
              value={formData.pincode}
              onChange={handleChange}
              placeholder="Pincode"
              style={{ width: "100%", padding: "9px 12px", borderRadius: 6, border: "1px solid #d0d5dd", font: "inherit", fontSize: 13.5 }}
            />
          </div>
        </div>

        {/* Row 5: GSTIN & Mobile */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>GSTIN</label>
            <input
              type="text"
              name="gstin"
              value={formData.gstin}
              onChange={handleChange}
              placeholder="GSTIN (optional)"
              style={{ width: "100%", padding: "9px 12px", borderRadius: 6, border: "1px solid #d0d5dd", font: "inherit", fontSize: 13.5 }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Mobile</label>
            <input
              type="text"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              placeholder="Mobile/Phone"
              style={{ width: "100%", padding: "9px 12px", borderRadius: 6, border: "1px solid #d0d5dd", font: "inherit", fontSize: 13.5 }}
            />
          </div>
        </div>

        {/* Row 6: Dates */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
              Issue Date <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              type="date"
              name="issueDate"
              value={formData.issueDate}
              onChange={handleChange}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 6, border: "1px solid #d0d5dd", font: "inherit", fontSize: 13.5 }}
              required
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
              Due Date
            </label>
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 6, border: "1px solid #d0d5dd", font: "inherit", fontSize: 13.5 }}
            />
          </div>
        </div>

        {/* Section Divider: Item & Pricing */}
        <div style={{ margin: "10px 0 4px 0", borderTop: "1px solid #eaecf0", paddingTop: 16, display: "flex", alignItems: "center", gap: 8, fontSize: 15, fontWeight: 700, color: "#1d2939" }}>
          <span>📦</span>
          <span>Item & Pricing</span>
        </div>

        {/* Item Row 1: Description, HSN/SAC, GST% */}
        <div style={{ display: "grid", gridTemplateColumns: "2.5fr 1fr 1fr", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
              Description <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter detailed description of services/products..."
              rows={2}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 6, border: "1px solid #d0d5dd", font: "inherit", fontSize: 13.5, resize: "vertical" }}
              required
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
              HSN/SAC
            </label>
            <input
              type="text"
              name="hsnSac"
              value={formData.hsnSac}
              onChange={handleChange}
              placeholder="998372"
              style={{ width: "100%", padding: "9px 12px", borderRadius: 6, border: "1px solid #d0d5dd", font: "inherit", fontSize: 13.5 }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
              GST % <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              type="number"
              name="gstPercent"
              value={formData.gstPercent}
              onChange={handleChange}
              placeholder="18"
              style={{ width: "100%", padding: "9px 12px", borderRadius: 6, border: "1px solid #d0d5dd", font: "inherit", fontSize: 13.5 }}
              required
            />
          </div>
        </div>

        {/* Item Row 2: Quantity, Rate, Place of Supply */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
              Quantity <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              min="1"
              style={{ width: "100%", padding: "9px 12px", borderRadius: 6, border: "1px solid #d0d5dd", font: "inherit", fontSize: 13.5 }}
              required
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
              Rate (₹) <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              type="number"
              name="rate"
              value={formData.rate}
              onChange={handleChange}
              placeholder="10000"
              style={{ width: "100%", padding: "9px 12px", borderRadius: 6, border: "1px solid #d0d5dd", font: "inherit", fontSize: 13.5 }}
              required
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
              Place of Supply <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              type="text"
              name="placeOfSupply"
              value={formData.placeOfSupply}
              onChange={handleChange}
              placeholder="Uttar Pradesh"
              style={{ width: "100%", padding: "9px 12px", borderRadius: 6, border: "1px solid #d0d5dd", font: "inherit", fontSize: 13.5 }}
              required
            />
            <small style={{ display: "block", color: "#667085", fontSize: 11.5, marginTop: 4 }}>
              Uttar Pradesh for intra-state (CGST+SGST), other for IGST
            </small>
          </div>
        </div>

        {/* Row: Notes */}
        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
            Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Payment terms..."
            rows={2}
            style={{ width: "100%", padding: "9px 12px", borderRadius: 6, border: "1px solid #d0d5dd", font: "inherit", fontSize: 13.5, resize: "vertical" }}
          />
        </div>

        {/* Live Calculation Preview Card */}
        <div style={{
          background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
          border: "1px solid #e2e8f0",
          borderRadius: 8,
          padding: "12px 16px",
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          marginTop: 4
        }}>
          <div>
            <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: 2 }}>
              Taxable Amount
            </span>
            <strong style={{ fontSize: 15, color: "#0f172a" }}>₹{taxableAmount.toLocaleString("en-IN")}</strong>
          </div>

          <div>
            <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: 2 }}>
              {isIgst ? `IGST (${gstPercent}%)` : `CGST + SGST (${gstPercent}%)`}
            </span>
            <strong style={{ fontSize: 15, color: "#2563eb" }}>₹{totalGst.toLocaleString("en-IN")}</strong>
          </div>

          <div>
            <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: 2 }}>
              Total Payable
            </span>
            <strong style={{ fontSize: 16, color: "#16a34a", fontWeight: 800 }}>₹{totalAmount.toLocaleString("en-IN")}</strong>
          </div>
        </div>

        {/* Form Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 8, paddingTop: 12, borderTop: "1px solid #eaecf0" }}>
          <button
            type="button"
            className="sales-btn-secondary"
            onClick={onClose}
            style={{ padding: "8px 18px", fontSize: 13 }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="sales-add-btn"
            onClick={handleSubmit}
            style={{ padding: "9px 22px", fontSize: 13.5, background: "#1877f2" }}
          >
            <span>+ Create Invoice</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}

function InvoiceDetailsModal({ invoice, onClose, onDownload }) {
  if (!invoice) return null;
  const quantity = Number(invoice.quantity) || 1;
  const rate = Number(invoice.rate) || 0;
  const taxableAmount = quantity * rate;
  const gstPercent = Number(invoice.gstPercent) || 0;
  const totalGst = taxableAmount * (gstPercent / 100);
  const totalAmount = taxableAmount + totalGst;
  const isIgst = (invoice.placeOfSupply || "Uttar Pradesh").trim().toLowerCase() !== "uttar pradesh";
  const isProforma = (invoice.type || "").toLowerCase().includes("proforma");

  return (
    <Modal onClose={onClose} closeLabel="Close">
      <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 680 }}>
        {/* Banner */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 12,
            padding: 16,
            borderRadius: 14,
            background: "linear-gradient(135deg, rgba(24, 119, 242, 0.08) 0%, rgba(0, 86, 179, 0.03) 100%)",
            border: "1px solid rgba(24, 119, 242, 0.16)",
          }}
        >
          <div>
            <span style={{ fontSize: 11.5, color: "#7a748e", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600, display: "block" }}>
              Invoice No
            </span>
            <strong style={{ fontSize: 15, marginTop: 2, display: "block", color: "#1877f2" }}>{invoice.id}</strong>
          </div>
          <div>
            <span style={{ fontSize: 11.5, color: "#7a748e", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600, display: "block" }}>
              Billed To
            </span>
            <strong style={{ fontSize: 14, marginTop: 2, display: "block" }}>{invoice.clientName || "Client"}</strong>
          </div>
          <div>
            <span style={{ fontSize: 11.5, color: "#7a748e", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600, display: "block" }}>
              Type
            </span>
            <strong style={{ fontSize: 14, marginTop: 2, display: "block", color: isProforma ? "#0066cc" : "#16a34a" }}>
              {isProforma ? "Proforma Invoice" : "Tax Invoice"}
            </strong>
          </div>
        </div>

        {/* Breakdown */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
          <div style={{ padding: "12px 14px", borderRadius: 12, border: "1px solid #e2e8f0", background: "#fafafa" }}>
            <span style={{ fontSize: 11.5, color: "#64748b", fontWeight: 600, display: "block" }}>Issue Date</span>
            <strong style={{ fontSize: 13.5, marginTop: 3, display: "block" }}>{formatDateDisplay(invoice.issueDate)}</strong>
          </div>
          <div style={{ padding: "12px 14px", borderRadius: 12, border: "1px solid #e2e8f0", background: "#fafafa" }}>
            <span style={{ fontSize: 11.5, color: "#64748b", fontWeight: 600, display: "block" }}>Taxable Amount</span>
            <strong style={{ fontSize: 13.5, marginTop: 3, display: "block" }}>{formatCurrency(taxableAmount)}</strong>
          </div>
          <div style={{ padding: "12px 14px", borderRadius: 12, border: "1px solid #bbf7d0", background: "#f0fdf4" }}>
            <span style={{ fontSize: 11.5, color: "#16a34a", fontWeight: 600, display: "block" }}>Total Amount</span>
            <strong style={{ fontSize: 16, color: "#16a34a", marginTop: 2, display: "block", fontWeight: 700 }}>
              {formatCurrency(totalAmount)}
            </strong>
          </div>
        </div>

        {/* Description */}
        <div style={{ padding: "14px 16px", borderRadius: 12, border: "1px solid #e2e8f0", background: "#fafafa" }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#1877f2", display: "block", marginBottom: 4 }}>
            Description
          </span>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: "#1e293b" }}>
            {invoice.description}
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 6 }}>
          <button className="sales-add-btn" type="button" onClick={() => onDownload(invoice)} style={{ padding: "9px 20px", background: "#1877f2" }}>
            <span>📄 Print / Download Official PDF</span>
          </button>
          <button className="sales-btn-secondary" type="button" onClick={onClose} style={{ padding: "9px 18px" }}>
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function SalesInvoices({ clients: propClients, salesPersonName, userEmail }) {
  const [activeTab, setActiveTab] = useState("All Invoices");

  const currentSalesName = salesPersonName || localStorage.getItem("agni_user_name") || "";
  const currentUserEmail = userEmail || localStorage.getItem("agni_user_email") || "";
  const userRole = localStorage.getItem("agni_user_role") || "";

  // Active clients created by / assigned to current salesperson ONLY
  const { clients: apiClients } = useApiClients();
  const salesClientsList = useMemo(() => {
    const list = [];
    const addedKeys = new Set();

    const addSalesClient = (c) => {
      if (!c) return;
      if (userRole !== "Admin" && userRole !== "Owner" && userRole !== "Branch Manager" && userRole !== "Manager") {
        if (!isClientCreatedByUser(c, currentSalesName, currentUserEmail)) return;
      }
      const key = String((c.company || c.name || c.email || c.id) + "_" + (c.scheme || "")).trim().toLowerCase();
      if (key && !addedKeys.has(key)) {
        addedKeys.add(key);
        list.push(c);
      }
    };

    if (Array.isArray(propClients)) propClients.forEach(addSalesClient);
    if (Array.isArray(mockClients)) mockClients.forEach(addSalesClient);
    if (Array.isArray(apiClients)) apiClients.forEach(addSalesClient);

    return list;
  }, [propClients, apiClients, currentSalesName, currentUserEmail, userRole]);

  const { invoices: apiInvoices, refreshInvoices } = useApiInvoices();
  const invoices = useMemo(() => {
    return apiInvoices.map((inv) => {
      const isProforma = (inv.type || "").toLowerCase().includes("proforma") || (inv.type || "").toLowerCase().includes("performa");
      if (!isProforma && inv.status !== "Paid") {
        return { ...inv, status: "Paid" };
      }
      return inv;
    });
  }, [apiInvoices]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [notification, setNotification] = useState("");

  const filteredInvoices = useMemo(() => {
    const userInvoices = invoices.filter((i) => {
      if (userRole === "Admin" || userRole === "Owner" || userRole === "Branch Manager" || userRole === "Manager") {
        return true;
      }

      const invSalesEmail = (i.salesPersonEmail || i.creatorEmail || i.salespersonEmail || "").toLowerCase().trim();
      const invSalesName = (i.salesPerson || i.creatorName || i.salesperson || "").toLowerCase().trim();
      const cleanEmail = currentUserEmail.toLowerCase().trim();
      const cleanName = currentSalesName.toLowerCase().trim();

      // 1. Direct match on invoice creator email
      if (cleanEmail && invSalesEmail && (invSalesEmail === cleanEmail || invSalesEmail.includes(cleanEmail) || cleanEmail.includes(invSalesEmail))) {
        return true;
      }

      // 2. Direct match on invoice creator name (full or first name)
      if (cleanName && invSalesName) {
        if (invSalesName.includes(cleanName) || cleanName.includes(invSalesName)) {
          return true;
        }
        const cleanFirstName = cleanName.split(" ")[0];
        const invFirstName = invSalesName.split(" ")[0];
        if (cleanFirstName && invFirstName && cleanFirstName === invFirstName) {
          return true;
        }
      }

      // 3. Match against current salesperson's assigned clients ONLY
      const invClientEmail = (i.clientEmail || i.email || "").toLowerCase().trim();
      const invClientName = (i.clientName || i.company || i.name || "").toLowerCase().trim();

      if (Array.isArray(salesClientsList) && salesClientsList.length > 0) {
        const matchesSalesClient = salesClientsList.some((c) => {
          const cEmail = (c.email || "").toLowerCase().trim();
          const cName = (c.name || c.company || "").toLowerCase().trim();
          return (cEmail && invClientEmail && cEmail === invClientEmail) || (cName && invClientName && cName === invClientName);
        });
        if (matchesSalesClient) return true;
      }

      return false;
    });

    if (activeTab === "Proforma Invoices") return userInvoices.filter((i) => (i.type || "").toLowerCase().includes("proforma"));
    if (activeTab === "Tax Invoices") return userInvoices.filter((i) => (i.type || "").toLowerCase().includes("tax"));
    return userInvoices;
  }, [invoices, activeTab, currentUserEmail, currentSalesName, userRole, salesClientsList]);

  const addInvoice = async (newInvoiceData) => {
    // We create the invoice via the API if the user hits the actual submit, but right now this addInvoice might just be generating a document, let's keep it optimistic if needed or call API.
    // For now, since they might generate Proforma or Tax invoices directly, we simulate the add for now, or call the API.
    // Ideally call API:
    try {
      const matchedClient = salesClientsList.find(
        (c) =>
          String(c.id) === String(newInvoiceData.selectedClientId) ||
          String(c.email) === String(newInvoiceData.selectedClientId)
      );

      const clientId = matchedClient?.id || newInvoiceData.selectedClientId;

      const res = await apiFetch("/invoices", {
        method: "POST",
        body: JSON.stringify({
          clientId: clientId,
          issueDate: new Date().toISOString(),
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          paymentMode: "ONLINE", // Example
          rawAmount: newInvoiceData.amount || 0,
          gstRate: newInvoiceData.gstPercent || 18,
          gstAmount: (newInvoiceData.amount || 0) * ((newInvoiceData.gstPercent || 18) / 100),
          rawTotal: newInvoiceData.totalAmount || 0,
          gstNo: newInvoiceData.gstNumber,
        })
      });
      if (res.ok) {
        refreshInvoices();
        setNotification(`Invoice created successfully.`);
        setTimeout(() => setNotification(""), 4200);
        setShowCreateModal(false);
      } else {
        const err = await res.json();
        setNotification(`Error: ${err.message}`);
        setTimeout(() => setNotification(""), 4200);
      }
    } catch(err) {
      console.error(err);
      setNotification(`Failed to create invoice.`);
      setTimeout(() => setNotification(""), 4200);
    }
  };

  const downloadInvoice = (invoice) => {
    const htmlContent = generateInvoiceHTML(invoice);

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 400);
    }

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${invoice.id}_Agnivridhi_${(invoice.type || "Invoice").replace(/\s+/g, "_")}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setNotification(`Invoice ${invoice.id} document ready for print/download.`);
    setTimeout(() => setNotification(""), 4200);
  };

  return (
    <section className="sales-page-view">
      <div className="sales-header-banner">
        <div className="sales-header-info">
          <p className="sales-header-eyebrow">
            Billing & Invoicing
          </p>
          <h1 className="sales-header-title">
            My Invoices
          </h1>
          <p className="sales-header-subtitle">
            Generate and track B2B Tax Invoices & Proforma Invoices for client accounts.
          </p>
        </div>

        <button
          type="button"
          className="sales-add-btn"
          onClick={() => setShowCreateModal(true)}
          style={{ background: "#1877f2" }}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
          <span>Create Invoice</span>
        </button>
      </div>

      {/* Tabs Switcher */}
      <div className="sales-tabs-switcher" style={{ marginBottom: 18 }}>
        {INVOICE_TABS.map((tab) => {
          const isActive = activeTab === tab;
          const count =
            tab === "All Invoices"
              ? invoices.length
              : tab === "Proforma Invoices"
              ? invoices.filter((i) => (i.type || "").toLowerCase().includes("proforma")).length
              : invoices.filter((i) => (i.type || "").toLowerCase().includes("tax")).length;

          return (
            <button
              key={tab}
              type="button"
              className={`sales-tab-btn ${isActive ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              <span>{tab}</span>
              <span className="sales-tab-count">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {notification ? (
        <div className="sales-notification-banner">
          <span>{notification}</span>
          <button
            type="button"
            onClick={() => setNotification("")}
          >
            ✕
          </button>
        </div>
      ) : null}

      <div className="analytics-card sales-table-card">
        <div className="sales-table-scroll">
          <table className="sales-clients-table">
            <thead>
              <tr>
                <th>Invoice ID</th>
                <th>Client Name</th>
                <th>Type</th>
                <th>Issue Date</th>
                <th>Total Amount</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice) => {
                const rate = Number(invoice.rate || invoice.pitchedAmount || invoice.amount || 0);
                const gst = Number(invoice.gstPercent) !== undefined ? Number(invoice.gstPercent) : 18;
                const total = invoice.totalAmount ? Number(invoice.totalAmount) : (rate * (1 + gst / 100));
                return (
                  <tr key={invoice.id}>
                    <td><strong>{invoice.id}</strong></td>
                    <td>{invoice.clientName || "Client"}</td>
                    <td>
                      <span style={{
                        padding: "3px 8px",
                        borderRadius: 4,
                        fontSize: 11.5,
                        fontWeight: 600,
                        background: (invoice.type || "").toLowerCase().includes("proforma") ? "#e0f2fe" : "#dcfce7",
                        color: (invoice.type || "").toLowerCase().includes("proforma") ? "#0369a1" : "#15803d"
                      }}>
                        {invoice.type}
                      </span>
                    </td>
                    <td>{formatDateDisplay(invoice.issueDate)}</td>
                    <td><strong>{formatCurrency(total)}</strong></td>
                    <td>
                      {(() => {
                        const isProforma = (invoice.type || "").toLowerCase().includes("proforma") || (invoice.type || "").toLowerCase().includes("performa");
                        const isPaid = !isProforma || (invoice.status || "").toLowerCase() === "paid";
                        return (
                          <span
                            className="stage-tag active"
                            style={{
                              background: isPaid ? "#dcfce7" : "#fef3c7",
                              color: isPaid ? "#15803d" : "#b45309",
                              borderColor: isPaid ? "rgba(21, 128, 61, 0.2)" : "rgba(180, 83, 9, 0.2)"
                            }}
                          >
                            <span style={{ width: 6, height: 6, borderRadius: 999, background: "currentColor" }} />
                            {isPaid ? "Paid" : "Not Paid"}
                          </span>
                        );
                      })()}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: 8 }}>
                        <button className="sales-view-btn" type="button" onClick={() => setSelectedInvoice(invoice)}>
                          <Icon name="eye" size={13} />
                          <span>View</span>
                        </button>
                        <button
                          className="sales-add-btn"
                          style={{ padding: "5px 12px", fontSize: 12, background: "#1877f2" }}
                          type="button"
                          onClick={() => downloadInvoice(invoice)}
                        >
                          <span>PDF / Print</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="sales-empty-cell" style={{ textAlign: "center", padding: "36px 20px", color: "#64748b" }}>
                    No invoices created under {activeTab}. Click "+ Create Invoice" to add a new Proforma or Tax invoice.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateModal && (
        <CreateInvoiceModal
          clients={salesClientsList}
          onClose={() => setShowCreateModal(false)}
          onSubmit={addInvoice}
        />
      )}

      {selectedInvoice && (
        <InvoiceDetailsModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onDownload={downloadInvoice}
        />
      )}
    </section>
  );
}
