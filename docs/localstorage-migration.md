# Agni CRM — LocalStorage to Backend Migration Checklist

> **CRITICAL ARCHITECTURAL DIRECTIVE & RULE**:  
> **DO NOT CHANGE ANY EXISTING BUSINESS LOGIC, RULES, PERMISSIONS, CALCULATIONS, FORMULAS (GST 1.18, STAGE PERCENTAGES 20%/60%/80%/100%), UI DESIGNS, ROUTES, OR USER FLOWS.**  
> The sole purpose of this migration is replacing browser-persisted localStorage state with PostgreSQL / Prisma / Express API as the single authoritative source of truth.

---

## 1. LocalStorage Keys Master Inventory & Migration Status

| Key Pattern | Category | Current Source | Authoritative Target | Planned Phase | Target Action | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `agni_sales_payments` | Business (Payments) | LocalStorage | PostgreSQL `Payment` / `Invoice` | Phase 1 | Eliminate reads/writes; rely on API | Completed |
| `agni_payment_demands` | Business (Payments) | LocalStorage | PostgreSQL `Payment` (type: REQUEST) | Phase 1 | Eliminate reads/writes; rely on API | Completed |
| `agni_payment_demands_${email}` | Business (Payments) | LocalStorage | PostgreSQL `Payment` / `Invoice` | Phase 1 | Eliminate reads/writes; rely on API | Completed |
| `agni_pending_payment_settlement_requests` | Business (Settlements) | LocalStorage | PostgreSQL `Payment` (status: PENDING) | Phase 1 | Eliminate reads/writes; rely on API | Completed |
| `agni_client_requests` | Business (Requests) | LocalStorage | PostgreSQL `Request` model | Phase 1 & 5 | Eliminate reads/writes; rely on API | Completed |
| `agni_sales_clients` | Business (Clients) | LocalStorage | PostgreSQL `Client` model | Phase 3 | Eliminate reads/writes; rely on API | Completed |
| `agni_branch_clients` | Business (Clients) | LocalStorage | PostgreSQL `Client` model | Phase 3 | Eliminate reads/writes; rely on API | Completed |
| `agni_clients` | Business (Clients) | LocalStorage | PostgreSQL `Client` model | Phase 3 | Eliminate reads/writes; rely on API | Completed |
| `agni_it_clients` | Business (Clients) | LocalStorage | PostgreSQL `Client` model | Phase 3 | Eliminate reads/writes; rely on API | Completed |
| `agni_marketing_clients` | Business (Clients) | LocalStorage | PostgreSQL `Client` model | Phase 3 | Eliminate reads/writes; rely on API | Completed |
| `agni_pending_client_creations` | Business (Clients) | LocalStorage | PostgreSQL `Client` (PENDING_APPROVAL) | Phase 3 | Eliminate reads/writes; rely on API | Completed |
| `agni_sales_invoices` | Business (Invoices) | LocalStorage | PostgreSQL `Invoice` model | Phase 1 & 3 | Eliminate reads/writes; rely on API | Completed |
| `agni_invoices_${email}` | Business (Invoices) | LocalStorage | PostgreSQL `Invoice` model | Phase 1 & 3 | Eliminate reads/writes; rely on API | Completed |
| `agni_pending_scheme_requests` | Business (Schemes) | LocalStorage | PostgreSQL `Request` model | Phase 5 | Eliminate reads/writes; rely on API | Completed |
| `agni_approved_client_plans_${key}` | Business (Schemes) | LocalStorage | PostgreSQL `Client` / `Request` | Phase 5 | Eliminate reads/writes; rely on API | Completed |
| `agni_client_eligible_schemes_${key}` | Business (Schemes) | LocalStorage | PostgreSQL `Client.eligibleSchemes` | Phase 5 | Eliminate reads/writes; rely on API | Completed |
| `agni_client_enrolled_schemes_db` | Business (Schemes) | LocalStorage | PostgreSQL `Client` records | Phase 5 | Eliminate reads/writes; rely on API | Completed |
| `agni_client_due_date_${key}` | Business (Clients) | LocalStorage | PostgreSQL `Client.dueDate` | Phase 3 | Eliminate reads/writes; rely on API | Completed |
| `agni_doc_temp_${key}` | UI State (Documents) | LocalStorage | Ephemeral React Form State | Phase 6 | Use React `useState` during form fill | Completed |
| `agni_client_doc_data_${key}` | Business (Documents) | LocalStorage | PostgreSQL `ClientDocument` / storage | Phase 6 | Eliminate reads/writes; rely on API | Completed |
| `agni_client_doc_data_active` | Business (Documents) | LocalStorage | PostgreSQL `ClientDocument` / storage | Phase 6 | Eliminate reads/writes; rely on API | Completed |
| `agni_client_doc_submitted_${key}` | Business (Documents) | LocalStorage | PostgreSQL `ClientDocument` / Client | Phase 6 | Eliminate reads/writes; rely on API | Completed |
| `agni_crm_agreements_v4` / `STORAGE_KEY` | Business (Agreements) | LocalStorage | PostgreSQL `Agreement` model | Phase 7 | Eliminate reads/writes; rely on API | Completed |
| `agni_client_notifications` | Business (Notifications) | LocalStorage | PostgreSQL `Notification` model | Phase 8 | Eliminate reads/writes; rely on API | Completed |
| `agni_sales_notifications` | Business (Notifications) | LocalStorage | PostgreSQL `Notification` model | Phase 8 | Eliminate reads/writes; rely on API | Completed |
| `agni_manager_notifications` | Business (Notifications) | LocalStorage | PostgreSQL `Notification` model | Phase 8 | Eliminate reads/writes; rely on API | Completed |
| `agni_department_notifications` | Business (Notifications) | LocalStorage | PostgreSQL `Notification` model | Phase 8 | Eliminate reads/writes; rely on API | Completed |
| `agni_cleared_client_notifs_${email}` | UI / Notifications | LocalStorage | PostgreSQL `Notification` read status | Phase 8 | Eliminate reads/writes; rely on API | Completed |
| `agni_db_team_hierarchy` | Hierarchy (Employees) | LocalStorage | Backend `/employees` & `/branches` | Phase 9 | React in-memory cache only | Completed |
| `agni_token` | Auth Session | LocalStorage | Ephemeral Session Token via AuthContext | Phase 10 | Centralized via AuthContext | Completed |
| `agni_user` | Auth User | LocalStorage | `GET /auth/me` / In-Memory `useAuth()` | Phase 10 | Centralized via AuthContext | Completed |
| `agni_user_email` / `agni_email` | Auth User Email | LocalStorage | In-Memory `useAuth().userEmail` | Phase 10 | Centralized via AuthContext | Completed |
| `agni_user_role` / `agni_role` | Auth User Role | LocalStorage | In-Memory `useAuth().userRole` | Phase 10 | Centralized via AuthContext | Completed |
| `agni_user_name` | Auth User Name | LocalStorage | In-Memory `useAuth().userName` | Phase 10 | Centralized via AuthContext | Completed |
| `agni_user_id` | Auth User ID | LocalStorage | In-Memory `useAuth().user.id` | Phase 10 | Centralized via AuthContext | Completed |
| `agni_user_branch` / `agni_branch` | Auth User Branch | LocalStorage | In-Memory `useAuth().userBranch` | Phase 10 | Centralized via AuthContext | Completed |
| `agni_remember_email` / `remember_me` | Client Preference | LocalStorage | Browser Storage (Allowed) | Retain | Allowed client convenience preference | Active |
| `agni_pwa_installed` | Client Preference | LocalStorage | Browser Storage (Allowed) | Retain | Allowed client UI install flag | Active |
| `agni_theme` | Client Preference | LocalStorage | Browser Storage (Allowed) | Retain | Allowed client UI theme preference | Active |

---

## 2. Migration Execution Milestones

- [x] **Step 01**: Baseline verification & test checklist setup.
- [x] **Step 02**: Phase 1 — Payment API migration (`useApiPayments.js`, `PaymentsPage.jsx`, `SalesPayments.jsx`, `SalesRequests.jsx`).
- [x] **Step 03**: Phase 1.5 — Payment normalization adapter (`PaymentRequest` canonical type).
- [x] **Step 04**: Phase 2 — Razorpay online checkout verification (clean out client-side storage mirror).
- [x] **Step 05**: Phase 3 — Client API migration (`useApiClients.js`, `useSalesClients.js`, `ClientDashboard.jsx`, `OwnerDashboard.jsx`).
- [x] **Step 06**: Phase 4 — Decouple custom storage events in favor of targeted API invalidation / refetch hooks.
- [x] **Step 07**: Phase 5 — Scheme & request API migration (`EligibilityPage.jsx`, `MoreServicesPage.jsx`, `schemeTracker.js`).
- [x] **Step 08**: Phase 6 — Document submission API migration (`DocumentForm.jsx`, `SalesClientDossier.jsx`, `SalesInvoices.jsx`).
- [x] **Step 09**: Phase 7 — Agreement API migration (`agreementService.js`, `AgreementPage.jsx`, `ClientAgreementPage.jsx`).
- [x] **Step 10**: Phase 8 — Notification API migration (`NotificationBell.jsx`, `useApiNotifications.js`, `realtimeService.js`).
- [x] **Step 11**: Phase 9 — Branch & team hierarchy in-memory caching (`branchHelper.js`).
- [x] **Step 12**: Phase 10 — Authentication centralization (`AuthContext.jsx`, `/auth/me`, remove loose auth `localStorage` reads).
- [x] **Step 13**: Phase 11 — `App.jsx` cleanup & decommission `clearClientLocalStorage.js`.
- [x] **Step 14**: Final verification: Repository-wide audit, multi-tab, multi-device, and multi-role testing.
