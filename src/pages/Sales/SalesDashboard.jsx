import React from "react";
import DashboardSidebar from "../../components/dashboard/DashboardSidebar";
import DashboardHeader from "../../components/dashboard/DashboardHeader";
import NotificationBell from "../../components/dashboard/NotificationBell";
import UserProfileMenu from "../../components/dashboard/UserProfileMenu";
import Icon from "../../components/Icon";
import Modal from "../../components/Modal";
import { apiFetch } from "../../services/apiClient";
import { useAuth } from "../../context/AuthContext";
import { getSalesPersonProfile, getSalesPersonQuota } from "../../utils/salesConfigHelper";
import "./salesdashboard.css";

// Sub-components
import SalesOverview from "./components/SalesOverview";
import SalesClientForm from "./components/SalesClientForm";
import SalesClientDirectory from "./components/SalesClientDirectory";
import SalesClientDossier from "./components/SalesClientDossier";
import SalesPerformance from "./components/SalesPerformance";
import SalesRequests from "./SalesRequests";
import SalesInvoices from "./SalesInvoices";
import SalesPayments from "./SalesPayments";

// Hooks & Data
import { useSalesDashboard } from "./hooks/useSalesDashboard";
import { useSalesClients } from "./hooks/useSalesClients";
import { navItems, notifications } from "./mockSalesData";

export default function SalesDashboard({ onSignOut, userEmail }) {
  const { user: authUser } = useAuth();
  const [showRegisterModal, setShowRegisterModal] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState(() => authUser);

  React.useEffect(() => {
    let isMounted = true;
    const fetchMe = () => {
      apiFetch("/auth/me")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (isMounted && data?.success && data?.user) {
            setCurrentUser(data.user);
            if (data.user.fullName || data.user.name) {
              localStorage.setItem("agni_user_name", data.user.fullName || data.user.name);
            }
            localStorage.setItem("agni_user", JSON.stringify(data.user));
          }
        })
        .catch(() => {});
    };

    fetchMe();
    window.addEventListener("agni_sales_config_updated", fetchMe);
    return () => {
      isMounted = false;
      window.removeEventListener("agni_sales_config_updated", fetchMe);
    };
  }, []);

  const {
    activeNav,
    setActiveNav,
    dark,
    setDark,
    toastMessage,
    setToastMessage,
    showToast,
    salesPersonName,
  } = useSalesDashboard(userEmail, currentUser);

  // Authoritative salesperson display name directly from backend PostgreSQL profile
  const displayName = currentUser?.fullName?.trim() || currentUser?.name?.trim() || authUser?.fullName?.trim() || salesPersonName;

  const effectiveUserQuota = currentUser?.targetQuota ? Number(currentUser.targetQuota) : (authUser?.targetQuota ? Number(authUser.targetQuota) : null);

  const {
    clients,
    selectedClient,
    setSelectedClient,
    clientSearch,
    setClientSearch,
    stageFilter,
    setStageFilter,
    paymentFilter,
    setPaymentFilter,
    pipelineFilter,
    setPipelineFilter,
    selectedYear,
    setSelectedYear,
    newClient,
    formSuccessMsg,
    filteredClients,
    kpiCards,
    quotaMetrics,
    monthlyQuotaChartData,
    handleNewClientChange,
    handleClearClientForm,
    handleAddClient,
    handleVerifyDocument,
    handleSaveClientSchemes,
    pendingSchemeRequests,
    handleApproveSchemeRequest,
    handleDeclineSchemeRequest,
    handleUpdateClientDueDate,
  } = useSalesClients(displayName, (createdClient) => {
    showToast(
      `✓ Client registration for "${createdClient?.company || createdClient?.name || 'New Client'}" submitted to Sales Manager for approval!`
    );
    setShowRegisterModal(false);
  }, userEmail, effectiveUserQuota);

  return (
    <main className={`owner-dashboard sales-dashboard ${dark ? "dashboard-dark" : ""}`}>
      <DashboardSidebar
        navItems={navItems}
        activeNav={activeNav}
        onNavChange={(nav) => {
          setActiveNav(nav);
        }}
        dark={dark}
        onToggleDark={() => setDark((value) => !value)}
        onSignOut={onSignOut}
        IconComponent={Icon}
        brandMark="S"
        navLabel="Sales dashboard navigation"
      />

      <section className="dashboard-content">
        <DashboardHeader
          eyebrow="Sales workspace"
          title={`Hello, ${displayName}`}
          className="sales-dashboard-top"
        >
          <div className="top-actions">
            <NotificationBell role="Sales" userEmail={userEmail} userName={displayName} />
            <UserProfileMenu
              user={{
                name: displayName,
                email: currentUser?.email || userEmail || "",
                phone: currentUser?.phone || "+91 98201 54321",
                branch: currentUser?.branch?.name || (typeof currentUser?.branch === "string" ? currentUser.branch : "West Zone (Mumbai)"),
                designation: currentUser?.designation || getSalesPersonProfile(displayName || currentUser?.id, "Sales Officer"),
                empId: currentUser?.id ? `EMP-${currentUser.id.slice(0, 6).toUpperCase()}` : "EMP-SLS-2024",
                quota: `₹${(quotaMetrics?.initialQuotaTarget || effectiveUserQuota || getSalesPersonQuota(displayName || currentUser?.id) || 80000).toLocaleString("en-IN")}`,
                achieved: `${quotaMetrics?.achieved || "₹0"} (${quotaMetrics?.progress || "0%"})`,
                reportingManager: currentUser?.reportingManager?.fullName || "Eli Brooks",
              }}
              role="Sales"
              roleBadge="Sales"
              initials={displayName ? displayName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase() : "SP"}
              avatarColor="linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)"
              onSignOut={onSignOut}
              showToast={(msg) => setToastMessage(msg)}
            />
          </div>
        </DashboardHeader>

        {toastMessage && (
          <div className="sales-toast">
            <span>{toastMessage}</span>
            <button
              type="button"
              className="sales-toast-close"
              onClick={() => setToastMessage("")}
            >
              ✕
            </button>
          </div>
        )}

        {activeNav === "Dashboard" && (
          <SalesOverview
            kpiCards={kpiCards}
            monthlyQuotaChartData={monthlyQuotaChartData}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            dark={dark}
            onNavigate={(nav) => setActiveNav(nav)}
            onSelectKpiFilter={(filterKey) => {
              setPipelineFilter(filterKey);
              setActiveNav("Clients");
            }}
          />
        )}

        {activeNav === "Register" && (
          <SalesClientForm
            newClient={newClient}
            onNewClientChange={handleNewClientChange}
            onAddClient={handleAddClient}
            onClearForm={handleClearClientForm}
            onGoToDetails={() => setActiveNav("Clients")}
            formSuccessMsg={formSuccessMsg}
            dark={dark}
          />
        )}

        {activeNav === "Requests" && (
          <SalesRequests
            clients={clients}
            userEmail={userEmail}
            userRole={currentUser?.role || "Sales Person"}
            salesPersonName={displayName}
          />
        )}

        {activeNav === "Invoices" && <SalesInvoices clients={clients} userEmail={userEmail} salesPersonName={displayName} />}

        {activeNav === "Payment" && <SalesPayments clients={clients} userEmail={userEmail} salesPersonName={displayName} />}

        {activeNav === "Performance" && <SalesPerformance />}

        {activeNav === "Clients" && (
          <section>
            {!selectedClient ? (
              <SalesClientDirectory
                clients={clients}
                filteredClients={filteredClients}
                clientSearch={clientSearch}
                setClientSearch={setClientSearch}
                stageFilter={stageFilter}
                setStageFilter={setStageFilter}
                paymentFilter={paymentFilter}
                setPaymentFilter={setPaymentFilter}
                pipelineFilter={pipelineFilter}
                setPipelineFilter={setPipelineFilter}
                onSelectClient={(client) => setSelectedClient(client)}
                onCreateNewClient={() => setShowRegisterModal(true)}
                salesPersonName={displayName}
                dark={dark}
              />
            ) : (
              <SalesClientDossier
                selectedClient={selectedClient}
                allClients={clients}
                onBack={() => setSelectedClient(null)}
                salesPersonName={displayName}
                onSchemeSave={(updatedSchemes) => {
                  if (selectedClient && updatedSchemes) {
                    handleSaveClientSchemes(selectedClient.id, updatedSchemes);
                    showToast("✓ Recommended eligible schemes saved! Updated client dashboard visibility.");
                  }
                }}
                onVerifyDocument={handleVerifyDocument}
                pendingSchemeRequests={pendingSchemeRequests}
                onApproveSchemeRequest={(reqId, reqAmt, pitchedAmt) => {
                  handleApproveSchemeRequest(reqId, reqAmt, pitchedAmt);
                  const formattedAmt = pitchedAmt && !isNaN(Number(pitchedAmt)) ? ` (Pitched Fee Paid: ₹${Number(pitchedAmt).toLocaleString('en-IN')})` : '';
                  showToast(`✓ Scheme enrollment approved!${formattedAmt} Quota Achieved & Client Database updated.`);
                }}
                onDeclineSchemeRequest={(reqId) => {
                  handleDeclineSchemeRequest(reqId);
                  showToast("Application request declined.");
                }}
                onUpdateDueDate={(newDueDate) => {
                  if (selectedClient) {
                    handleUpdateClientDueDate(selectedClient.id, newDueDate);
                    showToast("✓ Service Due Date & Renewal updated! Synced to Client Dashboard.");
                  }
                }}
              />
            )}
          </section>
        )}
      </section>

      {showRegisterModal && (
        <Modal
          title="Register New Client"
          onClose={() => setShowRegisterModal(false)}
        >
          <SalesClientForm
            newClient={newClient}
            onNewClientChange={handleNewClientChange}
            onAddClient={handleAddClient}
            onClearForm={handleClearClientForm}
            onGoToDetails={() => { setShowRegisterModal(false); setActiveNav("Clients"); }}
            formSuccessMsg={formSuccessMsg}
            dark={dark}
          />
        </Modal>
      )}
    </main>
  );
}
