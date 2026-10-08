import { useState, useEffect, useCallback } from "react";
import { mergeSecondaryClients } from "../utils/branchHelper";
import { apiFetch } from "../services/apiClient";

export function useApiClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiFetch("/clients");

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        // Map backend Prisma model to frontend UI format
        const mappedClients = result.data.map(c => {
          const sName = typeof c.salesPerson === "object" ? c.salesPerson?.fullName : c.salesPerson;
          const sEmail = typeof c.salesPerson === "object" ? c.salesPerson?.email : "";
          const branchName = typeof c.branch === "object" ? c.branch?.name : c.branch;
          const branchCode = typeof c.branch === "object" ? c.branch?.code : "";
          const region = typeof c.branch === "object" ? c.branch?.region : "";
          
          let totalPayment = Number(c.totalPayment || 0);
          let paymentReceived = Number(c.paymentReceived || 0);

          if (Array.isArray(c.invoices) && c.invoices.length > 0) {
            let invTotal = 0;
            let invReceived = 0;
            c.invoices.forEach(inv => {
              invTotal += Number(inv.rawTotal || 0);
              invReceived += Number(inv.paymentReceived || 0);
            });
            if (invTotal > totalPayment) totalPayment = invTotal;
            if (invReceived > paymentReceived) paymentReceived = invReceived;
          }

          const isSec = c.isPrimary === false ||
            c.processType === "secondary" ||
            c.serviceType === "More Services" ||
            (typeof c.appId === "string" && (c.appId.endsWith("-S") || c.appId.endsWith("-E")));

          if (!isSec && totalPayment === 0) {
            totalPayment = 118000;
          }

          if (!isSec && paymentReceived === 0 && (c.approvalStatus === "ACTIVE" || c.paymentStatus === "Paid")) {
            paymentReceived = totalPayment;
          }

          let paymentPending = Math.max(0, totalPayment - paymentReceived);

          return {
            ...c,
            // Map key frontend fields expected by legacy components
            company: c.companyName || c.name,
            scheme: c.serviceName,
            amount: totalPayment.toString(),
            totalPayment: totalPayment.toString(),
            paymentReceived: paymentReceived.toString(),
            paymentPending: paymentPending.toString(),
            salesPerson: sName || c.salesPersonId || "Unassigned",
            salesPersonEmail: sEmail,
            owner: sName || c.salesPersonId || "Unassigned",
            ownerEmail: sEmail,
            branch: branchName || c.branchId || "Unassigned",
            branchCode: branchCode,
            region: region,
            progress: c.progressPercent || 0,
            status: c.approvalStatus === "ACTIVE" ? "Active" : c.approvalStatus === "PENDING_APPROVAL" ? "Pending" : c.stage,
            isPrimary: c.isPrimary !== undefined ? c.isPrimary : !isSec,
            processType: isSec ? "secondary" : "primary",
          };
        });
        const fullClientsList = mergeSecondaryClients(mappedClients);
        setClients(fullClientsList);
      } else {
        setClients([]);
      }
    } catch (err) {
      console.error("Failed to fetch clients from API:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();

    // Listen to global events for refresh
    const handleUpdate = () => {
      fetchClients();
    };

    window.addEventListener("agni_clients_updated", handleUpdate);
    
    const handlePipelineUpdate = () => {
      setClients(prev => [...prev]); // Force re-render for local storage overlay without hitting API
    };
    window.addEventListener("pipelineUpdated", handlePipelineUpdate);
    window.addEventListener("agni_scheme_updated", handlePipelineUpdate);

    return () => {
      window.removeEventListener("agni_clients_updated", handleUpdate);
      window.removeEventListener("pipelineUpdated", handlePipelineUpdate);
      window.removeEventListener("agni_scheme_updated", handlePipelineUpdate);
    };
  }, [fetchClients]);

  return { clients, loading, error, refreshClients: fetchClients, setClients };
}
