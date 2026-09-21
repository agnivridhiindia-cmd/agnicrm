import React from "react";
import DashboardSidebar from "../../components/dashboard/DashboardSidebar";
import DashboardHeader from "../../components/dashboard/DashboardHeader";
import HeaderSearch from "../../components/dashboard/HeaderSearch";
import UserProfileMenu from "../../components/dashboard/UserProfileMenu";
import Icon from "../../components/Icon";
import Modal from "../../components/Modal";
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
  const [showRegisterModal, setShowRegisterModal] = React.useState(false);

  const {
    activeNav,
    setActiveNav,
    dark,
    setDark,
    searchOpen,
    setSearchOpen,
    notificationsOpen,
    setNotificationsOpen,
    query,
    setQuery,
    toastMessage,
    setToastMessage,
    showToast,
    salesPersonName,
    notificationsList,
    notificationWrapRef,
    notificationsListRef,
    handleNotificationsListScroll,
  } = useSalesDashboard(userEmail);

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
  } = useSalesClients(salesPersonName, (createdClient) => {
    showToast(
      `✓ Client registration for "${createdClient?.company || createdClient?.name || 'New Client'}" submitted to Sales Manager for approval!`
    );
    setShowRegisterModal(false);
  });

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
          title={`Hello, ${salesPersonName}`}
          className="sales-dashboard-top"
        >
          <div className="top-actions">
            <HeaderSearch
              query={query}
              setQuery={setQuery}
              isOpen={searchOpen}
              setIsOpen={setSearchOpen}
              placeholder="Search clients, leads, or deals..."
            />

            <div className="notification-wrap" ref={notificationWrapRef}>
              <button
                className="notification"
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                aria-label="Notifications"
              >
                <Icon name="bell" size={16} />
                <i />
              </button>
              {notificationsOpen && (
                <section className="notifications-popover" aria-label="Notifications">
                  <header>
                    <h2>Notifications</h2>
                    <span>{notificationsList.length} new</span>
                  </header>
                  <div
                    ref={notificationsListRef}
                    className="notifications-scroll"
                    onScroll={handleNotificationsListScroll}
                  >
                    {notificationsList.map((notice, idx) => (
                      <article key={notice.id || notice.title + idx}>
                        <span
                          className={`notice-dot ${notice.tone === '#aa83eb'
                            ? 'violet'
                            : notice.tone === '#88cda4'
                              ? 'green'
                              : 'coral'
                            }`}
                        />
                        <div>
                          <strong>{notice.title}</strong>
                          <p>{notice.detail}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}
            </div>
            <UserProfileMenu
              user={{
                name: salesPersonName,
                email: `${salesPersonName.toLowerCase().replace(/\s+/g, ".")}@agnicrm.com`,
                phone: "+91 98201 54321",
                branch: "West Zone (Mumbai)",
                designation: "Senior Sales Officer",
                empId: "EMP-SLS-2024",
                quota: "₹80,000",
                achieved: `${quotaMetrics?.achieved || "₹0"} (${quotaMetrics?.progress || "0%"})`,
                reportingManager: "Vikramaditya Sharma",
              }}
              role="Sales"
              roleBadge="Sales"
              initials="SP"
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
            userEmail={userEmail}
            userRole={localStorage.getItem("agni_user_role")}
            salesPersonName={salesPersonName}
          />
        )}

        {activeNav === "Invoices" && <SalesInvoices clients={clients} userEmail={userEmail} salesPersonName={salesPersonName} />}

        {activeNav === "Payment" && <SalesPayments clients={clients} userEmail={userEmail} salesPersonName={salesPersonName} />}

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
                salesPersonName={salesPersonName}
                dark={dark}
              />
            ) : (
              <SalesClientDossier
                selectedClient={selectedClient}
                allClients={clients}
                onBack={() => setSelectedClient(null)}
                salesPersonName={salesPersonName}
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
