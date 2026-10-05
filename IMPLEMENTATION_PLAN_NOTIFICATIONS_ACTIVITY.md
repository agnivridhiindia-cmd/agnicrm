# Implementation Plan: Hierarchical Real-Time Notifications & Live Activity Feeds

## 1. Executive Summary & Objective

Activate **real-time notifications** and **live activity feeds** across all CRM dashboards according to strict organizational hierarchy:
* **Owner**: Global oversight — sees every event occurring across all branches, teams, clients, and financial workflows.
* **Branch Manager**: Scoped strictly to their own branch (`branchId`).
* **Sales Manager**: Scoped to their branch/team personnel and assigned clients.
* **Sales Person**: Scoped strictly to their assigned clients (`salesPersonId`), requests, and recorded payments.
* **Client**: Scoped strictly to their own client record (`clientId` / `client.email`), milestone advancements, invoices, and payments.

> **Zero Workflow Disruption**: All existing approval chains, role permissions, stage transition rules, and business logic remain 100% intact. We only hook into event lifecycles to record activity logs, dispatch notifications, and broadcast real-time events.

---

## 2. Current State vs. Target State

| Component | Current State | Target State |
| :--- | :--- | :--- |
| **`ActivityLog` DB Model** | Contains `id, title, detail, tone, issuer, userId`, but lacks `branchId` & `clientId` context. | Add optional `branchId`, `clientId`, `actionType`, and `targetRole` to index and filter hierarchically. |
| **Backend Activity API** | No dedicated `/api/v1/activities` endpoint. | Implement `GET /api/v1/activities` with strict hierarchical role-based scoping (matching `getRequestsService`). |
| **Activity Feeds in UI** | `OwnerOverviewPage`, `BranchManagerOverviewPage`, `ManagerOverviewPage`, and `SalesOverview` render hardcoded mock arrays (`defaultOwnerActivities`, `branchActivities`, etc.). | Replace with unified `useLiveActivityFeed` hook fetching dynamic DB activities + listening to live SSE broadcasts. |
| **Notifications API** | `/api/v1/notifications` exists, but lacks automatic trigger hooks on client creation, payment approvals, stage changes, or workflow decisions. | Instrument lifecycle hooks into `workflow.service.ts`, `client.service.ts`, `payment.service.ts`, and `request.service.ts`. |
| **Notification UI** | `NotificationBell` exists for internal roles but uses dummy fallback data when empty. `ClientDashboard` has a custom local popover without API persistence. | Wire `NotificationBell` directly to DB notifications + SSE; connect `ClientDashboard` notification popover to the backend API. |

---

## 3. Hierarchy & Visibility Matrix

| Event Type | Owner | Branch Manager | Sales Manager | Sales Person | Client |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **New Client Registered / Applied** | Global | Same Branch | Same Branch / Team | Assigned Rep | The Client |
| **Stage / Milestone Progressed** | Global | Same Branch | Same Branch / Team | Assigned Rep | The Client |
| **Invoice Issued & Sent** | Global | Same Branch | Same Branch / Team | Assigned Rep | The Client |
| **Payment Recorded / Received** | Global | Same Branch | Same Branch / Team | Assigned Rep | The Client |
| **Workflow Request Submitted** | Global | Same Branch | Same Branch / Team | Requester Rep | Hidden (Internal) |
| **Workflow Decision (Approve/Reject)** | Global | Same Branch | Same Branch / Team | Requester Rep | The Client (if service/agreement) |
| **Employee Transfer / Role Change** | Global | Origin & Destination Branches | Concerned Branch | Concerned User | Hidden (Internal) |

---

## 4. Phase-by-Phase Implementation Steps

### Phase 1: Database Model Enhancement (`server/prisma/schema.prisma`)
Enhance `ActivityLog` with non-breaking optional fields and indices to enable efficient hierarchical filtering:

```prisma
model ActivityLog {
  id         String    @id @default(uuid())
  title      String
  detail     String
  tone       String?   // e.g. '#10b981', '#6366f1', '#f59e0b', '#ef4444'
  issuer     String?   // e.g. "Rahul Singh (Owner)", "Vikram Roy (Sales)"
  actionType String?   // "CLIENT_CREATED", "STAGE_UPDATED", "PAYMENT_RECORDED", "REQUEST_DECISION"
  
  branchId   String?
  branch     Branch?   @relation(fields: [branchId], references: [id])
  
  clientId   String?
  client     Client?   @relation(fields: [clientId], references: [id], onDelete: Cascade)
  
  userId     String?   // Initiating user
  user       User?     @relation(fields: [userId], references: [id])
  
  createdAt  DateTime  @default(now())

  @@index([branchId, createdAt])
  @@index([clientId, createdAt])
  @@index([userId, createdAt])
  @@map("activity_logs")
}
```
*Run `npx prisma db push` to synchronize without data loss.*

---

### Phase 2: Centralized Activity & Notification Service (`server/src/services/`)
Create a single unified helper `logActivityAndNotify()` in `server/src/services/activity.service.ts`:

1. **`logActivityAndNotify(params)`**:
   - Inserts `ActivityLog` with `branchId`, `clientId`, `userId`, `actionType`.
   - Dispatches targeted `Notification` records to the relevant users based on the hierarchy matrix.
   - Calls `broadcastSseEvent()` with `targetRoles`, `targetBranchIds`, and `targetUserIds` so connected dashboards update instantly.
2. **`getHierarchicalActivitiesService(user)`**:
   - Queries `prisma.activityLog` with strict SQL/Prisma where-clauses:
     - `OWNER` / `ADMIN`: No branch/client restrictions (full system feed).
     - `BRANCH_MANAGER`: `{ branchId: user.branchId }`.
     - `MANAGER`: `{ OR: [{ branchId: user.branchId }, { user: { reportingManagerId: user.userId } }] }`.
     - `SALES_PERSON`: `{ OR: [{ userId: user.userId }, { client: { salesPersonId: user.userId } }] }`.
     - `CLIENT`: `{ client: { email: { equals: user.email, mode: "insensitive" } } }`.
3. **Register routes in `server/src/routes/activity.routes.ts`**:
   - `GET /api/v1/activities` (paginated, recent 20-50 entries).

---

### Phase 3: Lifecycle Event Instrumentation
Instrument non-invasive event hooks into existing services (zero changes to business rules):

1. **`server/src/services/client.service.ts`**:
   - On `createActiveClientCore`: Log "New Client Enrolled" (`#10b981`), notify Owner, Branch Manager, Sales Rep, and Client.
   - On stage update (`updateClientService` / milestone update): Log "Milestone Advanced" (`#6366f1`), notify Owner, Branch Manager, Sales Rep, and Client.
2. **`server/src/services/workflow.service.ts`**:
   - On `executeWorkflowDecision`: Log request approval/rejection (`#10b981` or `#ef4444`), notify requester, branch manager, and owner.
3. **`server/src/services/payment.service.ts` & `payment.controller.ts`**:
   - On payment recording / verification: Log "Payment Received" (`#059669`), notify Owner, Branch Manager, Sales Rep, and Client.
4. **`server/src/services/request.service.ts`**:
   - On request submission: Log "New Request Submitted" (`#f59e0b`), notify reviewers in the hierarchy.

---

### Phase 4: Frontend Live Feed Hook & Dashboard Integration

1. **Create `src/hooks/useLiveActivityFeed.js`**:
   - Fetches `/api/v1/activities` on mount.
   - Listens to SSE event `ACTIVITY_LOGGED` and window event `agni_activity_updated`.
   - Deduplicates and formats timestamps dynamically (`"Just now"`, `"12m ago"`, etc.).
2. **Update Dashboards**:
   - `OwnerOverviewPage.jsx`: Swap `defaultOwnerActivities` with `useLiveActivityFeed()`.
   - `BranchManagerOverviewPage.jsx`: Swap `branchActivities` with `useLiveActivityFeed()`.
   - `ManagerOverviewPage.jsx`: Swap static `activities` with `useLiveActivityFeed()`.
   - `SalesOverview.jsx`: Swap `requestActivities` with `useLiveActivityFeed()`.
   - `ClientDashboard.jsx`:
     - Connect the notification popover directly to `/api/v1/notifications` API.
     - Embed a clean "Account Activity & Milestones" live feed card on the Overview tab using `useLiveActivityFeed()`.
3. **Update `NotificationBell.jsx`**:
   - Ensure it pulls live notifications from the backend and updates unread badge count instantly on incoming SSE events.

---

### Phase 5: Verification & Testing Checklist

- [ ] **Owner View**: Create a client in West Branch -> Verify Owner sees the notification and activity feed entry immediately.
- [ ] **Branch Manager Isolation**: Verify Branch Manager of East Branch does *not* see West Branch's activity, while West Branch Manager sees it immediately.
- [ ] **Sales Manager & Rep**: Verify Salesperson only sees activities for clients assigned to them; Sales Manager sees their branch and supervised reps.
- [ ] **Client View**: Log in as a Client -> Verify they only see activities related to their account (stage changes, payments, invoices), with zero internal employee requests visible.
- [ ] **End-to-End Build**: Run full frontend and backend lint/build checks to ensure zero regressions.
