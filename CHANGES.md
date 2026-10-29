
# AgniCRM - Project Change Log

All modifications made to the codebase, including UI/UX redesigns, layout improvements, and feature updates, will be systematically logged in this document.

---

## [2026-10-29] - External Payment Feature & Multi-Dashboard Synchronization

### Overview
Added an end-to-end "External Payment" feature enabling sales representatives to record offline/external client payments (Bank Transfer/NEFT/RTGS, UPI/QR, Cheque, Cash) for Sales Manager authorization. Once approved, client pending balances reduce, salesperson quotas credit immediately, Owner/Manager revenue calendars update, and client due date pop-ups reconcile.

### Key Enhancements
1. **Database & Workflow Schema**:
   - Added `EXTERNAL_PAYMENT` to `enum RequestType` in `server/prisma/schema.prisma` and synchronized PostgreSQL schema.
   - Configured deterministic approval routing in `workflow.service.ts` (`SALES_PERSON` -> `MANAGER`).
   - Implemented atomic transactional execution in `executeWorkflowDecision`: updates client `paymentReceived`, client scheme `receivedAmount`, invoice, creates official `Payment` record (`OFFLINE`, `SUCCESS`), and records `DailySalesPayment` for revenue analytics.
   - Whitelisted `EXTERNAL_PAYMENT` in `request.service.ts` so managers can view and approve offline payment petitions.
2. **Salesperson Dashboard UI**:
   - Built `RecordExternalPaymentModal.jsx` with client selection, remaining balance summary, quick-fill amount buttons, optional transaction reference/UTR, and auto-generated fallback codes.
   - Added entry points in `SalesPayments.jsx` ("Record External Payment" header button), `SalesClientDossier.jsx` (1-click action on pending balance), and `CreateRequestModal.jsx`.
   - Updated `SalesRequests.jsx` to parse and render External Payment requests with real-time status.
3. **Manager Dashboard UI**:
   - Updated `ManagerRequests.jsx` and `RequestModal.jsx` to display External Payment details (collected amount, channel, reference, date, notes) and provide one-click "Approve External Payment ✓".
4. **Client Dashboard Reconciliation**:
   - Reconciled `ClientDashboard.jsx` due date reminder popup to suppress aggressive payment warnings when no unsettled demands remain or dues are cleared.
   - Updated modal banner to reflect "Account in Good Standing / All Dues Cleared".

### Files Modified
- `server/prisma/schema.prisma`
- `server/src/services/workflow.service.ts`
- `server/src/services/request.service.ts`
- `src/pages/Sales/RecordExternalPaymentModal.jsx` (New)
- `src/pages/Sales/SalesPayments.jsx`
- `src/pages/Sales/SalesRequests.jsx`
- `src/pages/Sales/CreateRequestModal.jsx`
- `src/pages/Sales/components/SalesClientDossier.jsx`
- `src/pages/Manager/ManagerRequests.jsx`
- `src/pages/Manager/RequestModal.jsx`
- `src/ClientDashboard.jsx`
- `CHANGES.md`

---

## [2026-08-10] - Premium Sidebar Glass Panel Navigation Overhaul

### Overview
Completely overhauled the `DashboardSidebar` component and its CSS styling to match the glassmorphic premium UI used throughout the client dashboard. The sidebar now features a translucent glass panel, squared brand mark with gradient logo, nav icon pill wrappers, active indicator bar, refined dark mode toggle, and a styled sign-out button.

### Key Enhancements
1. **Glass Panel Container**: 28px backdrop blur, translucent white fill, rounded right corners (28px), subtle inset white border glow.
2. **Brand Logo**: Squared 14px-radius brand mark with `#172135 → #4e7cff` gradient, "CRM" text with blue-to-violet gradient clip.
3. **Navigation Section Label**: Uppercase `NAVIGATION` label with 10px bold font and 1.5px letter spacing.
4. **Icon Pill Wrappers (`.sidebar-nav-icon-wrap`)**: Each nav icon sits in a 32px glass pill (white fill, 10px radius). Selected state fills with primary gradient and turns icon white.
5. **Active Indicator Bar (`.sidebar-active-indicator`)**: 4px-wide vertical gradient bar (`#4e7cff → #9a74e9`) on the right edge of the selected item with glowing shadow.
6. **Theme Toggle**: Redesigned with blue pill track (light mode) / amber pill track (dark mode), gradient knob, and contextual label ("Dark mode" / "Light mode").
7. **Sign Out Button**: Red-tinted glass button with hover fill animation (#ef4444).
8. **Dark Mode Compatibility**: Full dark mode overrides for all sidebar elements.
9. **Mobile Responsiveness**: New elements (section label, icon wrap, active indicator) hidden in mobile bottom dock layout.

### Files Modified
- `src/components/dashboard/DashboardSidebar.jsx` (Overhauled component structure)
- `src/ClientDashboard.css` (Added ~240 lines of premium sidebar styles)
- `CHANGES.md` (Updated)

---

## [2026-08-10] - Dark Blue Spotlight Background Wallpaper Matching Reference (`/dark_blue_spotlight_bg.png`)

### Overview
Generated a minimalist luxury dark blue wallpaper featuring a diagonal top-left spotlight beam, glowing royal blue center, and pitch-black vignetted edges matching the reference image (`public/dark_blue_spotlight_bg.png`). Configured `src/ClientDashboard.css` so that switching to Dark Mode instantly transitions to this wallpaper.

### Key Enhancements
1. **Spotlight Blue Background Asset (`public/dark_blue_spotlight_bg.png`)**:
   - Generated high-resolution dark navy blue wallpaper with a top-left diagonal ambient spotlight beam, royal blue highlight, fine metallic satin texture, and deep black vignetted borders.
2. **Dark Mode Background Integration**:
   - Light Mode (`.cd-redesign`): Uses `/yellow_gradient_bg.png`.
   - Dark Mode (`.dashboard-dark .cd-redesign`): Automatically switches to `/dark_blue_spotlight_bg.png`.

### Files Modified
- `public/dark_blue_spotlight_bg.png` (New spotlight dark blue background asset)
- `src/ClientDashboard.css` (Updated dark mode wallpaper CSS)
- `CHANGES.md` (Updated)

---

## [2026-08-10] - Dynamic Light/Dark Mode Wallpaper Switching (`/dark_blue_gradient_bg.png`)

### Overview
Generated a luxury dark blue abstract mesh wallpaper (`public/dark_blue_gradient_bg.png`) and updated `src/ClientDashboard.css` so that switching between Normal (Light) Mode and Dark Mode automatically transitions the client dashboard background wallpaper between yellow gradient and dark blue gradient.

### Key Enhancements
1. **Dark Blue Gradient Wallpaper Asset (`public/dark_blue_gradient_bg.png`)**:
   - Generated high-resolution dark blue abstract mesh wallpaper with glossy metallic navy blue gradients, dark midnight cyan curves, and deep indigo glassmorphic glows.
2. **Dynamic Wallpaper Theme Switching**:
   - Normal Light Mode (`.cd-redesign`): Uses `/yellow_gradient_bg.png`.
   - Dark Mode (`.dashboard-dark .cd-redesign`): Switches to `/dark_blue_gradient_bg.png`.

### Files Modified
- `public/dark_blue_gradient_bg.png` (New dark blue background image asset)
- `src/ClientDashboard.css` (Added dark mode background wallpaper rule)
- `CHANGES.md` (Updated)

---

## [2026-08-10] - Header Notification & Profile Popover Visibility & Stacking Context Fix

### Overview
Fixed header popover clipping and visibility bugs by elevating `.cd-header` stacking context (`z-index: 5000; overflow: visible !important;`) and giving `.cd-popover` high popout z-index (`z-index: 99999 !important;`).

### Key Enhancements
1. **Header Stacking Context Elevation**:
   - Set `position: relative; z-index: 5000 !important; overflow: visible !important;` on `.cd-header` so popovers are never clipped by the header container or hero section backdrop filters.
2. **Popover Popup Layering (`.cd-popover`)**:
   - Set `position: absolute; top: calc(100% + 12px); right: 0; z-index: 99999 !important;` with 28px glass backdrop blur and soft dropdown scale animation (`cdPopoverFade`).

### Files Modified
- `src/ClientDashboard.css` (Updated `.cd-header`, `.cd-popover-wrap`, and `.cd-popover` positioning & z-index)
- `CHANGES.md` (Updated)

---

## [2026-08-10] - New Service Request Popup Modal (`newRequestOpen`) UI Overhaul

### Overview
Overhauled the New Service Request popup modal in `src/ClientDashboard.jsx` and `src/ClientDashboard.css` with 28px glassmorphic backdrop filters, 4px top accent gradient bar, assigned sales lead chip, glass form controls, and glowing dispatch buttons.

### Key Enhancements
1. **Glassmorphic Backdrop & Accent Bar**:
   - Upgraded `.cd-modal-backdrop` and `.cd-modal-request` with 28px glass backdrop filter blur, 4px top accent gradient bar, and elevated drop shadow (`0 30px 60px -12px rgba(0, 0, 0, 0.4)`).
2. **Assigned Sales Lead Representative Chip**:
   - Added `.cd-modal-assigned-card` featuring **Mia Ross** (Senior Sales Lead) and Account Lead **Kansish**.
3. **Glass Form Controls (`.cd-modal-select`, `.cd-modal-textarea`)**:
   - Styled custom `<select>` and `<textarea>` controls with translucent glass fills, rounded 14px borders, and glowing blue focus outlines (`border-color: #4e7cff; box-shadow: 0 0 0 4px rgba(78, 124, 255, 0.2)`).
4. **Dispatch Button & Success State**:
   - Styled **Dispatch Request to Mia Ross** button (`.cd-submit-btn-glow`) with right arrow icon animation and emerald green success feedback card (`.cd-request-success-icon`).

### Files Modified
- `src/ClientDashboard.jsx` (Overhauled modal structure, assigned lead chip, and success card)
- `src/ClientDashboard.css` (Added modal backdrop blur, top accent bar, glass form control, and glowing submit button styles)
- `CHANGES.md` (Updated)

---

## [2026-08-10] - Active Schemes & Plans (`.cd-schemes-section`) UI Overhaul

### Overview
Overhauled the Active Schemes & Plans section card layout, badge styling, glassmorphic metadata boxes, and interactive button hover effects in `src/ClientDashboard.jsx` and `src/ClientDashboard.css`.

### Key Enhancements
1. **Outer/Inner Padding Fix (`.cd-scheme-card-box`)**:
   - Fixed double padding whitespace bug on `.cd-scheme-card-box` (`padding: 0 !important;`), keeping clean 24px inner body padding.
2. **Emerald Green Active Badges**:
   - Styled `.cd-badge-active` with emerald green pill background (`rgba(16, 185, 129, 0.12)`), `#059669` typography, and green border ring.
3. **Glassmorphic Metadata Panel (`.cd-scheme-meta-box`)**:
   - Transformed `.cd-scheme-meta-box` into a rounded 16px glass panel (`background: rgba(255, 255, 255, 0.45); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.65)`).
4. **Interactive Action Button**:
   - Styled **Inspect Policy & Benefits** button (`.cd-scheme-btn-outline`) with arrow icon slide animation on hover (`transform: translateX(4px)`).

### Files Modified
- `src/ClientDashboard.jsx` (Updated scheme card labels and metadata text)
- `src/ClientDashboard.css` (Overhauled scheme card padding, badges, glass box, and button hover states)
- `CHANGES.md` (Updated)

---

## [2026-08-10] - Pipeline Tracker Check Ball Sizing Expansion (50px Node & 20px Icon)

### Overview
Increased the dimensions of the pipeline step check balls (`.cd-pipeline-dot`) from 38px x 38px to 50px x 50px and scaled up checkmark icons to `size={20}` for high-visibility visual feedback.

### Key Enhancements
1. **Check Ball Dimension Expansion (`ClientDashboard.css`)**:
   - Expanded `.cd-pipeline-dot` width and height to 50px with 16px font-size and elevated shadow glow.
2. **Check Icon Scaling (`ClientDashboard.jsx`)**:
   - Scaled checkmark icon size from `size={14}` to `size={20}` inside completed step nodes.

### Files Modified
- `src/ClientDashboard.jsx` (Updated checkmark icon size to 20)
- `src/ClientDashboard.css` (Updated `.cd-pipeline-dot` dimensions to 50px)
- `CHANGES.md` (Updated)

---

## [2026-08-10] - Pipeline Tracker Connecting Lines Removal & Emerald Green Completed Step Nodes

### Overview
Removed connecting background lines (`.cd-pipeline-line`) from the pipeline progress tracker and updated completed step nodes (`.cd-pipeline-step.done .cd-pipeline-dot`) with vibrant emerald green gradient fills (`#059669` to `#10b981`).

### Key Enhancements
1. **Pipeline Connecting Lines Removal**:
   - Removed `.cd-pipeline-line` from JSX rendering in `src/ClientDashboard.jsx` and set `display: none !important` in `src/ClientDashboard.css`.
2. **Emerald Green Completed Step Nodes**:
   - Styled `.cd-pipeline-step.done .cd-pipeline-dot` with emerald green gradient fill (`linear-gradient(135deg, #059669 0%, #10b981 100%)`) and glowing green shadow (`box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4)`).
   - Styled completed status labels with emerald green typography (`#10b981`).

### Files Modified
- `src/ClientDashboard.jsx` (Removed `.cd-pipeline-line` JSX element)
- `src/ClientDashboard.css` (Updated `.cd-pipeline-step.done` styles and hidden pipeline lines)
- `CHANGES.md` (Updated)

---

## [2026-08-10] - Active Service Pipeline Tracker Section (`.cd-tracker-section`) Styling Overhaul

### Overview
Overhauled the `.cd-tracker-section` (Service Request / Application SLA Pipeline Tracker Card) with a 4px top multi-color accent bar, drop-shadow progress ring glow, and a translucent 20px glassmorphic container wrapper around the progress pipeline steps.

### Key Enhancements
1. **Top Accent Gradient Bar**:
   - Added a 4px top accent bar (`linear-gradient(90deg, #4e7cff 0%, #d97706 50%, #9a74e9 100%)`) to `.cd-tracker-section`.
2. **Glowing Circular Progress Ring**:
   - Styled `.cd-tracker-ring` with `filter: drop-shadow(0 4px 14px rgba(78, 124, 255, 0.35))` and bold percent typography.
3. **Glassmorphic Pipeline Step Container**:
   - Wrapped `.cd-pipeline-steps` in a rounded 20px glass panel (`background: rgba(255, 255, 255, 0.45); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.65)`).
   - Styled active pipeline dots with pulsating gold rings (`#d97706`) and completed steps with glowing navy/indigo gradients.

### Files Modified
- `src/ClientDashboard.css` (Overhauled `.cd-tracker-section` and `.cd-pipeline-steps` styles)
- `CHANGES.md` (Updated)

---

## [2026-08-10] - Legacy & Obsolete CSS Code Cleanup (`src/styles.css`)

### Overview
Cleaned up obsolete, redundant legacy CSS rules from `src/styles.css` that were superseded by `src/ClientDashboard.css`, reducing the total production CSS bundle size by ~4KB.

### Key Enhancements
1. **Dead CSS Elimination**:
   - Removed obsolete legacy classes: `.more-services-page`, `.more-services-intro`, `.service-page-grid`, `.service-page-card`, `.service-groups`, `.service-group`, `.service-request-card`, `.eligibility-page`, `.eligibility-intro`, `.eligibility-count`.
2. **Bundle Optimization**:
   - Production CSS bundle size reduced from 95.17 kB to 91.39 kB with 0 breaking changes to other role dashboards.

### Files Modified
- `src/styles.css` (Purged obsolete legacy Client Dashboard CSS rules)
- `CHANGES.md` (Updated)

---

## [2026-08-10] - Claim Offer Button Redesign & Service Group Curved Edges

### Overview
Upgraded the **Claim Offer** action buttons in `src/pages/DealsPage.jsx` with primary brand gradients and SVG right arrows, and curved the container edges (`border-radius: 24px`) of `.cd-service-group-section` in `src/ClientDashboard.css`.

### Key Enhancements
1. **Claim Offer Button Redesign (`DealsPage.jsx`)**:
   - Styled **Claim Offer** button (`.cd-req-service-btn`) with primary gradient background (`linear-gradient(135deg, #172135 0%, #4e7cff 100%)`), arrow icon animation, and glowing modal action button (`.cd-submit-btn-glow`).
2. **Service Group Curved Edges (`ClientDashboard.css`)**:
   - Styled `.cd-service-group-section` with 24px curved border radius (`border-radius: var(--cd-radius-lg)`), 28px glass backdrop blur, and 28px inner padding.

### Files Modified
- `src/pages/DealsPage.jsx` (Redesigned Claim Offer button and modal submit action)
- `src/ClientDashboard.css` (Curved edges of `.cd-service-group-section`)
- `CHANGES.md` (Updated)

---

## [2026-08-10] - Account Manager Card Glassmorphic Integration & Nested Box Fix

### Overview
Fixed the nested white rectangle background bug on `.cd-manager-card` by making `.cd-manager-card` transparent and applying rounded glassmorphic fills (`background: rgba(255, 255, 255, 0.5); backdrop-filter: blur(12px); border-radius: 18px;`) to the profile row and sales representative chip.

### Key Enhancements
1. **Nested Box Removal**:
   - Set `background: transparent !important; border: none !important; box-shadow: none !important;` on `.cd-manager-card` to eliminate the stark white inner box.
2. **Glassmorphic Profile Cards**:
   - Styled `.cd-manager-profile-row` and `.cd-sales-rep-chip` with 18px rounded glass panels and soft borders that blend seamlessly into the warm yellow background wallpaper.

### Files Modified
- `src/ClientDashboard.css` (Updated `.cd-manager-card` and `.cd-manager-profile-row` styles)
- `CHANGES.md` (Updated)

---

## [2026-08-10] - Curved Command Header & Account Leadership Widget Refinement

### Overview
Curved the corners of `.cd-header` into a glassmorphic card bar with 24px border radii and restructured `.cd-manager-section` to feature both Enterprise Account Lead (**Kansish**) and Assigned Sales Representative (**Mia Ross**).

### Key Enhancements
1. **Curved Header Card Container (`.cd-header`)**:
   - Styled `.cd-header` with `border-radius: var(--cd-radius-lg);` (24px), glass backdrop blur (`28px`), `16px 28px` padding, and subtle shadow elevation.
2. **Account Leadership Team Card (`.cd-manager-section`)**:
   - Restructured `.cd-manager-card` with clean row alignment displaying Account Lead Kansish (`K`) and Sales Lead Mia Ross (`M`).
   - Styled **Call Manager** and **Contact Leads** action buttons with teal and indigo glow effects.

### Files Modified
- `src/ClientDashboard.jsx` (Restructured `.cd-manager-section` card layout)
- `src/ClientDashboard.css` (Added `border-radius: 24px` to `.cd-header` and added `.cd-sales-rep-chip` styles)
- `CHANGES.md` (Updated)

---

## [2026-08-10] - Vite CSS HMR Reload Fix & Background Property Normalization

### Overview
Resolved Vite dev server HMR 500 error during `/src/ClientDashboard.css` reload by separating shorthand `url(...)` declarations from CSS custom variables into clean `background-image`, `background-size`, `background-position`, and `background-repeat` properties.

### Key Enhancements
1. **Background Property Normalization**:
   - Replaced `background: var(--cd-bg)` shorthand with explicit `background-image`, `background-size`, `background-position`, `background-attachment`, and `background-repeat` rules on `.cd-redesign` and `.cd-hero-banner`.
2. **Clean Dev HMR Resolution**:
   - Eliminates Vite HMR module re-parsing errors during dev server hot module reloading.

### Files Modified
- `src/ClientDashboard.css` (Normalized background image properties for `.cd-redesign` and `.cd-hero-banner`)
- `CHANGES.md` (Updated)

---

## [2026-08-10] - Executive Dashboard Premium & Classy UI Styling Overhaul

### Overview
Overhauled section cards, progress pipeline trackers, active scheme cards, document vault items, and dedicated account manager widgets in `src/ClientDashboard.css` with golden amber accents, 28px glassmorphic backdrop-filter blurs, and hover scale animations.

### Key Enhancements
1. **Glassmorphic Section Cards**:
   - Upgraded `.cd-section-card` with `backdrop-filter: blur(28px) saturate(180%);`, 24px border radii, and elevated glass shadow glows (`box-shadow: var(--cd-shadow)`).
2. **Gold Accent Pill Badges**:
   - Styled `.cd-pill-badge` with champagne gold background tint (`rgba(242, 170, 56, 0.15)`) and bold amber typography (`#d97706`).
3. **Pipeline Progress Tracker**:
   - Expanded SLA tracker ring to 72px width with glowing amber progress nodes (`.cd-pipeline-dot.active`).
4. **Active Scheme Cards & Inspect Action**:
   - Added 4px top multi-color gradient bar (`#d97706` to `#4e7cff` to `#9a74e9`) and styled **Inspect Policy & Benefits** button (`.cd-scheme-btn-outline`) with gradient hover fills.
5. **Manager Support Widget**:
   - Styled Manager Avatar (`K`) with navy/gold gradient, white border ring, and glowing action buttons (`Call` & `Help Desk`).

### Files Modified
- `src/ClientDashboard.css` (Upgraded card borders, progress rings, scheme cards, and manager widget styles)
- `CHANGES.md` (Updated)

---

## [2026-08-10] - Warm Yellow Gradient Background & Glassmorphic Blur Touch Integration

### Overview
Generated a warm golden yellow abstract grainy gradient mesh wallpaper (`public/yellow_gradient_bg.png`) matching the user's reference image style and set it as the fixed background for the entire Client Dashboard with 24px glassmorphic backdrop-filter blurs.

### Key Enhancements
1. **AI Image Generation**:
   - Created `public/yellow_gradient_bg.png` featuring warm golden yellow, champagne gold, creamy ivory gradient mesh, and subtle grainy noise texture.
2. **Dashboard Background Integration**:
   - Configured `.cd-redesign` root container with `background: url('/yellow_gradient_bg.png') center/cover fixed no-repeat !important;`.
3. **Glassy / Blurry Touch**:
   - Applied `backdrop-filter: blur(24px) saturate(180%);` and translucent glass panels (`rgba(255, 255, 255, 0.65)` in light mode, `rgba(15, 23, 42, 0.72)` in dark mode) across header, cards, sidebar, and subpages for a premium glassmorphic feel.

### Files Modified
- `public/yellow_gradient_bg.png` [NEW] (Warm golden yellow grainy gradient mesh artwork)
- `src/ClientDashboard.css` (Configured dashboard background image & glassmorphic backdrop blur panels)
- `CHANGES.md` (Updated)

---

## [2026-08-10] - Hero Banner Font Colors & Contrast Adaptation

### Overview
Updated text font colors, contrast drop shadows, and glassmorphic card themes inside `.cd-hero-banner` in `src/ClientDashboard.css` to perfectly complement the dark executive tech background image.

### Key Enhancements
1. **Title & Subtitle Color Adjustments**:
   - `h2`: Crisp white (`#ffffff`) with subtle text shadow (`0 2px 12px rgba(0, 0, 0, 0.35)`).
   - `em`: Bright electric indigo gradient (`linear-gradient(135deg, #749bff 0%, #c0a2fd 100%)`) with drop shadow glow (`rgba(116, 155, 255, 0.3)`).
   - `p`: Slate gray (`#cbd5e1`) for optimal readability.
2. **Kicker & Status Badges**:
   - `.cd-kicker`: Bright periwinkle text (`#8daeff`) with translucent border (`rgba(141, 174, 255, 0.35)`).
   - `.cd-quick-status-pill`: Bright mint teal text (`#5eead4`) with pulsing teal dot (`#5eead4`).
3. **Metric Ribbon Cards**:
   - Updated `.cd-metric-card` to dark glassmorphic panels (`rgba(15, 23, 42, 0.65)`), crisp white values (`#ffffff`), and slate labels (`#94a3b8`).

### Files Modified
- `src/ClientDashboard.css` (Updated font colors, contrast text shadows, and metric card glass themes)
- `CHANGES.md` (Updated)

---

## [2026-08-10] - Executive Tech Background Image Integration for Hero Banner

### Overview
Generated an abstract modern executive tech artwork (`public/client_hero_bg.png`) and applied it as the background image of `.cd-hero-banner` in `src/ClientDashboard.css` with a high-contrast dark overlay gradient tint.

### Key Enhancements
1. **AI Image Generation**:
   - Generated `public/client_hero_bg.png` featuring deep navy, electric indigo, glowing teal neon accents, and subtle glass grid networks.
2. **Background Image Styling**:
   - Applied `background: linear-gradient(135deg, rgba(23, 33, 53, 0.78) 0%, rgba(15, 23, 42, 0.85) 100%), url('/client_hero_bg.png') center/cover no-repeat;` to `.cd-hero-banner` in `src/ClientDashboard.css`.

### Files Modified
- `public/client_hero_bg.png` [NEW] (Executive tech background artwork)
- `src/ClientDashboard.css` (Configured `.cd-hero-banner` with image background & gradient tint overlay)
- `CHANGES.md` (Updated)

---

## [2026-08-10] - Header Help & Support Button Removal

### Overview
Removed the `Help & Support` icon button (`.cd-help-btn`) from the Client Dashboard command header as requested.

### Key Enhancements
1. **Clean Header Actions**:
   - Removed the shield/help button from header actions in `src/ClientDashboard.jsx`.

### Files Modified
- `src/ClientDashboard.jsx` (Removed `.cd-help-btn` from `.cd-header-actions`)
- `CHANGES.md` (Updated)

---

## [2026-08-10] - Mobile Bottom Navigation Bar & Lower-Side Dock Integration

### Overview
Positioned `.client-sidebar` navigation options at the **lower side / bottom of the screen** (`position: fixed; bottom: 0; left: 0; right: 0; height: 66px; z-index: 9999;`) for mobile and tablet viewports (< 991px).

### Key Enhancements
1. **Fixed Mobile Bottom Navigation Dock**:
   - Styled `.client-sidebar` as a fixed bottom navigation bar with 24px backdrop blur, subtle top border glow, and shadow elevation (`0 -6px 24px rgba(23, 33, 53, 0.18)`).
2. **Tab Items Layout**:
   - Centered navigation items (`Dashboard`, `Eligibility`, `Deals`, `Invoices`, `More Services`) in a horizontal tab row with vertical icon + label stacking (`flex-direction: column; font-size: 10.5px`).
   - Highlighted active selection (`button.selected`) with primary color tint (`rgba(78, 124, 255, 0.12)`).
3. **Viewport Clearance**:
   - Added `padding-bottom: 78px` to `.cd-redesign` to ensure page content is never obscured by the bottom bar.

### Files Modified
- `src/ClientDashboard.css` (Updated `@media screen and (max-width: 991px)` for bottom navigation bar)
- `CHANGES.md` (Updated)

---

## [2026-08-10] - Client Dashboard Responsive Layout & Media Queries Overhaul

### Overview
Added a comprehensive set of CSS media queries across desktop, laptop, tablet, and mobile breakpoints (<1280px, <991px, <768px, <480px) in `src/ClientDashboard.css` to fix all layout clipping, text wrapping, and grid squeezing issues.

### Key Enhancements
1. **Laptop & Tablet Breakpoint Adaptation (< 1280px & < 991px)**:
   - Converted `.cd-main-layout` to a 1-column stack.
   - Converted `.client-sidebar` into a sticky top navigation bar with horizontal scrolling pill items on tablet screens.
2. **Mobile Devices (< 768px)**:
   - Converted command header (`.cd-header`) to vertical stacking with 100% width actions and full-width search input expansion.
   - Reduced hero greeting heading sizes (`24px` on mobile) and adjusted mesh orbs.
   - Converted metric cards (`.cd-metrics-grid`), progress pipeline steps (`.cd-steps-pipeline`), and sub-page scheme grids (`.cd-eligibility-grid`, `.cd-deals-grid`, `.cd-service-items-grid`) to single-column responsive grids.
3. **Mobile Modal & Table Optimization (< 640px & < 480px)**:
   - Constrained modal popups (`.cd-modal-glass`) to `94vw` width with adjusted padding (`24px 20px`).
   - Converted metadata grids (`.cd-scheme-meta-box`) to single-column layouts.

### Files Modified
- `src/ClientDashboard.css` (Added comprehensive `@media` breakpoints for 1280px, 991px, 768px, and 480px)
- `CHANGES.md` (Updated)

---

## [2026-08-10] - Executive Hero Banner & Metric Cards UI Styling Overhaul

### Overview
Overhauled `.cd-hero-banner` styling in `src/ClientDashboard.css` with a 3-color top border gradient glow, multi-layer floating radial mesh orbs, gradient text clipping, and elevated glassmorphic metric cards.

### Key Enhancements
1. **Top Border Gradient Glow**:
   - Added a crisp 3px top border gradient (`linear-gradient(90deg, #4e7cff 0%, #9a74e9 50%, #44bfb0 100%)`).
2. **Multi-Layer Radial Mesh Orbs**:
   - Expanded orb mesh 1 and orb mesh 2 dimensions (420px & 380px) with floating radial gradient blur effects.
3. **Gradient Serif Text Clipping**:
   - Styled `Welcome back, Acme Industries` with a brand gradient text fill (`linear-gradient(135deg, #4e7cff 0%, #9a74e9 100%)`).
4. **Elevated Glassmorphic Metric Cards**:
   - Upgraded `.cd-metric-card` with `backdrop-filter: blur(16px);`, border highlight on hover (`rgba(78, 124, 255, 0.4)`), and hover elevation scale (`translateY(-4px)`).

### Files Modified
- `src/ClientDashboard.css` (Overhauled `.cd-hero-banner`, top border gradient, text clipping, and metric card hover styles)
- `CHANGES.md` (Updated)

---

## [2026-08-10] - Scheme Eligibility Page UI & Matching Engine Overhaul

### Overview
Overhauled `src/pages/EligibilityPage.jsx` into a corporate scheme matching engine with corporate profile compatibility cards, category filter tabs, glowing match score pills, and glassmorphic application modals.

### Key Enhancements
1. **Corporate Compatibility Banner**:
   - Added `98% Corporate Eligibility Index` card with teal accent border and verified profile pill.
2. **Category & Match Tier Filter Tabs**:
   - Filter pill buttons (`All Schemes`, `Top Match 95%+`, `Health & Wellness`, `Commercial & Leadership`) for one-click scheme filtering.
3. **Rich 3D Scheme Cards**:
   - Added glowing match score pills (`98% Match`, `95% Match`) with pulsing status dots.
   - Highlighted max coverage limits and starting premiums in styled meta grids.
   - Redesigned **"Apply For Scheme"** primary action button (`.cd-req-service-btn`) with right arrow SVG icon and brand gradient elevation.
4. **Glassmorphic Application Modal**:
   - Glassmorphic popover (`.cd-modal-glass`) displaying pre-qualified benefits list, assigned sales lead (`Mia Ross`), and primary action submit button (`.cd-submit-btn-glow`).

### Files Modified
- `src/pages/EligibilityPage.jsx` (Rebuilt into Scheme Matching Engine)
- `src/ClientDashboard.css` (Added compatibility card, match glow, and cover amount styles)
- `CHANGES.md` (Updated)

---

## [2026-08-10] - Service Request & Application Dispatch Routing to Assigned Sales Lead

### Overview
Updated all service request modals and scheme application flows across the Client Dashboard to explicitly dispatch requests and notifications to the client's assigned Sales Representative (`Mia Ross`, Senior Sales Lead).

### Key Enhancements
1. **New Service Request Modal (`src/ClientDashboard.jsx`)**:
   - Explicitly displays assigned sales lead metadata (`Mia Ross, Senior Sales Lead`).
   - Confirmation notification banner: `Request sent to your assigned sales lead, Mia Ross! She will contact you within 2 business hours.`
2. **Services Marketplace (`src/pages/MoreServicesPage.jsx`)**:
   - Meta box displays assigned sales lead `Mia Ross (Senior Lead)`.
   - Submit button & success alert route request directly to `Mia Ross`.
3. **Scheme Eligibility Page (`src/pages/EligibilityPage.jsx`)**:
   - Scheme application modal routes directly to assigned sales lead `Mia Ross`.

### Files Modified
- `src/ClientDashboard.jsx` (Updated New Request modal routing)
- `src/pages/MoreServicesPage.jsx` (Updated service request wizard routing)
- `src/pages/EligibilityPage.jsx` (Updated scheme application modal routing)
- `CHANGES.md` (Updated)

---

## [2026-08-10] - Hero Banner Removal & Request Service Button & Modal Popups Redesign

### Overview
Removed the `TAILORED ENTERPRISE SLA` banner from `src/pages/MoreServicesPage.jsx` and overhauled the styling of **Request Service** buttons and glassmorphic modal popups.

### Key Enhancements
1. **Hero Banner Removal**:
   - Removed `<div className="cd-services-hero-banner">` section as requested.
2. **Request Service Button Redesign**:
   - Styled `.cd-req-service-btn` with primary gradient background (`linear-gradient(135deg, #172135 0%, #4e7cff 100%)`), smooth hover elevation (`translateY(-2px)`), box shadow glow, and animated right arrow SVG icon.
3. **Glassmorphic Modal Popup Redesign**:
   - Upgraded `.cd-modal-glass` with 28px backdrop blur, rounded corners (24px), glowing top category pills, estimate meta boxes, focus ring inputs, and primary action submit button (`.cd-submit-btn-glow`).

### Files Modified
- `src/pages/MoreServicesPage.jsx` (Removed SLA banner, updated buttons and modal structure)
- `src/ClientDashboard.css` (Added `.cd-req-service-btn`, `.cd-modal-glass`, and focus ring styles)
- `CHANGES.md` (Updated)

---

## [2026-08-10] - More Services Marketplace Hub & SLA Hero Banner UI Overhaul

### Overview
Overhauled `src/pages/MoreServicesPage.jsx` into a high-converting corporate services marketplace with interactive category filter tabs, bespoke SLA hero banner, turnaround time indicators, and priority SLA wizard modal.

### Key Enhancements
1. **Interactive Category Filter Tabs**:
   - Added pill tabs (`All Categories`, `Certificate & Licensing`, `IT & Security`, `Marketing & Growth`, `Legal & Compliance`) for instant category filtering.
2. **Enterprise SLA Hero Banner**:
   - Built a glowing gradient mesh banner promoting custom corporate SLA packages and bespoke proposals.
3. **Rich Glassmorphic Service Cards**:
   - Added 3D gradient icon headers, turnaround pills (`Same-Day Activation`, `24-48 Hours`), pricing estimate bars, and feature checklist chips.
4. **Enhanced Priority SLA Request Wizard Modal**:
   - Added turnaround priority selection (`Urgent 24 Hours SLA`, `Standard 3-5 Days`, `Flexible Schedule`).

### Files Modified
- `src/pages/MoreServicesPage.jsx` (Rebuilt into Services Marketplace Hub)
- `src/ClientDashboard.css` (Added hero banner, filter tabs, turnaround pills, and card layout styles)
- `CHANGES.md` (Updated)

---

## [2026-08-10] - Client Dashboard Header Search Button & Real-time Filter Fix

### Overview
Fixed the search button and input field in the Client Dashboard header to support smooth toggle expansion, real-time live filtering, and quick search resetting.

### Key Enhancements
1. **Real-time Live Filtering**:
   - Updated `onChange` handler to update both `schemeQuery` and `submittedQuery` instantly as the user types, filtering schemes and tags immediately.
2. **Smooth Expanding Search Bar & Close Button**:
   - Styled `.cd-search-field` with smooth CSS expansion animation, active royal blue border highlight, and box shadow.
   - Added `.cd-search-close-btn` ("×") allowing users to clear search queries and collapse the search bar in one click.

### Files Modified
- `src/ClientDashboard.jsx` (Updated search button JSX & real-time query state handler)
- `src/ClientDashboard.css` (Added search expansion animation and close button styling)
- `CHANGES.md` (Updated)

---

## [2026-08-10] - Instant Invoice File Download & Receipt Generation

### Overview
Updated `src/pages/InvoicesPage.jsx` to allow clients to instantly download official invoice files and payment receipts directly from the table and inspection modals.

### Key Enhancements
1. **Direct Table & Modal Download Actions**:
   - Added a **"Download"** button on every invoice table row.
   - Added **"Download Official Invoice File"** inside the invoice inspection modal.
2. **Dynamic Client-Side File Generation**:
   - Created `triggerDownload(inv, isPaid)` function that generates an official invoice text file (`INV-2026-091_AgniCRM_Invoice.txt`) containing client ID, service details, tax calculations (18% GST), total amount, issue/due dates, and payment status.
3. **Download Confirmation Alerts**:
   - Added live success feedback banner: `Downloaded official invoice receipt for INV-2026-091!`.

### Files Modified
- `src/pages/InvoicesPage.jsx` (Integrated file download functionality)
- `CHANGES.md` (Updated)

---

## [2026-08-10] - Offer Claim Sales Representative Notification Trigger

### Overview
Updated `src/pages/DealsPage.jsx` so that clicking **"Claim Offer"** triggers an instant notification alert directly to the client's assigned Sales Representative (`Mia Ross`, `Noah Kim`, or `Kansish`).

### Key Enhancements
1. **Direct Sales Rep Notification**:
   - Integrated notification modal and action handler: "Claiming this offer will immediately notify your assigned sales lead, Mia Ross (Senior Sales Lead), to apply this special pricing."
2. **Real-time Status Alert**:
   - Added live success alert banner: `Notification sent to Mia Ross (Senior Sales Lead) for "Corporate Health Shield". They will get in touch shortly.`
   - Updated offer card state to: `✓ Notification Sent to Mia Ross`.

### Files Modified
- `src/pages/DealsPage.jsx` (Wired sales rep notification trigger)
- `CHANGES.md` (Updated)

---

## [2026-08-10] - Deals Page Transformed to Company Service Offers & Discounts

### Overview
Updated `src/pages/DealsPage.jsx` so that the **Deals** section explicitly displays exclusive promotional offers, service discounts, and bundle packages created by AgniCRM for the client.

### Key Enhancements
1. **Service Offers Showcase**:
   - Rebuilt cards to feature promotional discount badges (`25% OFF`, `SAVE ₹35,000`, `15% CASHBACK`, `FREE SETUP`).
   - Displayed original price strikethroughs alongside discounted offer rates.
   - Added validity expiration dates and promo codes (`HEALTH25`, `CYBERSEC35`, `GROWTH15`, `FREEMUDRA`).
2. **Interactive Redemption & Claiming**:
   - Added "Claim Offer" modal with instant confirmation feedback and promo code issuance.
3. **Offers Metric Ribbon**:
   - Metrics for Active Offers (`4 Available`), Max Savings (`Up to ₹1.2L`), Deal of the Month (`Health Shield`), and Expiring Soon (`1 Deal ending`).

### Files Modified
- `src/pages/DealsPage.jsx` (Transformed to Service Offers & Discounts)
- `CHANGES.md` (Updated)

---

## [2026-08-10] - Client Dashboard Sub-Pages UI Harmonization & Overhaul

### Overview
Modernized all sub-pages inside the **Client Dashboard** navigation (`Eligibility`, `Deals`, `Invoices`, `More Services`) to match the new glassmorphic design language, typography, and color system (`#172135` Navy, `#4e7cff` Royal Blue, `#9a74e9` Violet, `#44bfb0` Mint Teal, `#f2aa38` Gold).

### Detailed Sub-Page Enhancements
1. **Scheme Eligibility Page (`src/pages/EligibilityPage.jsx`)**:
   - Modernized intro header with match badges (`98% Profile Match`).
   - Glassmorphic scheme cards with max coverage metrics, starting premiums, feature chips, and an interactive application modal.
2. **Deals & Proposals Page (`src/pages/DealsPage.jsx`) [NEW]**:
   - Built client-facing deals overview with metric ribbon (Total Proposals, Under Negotiation, Pipeline Value `₹48.5L`, Approved Contracts).
   - Interactive proposal cards displaying deal stage (`Proposal Sent`, `In Negotiation`, `Approved & Signed`), proposal values, assigned sales reps, and inspection modals.
3. **Invoices & Billing Page (`src/pages/InvoicesPage.jsx`) [NEW]**:
   - Built financial summary ribbon (Paid YTD `₹3,07,000`, Pending Balance `₹42,000`, Total Invoices, Next Billing Date).
   - Filterable invoice table listing invoice IDs (`INV-2026-091`), issue dates, due dates, amounts, status pills (`Paid` teal, `Pending` amber), and receipt download / instant payment modal.
4. **Expanded Services Hub (`src/pages/MoreServicesPage.jsx`)**:
   - Categorized service tiles for Certificate & Licensing, IT & Security, Marketing & Growth, and Compliance.
   - Glassmorphic service cards with tone-colored icon badges and service request modal.
5. **View Router Integration (`src/ClientDashboard.jsx`)**:
   - Integrated `DealsPage` and `InvoicesPage` into the Client Dashboard view router.

### Files Modified
- `src/pages/EligibilityPage.jsx` (Redesigned)
- `src/pages/DealsPage.jsx` (Created)
- `src/pages/InvoicesPage.jsx` (Created)
- `src/pages/MoreServicesPage.jsx` (Redesigned)
- `src/ClientDashboard.jsx` (Integrated activeNav view router)
- `src/ClientDashboard.css` (Added sub-page glassmorphic styles, cards, tables, and modals)
- `CHANGES.md` (Updated)

---

## [2026-08-10] - Fixed Layout Grid Restoration & Clean Sticky Sidebar

### Overview
Fixed element displacement by restoring the CSS Grid container structure (`display: grid; grid-template-columns: 250px 1fr; align-items: start;`) and configuring clean, non-displacing sticky sidebar positioning (`position: sticky; top: 0; height: 100vh; align-self: start; overflow-y: auto;`).

### Detailed Fixes
1. **Restored Grid Flow & Alignment**:
   - Restored `display: grid; grid-template-columns: 250px 1fr; align-items: start;` in `src/ClientDashboard.css` to prevent layout collapse.
   - Removed element displacement caused by fixed position viewport removal.
2. **Sticky Sidebar Positioning**:
   - Updated `.client-sidebar` in `src/styles.css` with `position: sticky; top: 0; height: 100vh; align-self: start; overflow-y: auto; z-index: 100;`.
   - Sidebar remains locked in position during page scrolling without altering element alignment or displacing dashboard components.

### Files Modified
- `src/styles.css` (Updated `.client-sidebar` with sticky grid alignment)
- `src/ClientDashboard.css` (Restored grid layout and removed padding displacement)
- `CHANGES.md` (Updated)

---

## [2026-08-10] - Complete Brand New Client Dashboard Rebuild

### Overview
Completely removed and rebuilt the entire **Client Dashboard** page from scratch. Created an ultra-modern, high-converting enterprise dashboard built with glassmorphic cards, ambient glowing mesh gradients, visual coverage analytics charts, an interactive 5-stage progress pipeline, document vault, and account manager support desk widgets.

### Comprehensive Architectural Additions
1. **Translucent Command Header Navigation**:
   - Company Avatar ("AI") with green online status dot.
   - Client ID & submeta badges (`ID: CLI-2026-8942` • `Enterprise Client` • `Manager: Kansish`).
   - Central formatted live date pill (`Mon, 10 Aug 2026`).
   - Quick action triggers: **`+ New Request`** primary action button & **`Help`** support button.
   - Expandable instant search bar.
   - Tabbed notification center popover (`All`, `Alerts`, `Payments`) with clear unread interaction.
   - Enriched profile drawer popover with user card and live light/dark mode switch.

2. **Hero Ambient Banner & Executive Metrics Ribbon**:
   - Floating mesh gradient orb background animations (`#4e7cff` & `#9a74e9`).
   - Personalized time-aware greeting ("Welcome back, Acme Industries").
   - Live account status pill with pulsing green indicator.
   - 4 Executive Metric Widgets:
     - **Active Coverage**: `₹5.0 Cr` (Shield icon)
     - **Active Services**: `4 Plans` (Briefcase icon)
     - **Compliance Score**: `94%` (File icon)
     - **Next Renewal**: `14 Jun 2027` (Clock icon)

3. **Visual Service Utilization Analytics Chart**:
   - Custom SVG area & line chart displaying service usage trends, claim counts, and 99.4% SLA score across quarters.

4. **Live Application Progress Pipeline Tracker**:
   - Interactive 5-stage progress pipeline (`Submission` ➔ `Doc Audit` ➔ `Manager Review` ➔ `Agreement` ➔ `Final Approval`).
   - SVG percentage progress ring meter (`60%`).

5. **Active Coverage Portfolio & Schemes Grid**:
   - 3D-styled cards with gradient accent top-glows for `Corporate Health Shield`, `Enterprise IT Infra Shield`, `Brand Growth Suite`, and `Mudra Export Certification`.
   - Inspection modal with detailed policy numbers, start dates, renewal dates, and annual premiums.

6. **Compliance Document Vault**:
   - Interactive document checklist widget displaying verified vs. pending document statuses with direct action triggers.

7. **Dedicated Account Manager Support Widget**:
   - Contact card for lead manager (`Kansish`), featuring call and email support desk triggers.

8. **Interactive Modals**:
   - Policy Details Inspection Modal.
   - New Service Request Wizard Modal (with instant submission feedback).
   - Dedicated Support Desk Desk Modal.
   - Password Update Modal.

### Color Palette Integration
- Applied primary AgniCRM brand color system: Deep Navy (`#172135`), Royal Blue (`#4e7cff`), Violet (`#9a74e9`), Mint Teal (`#44bfb0`), and Warm Amber (`#f2aa38`).

### Files Modified
- `src/ClientDashboard.jsx` (Completely Rebuilt)
- `src/ClientDashboard.css` (Completely Rebuilt)
- `CHANGES.md` (Updated)

---

## [2026-08-10] - Client Dashboard Header Elaboration & Expansion

### Overview
Elaborated and enriched the **Client Dashboard Header** with expanded company metadata pills, quick action buttons, tabbed notification center, live date indicator, and interactive service request & support modals.

### Detailed Header Enhancements
1. **Client Identity & Sub-Metadata**:
   - Added active online status indicator dot on the client avatar.
   - Added metadata badges: Client ID (`CLI-2026-8942`), Tier (`Enterprise`), and Account Manager (`Manager: Kansish`).
2. **Live Date Pill**:
   - Added a formatted date badge (`Mon, 10 Aug 2026`) in the center of the header.
3. **Header Quick Actions**:
   - Added **`+ New Request`** primary action button in the header, launching an interactive service request modal.
   - Added **`Help & Support`** icon button in the header, launching a dedicated account manager support desk overlay.
4. **Tabbed Notification Center**:
   - Upgraded notification popover to feature filter tabs (`All`, `Alerts`, `Payments`).
   - Added interactive **"Clear all"** action to reset unread badge counts.
5. **Enriched Profile Drawer**:
   - Added user profile identity header (`Devika Shah`, `contact@acme.com`).
   - Integrated quick Dark Mode toggle switch directly inside the profile drawer.

### Files Modified
- `src/ClientDashboard.jsx`
- `src/ClientDashboard.css`
- `CHANGES.md`

---

## [2026-08-10] - Client Dashboard UI & Layout Redesign

### Overview
Harmonized the Client Dashboard layout, typography, and color palette with the primary AgniCRM design system used across Owner, Manager, and Sales dashboards.

### Files Modified
- `src/ClientDashboard.css`
- `src/ClientDashboard.jsx`
- `CHANGES.md` (Created)
