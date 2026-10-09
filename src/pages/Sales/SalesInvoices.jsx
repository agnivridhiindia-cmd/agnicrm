import React, { useState, useMemo, useEffect } from "react";
import { apiFetch } from "../../services/apiClient";
import { useAuth } from "../../context/AuthContext";
import Modal from "../../components/Modal";
import Icon from "../../components/Icon";
import { mockClients } from "./mockClients";
import { isClientCreatedByUser } from "./hooks/useSalesClients";
import { useApiInvoices } from "../../hooks/useApiInvoices";
import { useApiClients } from "../../hooks/useApiClients";
import { generateInvoiceHTML, getPlaceOfSupplyWithCode } from "../../utils/invoiceGenerator";
import { printHtmlContent } from "../../utils/exportHelpers";

export { generateInvoiceHTML, getPlaceOfSupplyWithCode };

const INVOICE_TABS = ["All Invoices", "Proforma Invoices", "Tax Invoices", "GST Invoices"];

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
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const datePrefix = `INV-${yyyy}${mm}${dd}-`;
  const todayInvoices = (existingInvoices || []).filter((inv) => {
    const invId = inv.invoiceNo || inv.id || "";
    return invId.startsWith(datePrefix);
  });
  const count = todayInvoices.length + 1;
  return `${datePrefix}${String(count).padStart(3, "0")}`;
};

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
    pan: "",
    email: "",
    mobile: "",
    phone: "",
    issueDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    description: "",
    hsnSac: "998311",
    gstPercent: 18,
    quantity: 1,
    rate: 10000,
    placeOfSupply: "Telangana (36)",
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
      // Authoritative client onboarding details directly from PostgreSQL client object
      const docData = client.documentData || {};

      const clientNameVal = docData.companyName || client.company || client.companyName || client.name || "";
      const contactPersonVal = docData.representativeName || client.contactPerson || client.representativeName || client.name || "";
      const fullAddr = docData.address || client.address || client.fullAddress || client.streetAddress || "";
      const parsedAddr = parseAddressDetails(fullAddr);

      const cityVal = client.city || parsedAddr.city || "";
      const stateVal = client.state || parsedAddr.state || "Uttar Pradesh";
      const pincodeVal = client.pincode || client.pin || client.zip || parsedAddr.pincode || "";

      const gstinVal = docData.gstNumber || client.gstNumber || client.gstin || client.gstNo || client.gst || "";
      let panVal = docData.companyPan || docData.panNumber || client.companyPan || client.panNumber || "";
      if (!panVal && gstinVal && gstinVal.length >= 12) {
        panVal = gstinVal.substring(2, 12).toUpperCase();
      }
      const emailVal = client.email || docData.email || "";
      const mobileVal = docData.contactNumber || client.phone || client.mobile || client.contactPhone || "";
      const descVal = docData.fundingPurpose || docData.companyDescription || client.scheme || client.serviceName || client.serviceType || "";

      // Determine Place of Supply with area/state code (like Telangana (36))
      const placeOfSupplyVal = getPlaceOfSupplyWithCode(stateVal || fullAddr, fullAddr, gstinVal);

      // For GST Invoice (cash payment), rate is the full raw total without dividing by 1.18.
      // For Tax invoice, base rate is stripped of 18% GST (rawTotal / 1.18) so that base + 18% GST = totalPayment.
      const rawTotal =
        parseFloat(client.totalPayment) ||
        parseFloat(client.pitchedMoney) ||
        parseFloat(client.pitchedAmount) ||
        parseFloat(client.amount) ||
        0;
      const isCurrentGstInvoice = formData.type === "GST Invoice";
      const baseRate = rawTotal > 0
        ? (isCurrentGstInvoice ? rawTotal : Math.round(rawTotal / 1.18))
        : 10000;

      setFormData((prev) => ({
        ...prev,
        rawClientTotal: rawTotal,
        selectedClientId: clientId,
        clientName: clientNameVal,
        contactPerson: contactPersonVal,
        address: fullAddr,
        city: cityVal,
        state: stateVal,
        pincode: pincodeVal,
        gstin: gstinVal,
        pan: panVal,
        email: emailVal,
        mobile: mobileVal,
        phone: mobileVal,
        rate: baseRate,
        gstPercent: isCurrentGstInvoice ? 0 : 18,
        placeOfSupply: placeOfSupplyVal,
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
    if (name === "type") {
      const isGstInv = value === "GST Invoice";
      setFormData((prev) => {
        const newGstPercent = isGstInv ? 0 : 18;
        let newRate = prev.rate;
        if (prev.rawClientTotal) {
          newRate = isGstInv ? prev.rawClientTotal : Math.round(prev.rawClientTotal / 1.18);
        }
        return {
          ...prev,
          type: value,
          gstPercent: newGstPercent,
          rate: newRate,
        };
      });
      return;
    }
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

    if ((formData.type === "Tax Invoice" || formData.type === "GST Invoice") && !formData.selectedClientId && !formData.clientName) {
      setValidationError("Target Client selection or Client Name is required for Tax / GST Invoice.");
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

    // Business rule: Proforma = pending/partial payment; Tax Invoice = fully paid
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
              <option value="GST Invoice">GST Invoice (Cash Payment - No GST)</option>
            </select>
            <small style={{ display: "block", color: "#667085", fontSize: 11.5, marginTop: 4, lineHeight: 1.3 }}>
              📋 <strong>Proforma</strong>: Estimate (no paid stamp). <strong>Tax Invoice</strong>: Online with 18% GST. <strong>GST Invoice</strong>: Cash payment without GST.
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
  const isProforma = (invoice.type || "").toLowerCase().includes("proforma");
  const isGstInvoice = (invoice.type || "").toLowerCase().includes("gst") && !(invoice.type || "").toLowerCase().includes("tax");
  const quantity = Number(invoice.quantity) || 1;
  const rate = Number(invoice.rate) || 0;
  const taxableAmount = quantity * rate;
  const gstPercent = isGstInvoice ? 0 : (Number(invoice.gstPercent) || 0);
  const totalGst = isGstInvoice ? 0 : (taxableAmount * (gstPercent / 100));
  const totalAmount = isGstInvoice ? taxableAmount : (taxableAmount + totalGst);
  const isIgst = (invoice.placeOfSupply || "Uttar Pradesh").trim().toLowerCase() !== "uttar pradesh";

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
            <strong style={{
              fontSize: 14,
              marginTop: 2,
              display: "block",
              color: isProforma ? "#0066cc" : isGstInvoice ? "#b45309" : "#16a34a"
            }}>
              {invoice.type || (isProforma ? "Proforma Invoice" : "Tax Invoice")}
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
  const { user, userRole: authRole, userEmail: authEmail } = useAuth();

  const currentSalesName = salesPersonName || user?.fullName || user?.name || "";
  const currentUserEmail = userEmail || authEmail || "";
  const userRole = authRole || "";

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
    if (activeTab === "GST Invoices") return userInvoices.filter((i) => (i.type || "").toLowerCase().includes("gst") && !(i.type || "").toLowerCase().includes("tax"));
    return userInvoices;
  }, [invoices, activeTab, currentUserEmail, currentSalesName, userRole, salesClientsList]);

  const downloadInvoice = (invoice) => {
    const htmlContent = generateInvoiceHTML(invoice);

    // Safely trigger print without popup blockers or race conditions
    printHtmlContent(htmlContent);

    // Also download HTML file
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const cleanId = (invoice.id || "Invoice").replace(/\//g, "-");
    link.href = url;
    link.download = `${cleanId}_Agnivridhi_${(invoice.type || "Invoice").replace(/\s+/g, "_")}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setNotification(`Invoice ${invoice.id} document ready for print/download.`);
    setTimeout(() => setNotification(""), 4200);
  };

  const addInvoice = async (newInvoiceData) => {
    const isProformaType = (newInvoiceData.type || "").toLowerCase().includes("proforma") ||
      (newInvoiceData.type || "").toLowerCase().includes("performa");
    const isGstInvoiceType = (newInvoiceData.type || "").toLowerCase().includes("gst") &&
      !(newInvoiceData.type || "").toLowerCase().includes("tax");
    const invoiceType = isProformaType ? "PROFORMA" : "TAX";

    // Resolve actual DB client by UUID or email
    const matchedClient = salesClientsList.find(
      (c) =>
        String(c.id) === String(newInvoiceData.selectedClientId) ||
        String(c.email) === String(newInvoiceData.selectedClientId)
    );
    const clientId = matchedClient?.id || newInvoiceData.selectedClientId || "";

    // ── PROFORMA without a DB client selected ──────────────────────────────
    // User typed client details manually → generate PDF locally, no API needed.
    // This is valid for Proforma (estimate) invoices.
    if (isProformaType && !clientId) {
      const localId = generateInvoiceId("Proforma Invoice", invoices);
      const localInvoice = { ...newInvoiceData, id: localId, type: "Proforma Invoice" };
      downloadInvoice(localInvoice);
      setNotification(`Proforma Invoice ${localId} generated. Select a client to also save it to the database.`);
      setTimeout(() => setNotification(""), 5000);
      setShowCreateModal(false);
      return;
    }

    // ── TAX Invoice or GST Invoice without DB client ──────────────────────
    if (!clientId) {
      setNotification(`Please select a client from the dropdown to create a ${isGstInvoiceType ? "GST Invoice" : "Tax Invoice"}.`);
      setTimeout(() => setNotification(""), 5000);
      return;
    }

    try {
      const isCashPayment = isGstInvoiceType;
      const rawAmount = Number(newInvoiceData.taxableAmount) || 0;
      const gstAmount = isCashPayment ? 0 : (Number(newInvoiceData.totalGst) || 0);
      const rawTotal = isCashPayment ? rawAmount : (Number(newInvoiceData.totalAmount) || (rawAmount + gstAmount));
      const gstRate = isCashPayment ? 0 : (Number(newInvoiceData.gstPercent || 18) / 100);

      const payload = {
        clientId,
        invoiceType,
        issueDate: newInvoiceData.issueDate
          ? new Date(newInvoiceData.issueDate).toISOString()
          : new Date().toISOString(),
        ...(newInvoiceData.dueDate
          ? { dueDate: new Date(newInvoiceData.dueDate).toISOString() }
          : {}),
        paymentMode: isCashPayment ? "OFFLINE" : "ONLINE",
        rawAmount,
        gstRate,
        gstAmount,
        rawTotal,
        gstNo: newInvoiceData.gstin || undefined,
        description: newInvoiceData.description || undefined,
        hsnSac: newInvoiceData.hsnSac || undefined,
        placeOfSupply: newInvoiceData.placeOfSupply || undefined,
        quantity: Number(newInvoiceData.quantity) || 1,
      };

      console.log("📄 Invoice payload:", payload);

      const res = await apiFetch("/invoices", {
        method: "POST",
        body: payload, // Pass as object — apiFetch will JSON.stringify + set Content-Type: application/json
      });

      if (res.ok) {
        const savedInvoice = await res.json();
        // Auto-download PDF after saving
        const displayType = isProformaType
          ? "Proforma Invoice"
          : isGstInvoiceType
          ? "GST Invoice"
          : "Tax Invoice";

        const invoiceForPdf = {
          ...newInvoiceData,
          id: savedInvoice?.invoiceNo || `${invoiceType === "TAX" ? "INV" : "PI"}-${Date.now()}`,
          type: displayType,
          gstPercent: isCashPayment ? 0 : (Number(newInvoiceData.gstPercent) || 18),
          totalGst: isCashPayment ? 0 : (Number(newInvoiceData.totalGst) || 0),
          totalAmount: isCashPayment ? rawAmount : (Number(newInvoiceData.totalAmount) || rawAmount),
        };
        downloadInvoice(invoiceForPdf);
        refreshInvoices();
        setNotification(`${displayType} created and saved.`);
        setTimeout(() => setNotification(""), 4200);
        setShowCreateModal(false);
      } else {
        const err = await res.json();
        console.error("Invoice API error:", err);
        let errorMsg = err.message || "Unknown error";
        if (Array.isArray(err.errors) && err.errors.length > 0) {
          errorMsg = err.errors.map(e => `${e.field}: ${e.message}`).join("; ");
        }
        setNotification(`Error: ${errorMsg}`);
        setTimeout(() => setNotification(""), 8000);
      }
    } catch (err) {
      console.error(err);
      setNotification(`Failed to create invoice: ${err.message}`);
      setTimeout(() => setNotification(""), 4200);
    }
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
                : tab === "GST Invoices"
                  ? invoices.filter((i) => (i.type || "").toLowerCase().includes("gst") && !(i.type || "").toLowerCase().includes("tax")).length
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
                const isGstInv = (invoice.type || "").toLowerCase().includes("gst") && !(invoice.type || "").toLowerCase().includes("tax");
                const gst = isGstInv ? 0 : (Number(invoice.gstPercent) !== undefined ? Number(invoice.gstPercent) : 18);
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
                        background: (invoice.type || "").toLowerCase().includes("proforma")
                          ? "#e0f2fe"
                          : isGstInv
                            ? "#fef3c7"
                            : "#dcfce7",
                        color: (invoice.type || "").toLowerCase().includes("proforma")
                          ? "#0369a1"
                          : isGstInv
                            ? "#b45309"
                            : "#15803d"
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
