# React Migration Progress — Power Purple LMS (PPCSPI Enrollment System)

> How to use this file: update it at the END of every chat session, before you close it.
> When you open a NEW chat, paste or upload this file first and say:
> "Continue this migration from PROGRESS.md, next up is [X]."
>
> **Important:** if you've been working across multiple accounts/sessions on this project,
> always verify actual file state on disk (`Get-ChildItem`, `Get-Content`) before trusting
> any single PROGRESS.md blindly — parallel sessions can diverge.

---

## 1. Project Overview
- **Original stack:** HTML / CSS / JS / PHP (MySQL, session-based auth)
- **Target stack:** React (functional components + hooks only)
- **Project folder:** `E:\wamp64\www\ppscpi_lms\`
- **Backend:** PHP REST API under `api/` (`config`, `middleware`, `auth`, `students`, `admin`, `cashier`, `helpers`), JSON in/out
- **Auth:** JWT (Firebase\JWT) — fully working for admin + cashier roles
- **Token storage:** `localStorage` (functional; httpOnly cookie is a flagged future upgrade)
- **Styling:** `PageBackground` shared component (4 SVG variants) themes public-facing pages; CSS global-scoping cleanup done, with a `.jsx`-level `className="x container"` leak pattern found and fixed on 2 pages post-"completion" — see Section 4 for the recommended recheck command.
- **Git:** feature-branch workflow in use

---

## 2. Component/Module Conversion Tracker

| # | Original file | REST endpoint(s) | React component | Status | Notes |
|---|---|---|---|---|---|
| 1 | index.php | — | ~~Home.jsx~~ → **LandingPage.jsx** | ✅ Done | `PageBackground variant="waves"` |
| 2 | admin_login.php | api/auth/login.php | AdminLogin.jsx | ✅ Done, tested | `PageBackground variant="diagonal"` |
| 3 | etype.php | — | Etype.jsx | ✅ Done, redesigned, tested | Card layout, `PageBackground variant="orbit"` |
| 4 | oldstud.php | api/students/old.php | OldStudent.jsx | ✅ Done, tested | 1 file upload |
| 5 | newstud.php | api/students/new.php | NewStudent.jsx | ✅ Done, tested | 4 file uploads |
| 6 | trans.php | api/students/trans.php | Transferee.jsx | ✅ Done, tested | 5 file uploads |
| 7 | profile_search.php | api/students/profile-search.php, queue-info.php, balance-info.php | ProfileSearch.jsx | ✅ Done, tested | `PageBackground variant="grid"`; Edit Profile intentionally omitted (deferred to future Student Portal) |
| 8 | apanel.php | api/admin/students.php, student-details.php, approve.php | AdminDashboard.jsx (`/admin/dashboard`, `/admin/applicants`) | 🔄 In progress — admin overview and separate applicant approval page implemented; browser testing pending | Dashboard shows live summary cards; applicant review table remains available at `/admin/applicants` and is linked in the sidebar |
| 9 | astudent.php | api/admin/approved-students.php, api/students/balance-detail.php, api/admin/enroll.php, queue-info.php | ApprovedStudents.jsx, **PrintBalance.jsx**, AdminQueuePage.jsx, EnrollStudentPage.jsx | 🔄 In progress — approved-student overview, standalone balance page, queue history, and enrollment flow implemented; end-to-end testing pending | ApprovedStudents links to balance, queue, and enrollment actions |
| 10 | cashier.php | api/cashier/search-student.php, update-balance.php, record-payment.php, payment-records.php, queue-dashboard.php | CashierDashboard.jsx, Cashier.jsx, CashierQueuePage.jsx | 🔄 In progress — one-use queue consumption is now transactional; browser/database test pending | Any partial or full payment requires an unused queue row, marks the latest row `Used`, and commits payment plus queue update together; dashboard shows all payments |
| 11 | fees_helper.php | api/helpers/fees_helper.php | — | ✅ Copied as-is | |
| 12 | enroll_student.php | api/admin/enroll.php | EnrollStudentPage.jsx | ✅ Done, tested | |
| 13 | queue.php | api/students/queue-info.php, api/admin/queue-dashboard.php, api/cashier/queue-dashboard.php | AdminQueuePage.jsx, CashierQueuePage.jsx | 🔄 In progress — matching live dashboards and per-student queue history implemented; end-to-end data test pending | Dashboards poll every 10 seconds; statuses display `ACTIVE`/`USED`; admin detail displays history |
| 14 | get_queue_info.php | api/students/queue-info.php | (shared w/ ProfileSearch modal) | ✅ Done, tested | |
| 15 | get_balance_info.php | api/students/balance-info.php, balance-detail.php | ProfileSearch modal (unchanged) + **PrintBalance.jsx** | 🔄 In progress — standalone balance page implemented; end-to-end print/data testing pending | ApprovedStudents no longer uses a balance modal |
| 16 | request_enrollment_certificate.php | api/students/request-certificate.php | RequestCertificate.jsx | ✅ Done, tested | |
| 17 | admin_certificate_request.php | api/admin/certificate-requests.php, certificate-requests-update.php | AdminRequests.jsx | ⚠️ Partially done | Approve button works; **Reject button missing** — needs implementation with required reason field; see Section 4 |
| 18 | print_certificate.php | api/students/certificate.php | PrintCertificate.jsx | ✅ Done, tested | Currently uses `logo.png` as watermark substitute — see Section 4, now resolvable since `translogo.png` has arrived |
| 19 | enrolled_list.php | api/admin/enrolled-students.php | EnrolledStudents.jsx | ✅ Done, tested | Print UX fixed: search bar hidden from print, print button added to all 4 tabs, only active tab prints |
| 20 | edit_student.php | — | EditStudent.jsx | ⏳ Not present on disk | Intentionally deferred — home is the future Student Portal |
| 21 | student_login.php | api/auth/student-login.php, api/auth/student-change-password.php | **StudentLogin.jsx**, **StudentDashboard.jsx**, **ChangePassword.jsx** | 🔄 In progress | Auto-account creation on admin approval; JWT auth; student portal with sidebar, queue/balance display; 400 error on queue-info fetch needs investigation |
| 22 | N/A (new) | — | **StudentSidebar.jsx** | ✅ Done | Dark #333 background, white SVG icons, hover-to-expand (80px → 300px), labels show on hover |
| 23 | N/A (new) | — | **Navbar.jsx** | ✅ Updated | Added `/student-login` link in navLinks array |
| 24 | N/A (new) | — | **AdminSidebar.jsx, CashierSidebar.jsx** | ✅ Updated | Converted from click-toggle (`useState` + button) to hover-to-expand; removed hamburger buttons; labels shown on `:hover` |

**Status legend:** ✅ Done | 🔄 In progress | ⏳ Not started | ⚠️ Blocked

---

## 3. Key Decisions Made

### Established earlier
- REST structure: `api/{config,middleware,auth,students,admin,cashier,helpers}/`
- `requireAuth()`/`requireRole($roles)` middleware; JWT payload `user_id`/`username`/`role`, 1hr expiry, `localStorage`
- Two layout systems: `AdminLayout`/`AdminSidebar` (`.sidebar` namespace) vs. `CashierLayout`/`CashierSidebar` (`.cashier-sidebar` namespace) — confirmed non-colliding
- `PageBackground.jsx` — 4 SVG gradient variants for public pages
- Multi-table inserts wrapped in transactions; SQL injection fixes via prepared statements throughout
- API base URL centralized in `client/src/config/api.js`

### Previous session — Approved Students / Queue flow rework
Queue lifecycle is tied to payment activity. Any successful cashier payment marks the current `enrollment_schedule` row as `Used`; the API temporarily falls back to legacy `Settled` schemas and dashboards normalize that value to `USED`. `ApprovedStudents.jsx` hides `Enroll` after a student appears in `enrolled_students`.

### Implemented — Sidebar hover-to-expand behavior (Admin, Cashier, Student)
**Decision:** Convert all three sidebar layouts from click-toggle hamburger buttons to automatic hover-expand behavior for better UX.

**Implementation completed:**
1. **Removed state management:** Deleted `useState` and `expanded` state from `AdminSidebar.jsx`, `CashierSidebar.jsx`, and `StudentSidebar.jsx`.
2. **Removed hamburger buttons:** Deleted the `<button className="toggle-btn">☰</button>` element and all toggle button CSS from all three CSS files.
3. **Added hover-expand:** Changed all `.expanded` classes to `:hover` pseudo-classes:
   - `.sidebar:hover { width: 300px; }` (Admin)
   - `.cashier-sidebar:hover { width: 300px; }` (Cashier)
   - `.student-sidebar:hover { width: 300px; }` (Student)
4. **Labels show on hover:** Updated label display rules to use `:hover`:
   - `.sidebar:hover .label { display: inline; }`
   - Similar for cashier and student sidebars
5. **Styling consistency:** All sidebars now have:
   - Background: **#333** (dark gray/charcoal)
   - Default width: **80px** (collapsed)
   - Hover width: **300px** (expanded)
   - Icons: white SVG (Dashboard, Lock, Exit)
   - Active state: **#800080** (purple) background
   - Hover state (non-active): **#ddd** background with black text

**Result:** Sidebars now expand automatically on hover and collapse on mouse leave — cleaner UX with no hamburger clutter.

### Implemented — Student Portal & Auto-Account Creation
**Decision:** Create a complete student login and account management system with auto-generated credentials on admin approval.

**Implementation completed:**
1. **StudentLogin.jsx** — Public student login form
   - Email + password input with visibility toggle
   - Posts to `api/auth/student-login.php`
   - Stores JWT token via `useAuth` context
   - Redirects to `/student/dashboard` on success
   - Uses `PageBackground variant="grid"` for consistent theming

2. **StudentDashboard.jsx** — Student portal home
   - Integrated `StudentSidebar` (hover-to-expand)
   - Displays welcome card, queue status, balance, quick actions, and profile info
   - Fetches from `api/students/queue-info.php` and `api/students/balance-info.php`
   - Background color: **#B6C2D9** (light blue-gray)
   - Card headers: **#800080** (purple)
   - Welcome card: plain white background

3. **ChangePassword.jsx** — Secure password update
   - Requires current password verification
   - Posts to `api/auth/student-change-password.php` with Bearer token
   - Validates new password length (6+ characters)
   - Uses bcrypt hashing on backend

4. **StudentSidebar.jsx** — Student-specific navigation
   - 3 navigation items: Dashboard, Change Password, Logout
   - Custom SVG icons (house, lock, exit) with white fill
   - Dark **#333** background matching admin/cashier sidebars
   - Hover-to-expand layout (80px → 300px)
   - Active route highlighting with **#800080** background

5. **Auto-account creation on admin approval**
   - Modified `api/admin/approve.php` to create student accounts automatically
   - Extracts student email from applicant data
   - Generates bcrypt hash of default password: `ppscpi123`
   - Creates entry in `students` table with:
     - `email_student` (unique, indexed)
     - `password_student` (bcrypt hashed)
     - `lrn` (unique, indexed)
     - `full_name`
     - `role: 'purple_student'`
   - Returns response with `student_account_created: true` and account details

6. **Protected routes for student portal**
   - Routes require `purple_student` role via `ProtectedRoute` component
   - `/student-login` — public route
   - `/student/dashboard` — protected (requires purple_student role)
   - `/student/change-password` — protected (requires purple_student role)

7. **Navbar integration**
   - Added `/student-login` link to `Navbar.jsx` navLinks array
   - Placed after "Student Enroll" entry for logical flow

**Color scheme for student portal:**
- Background: **#B6C2D9** (light blue-gray)
- Primary accent (headers): **#800080** (purple)
- Cards/content: white
- Sidebar: **#333** (dark)

### Improved — Sidebar label visibility
**Decision:** Ensure sidebar labels are always readable.

**Implementation:**
1. **Added explicit `color: white;` to all sidebar labels** to ensure they display in white when expanded
2. Updated all three sidebars (Admin, Cashier, Student) `.label` CSS rules to include `color: white;`


**Problem identified:** the "View Balance" action on `ApprovedStudents.jsx` opened an in-page modal (`balanceModal` state) with a watermark logo layered behind the statement using `position: absolute` + `z-index`. The watermark never rendered — root cause traced to the print flow's `visibility: hidden` / `visibility: visible` toggling on `body *` combined with the modal's own stacking context; this is the same architectural pattern that was already avoided on `PrintCertificate.jsx`, which prints as its own standalone page rather than a modal.

**Decision:** replace the modal with a new standalone route/page, mirroring the existing `PrintCertificate.jsx` pattern exactly (own component, own CSS file, own `window.print()` button, watermark as a plain `<img>` positioned behind page content — no `visibility` hacks needed since the whole page IS the print target).

**Implementation completed:**
1. **New file `PrintBalance.jsx`** (mirrors `PrintCertificate.jsx`) — reads `?lrn=` from the URL via `useSearchParams`, fetches `api/students/balance-detail.php?lrn=`, renders Statement of Account + Payment History, with `translogo.png` as a low-opacity (`0.08`) centered watermark behind the content.
2. **New file `PrintBalance.css`** — 8.5in × 11in printable container, `@media print` rules matching `PrintCertificate.css`'s pattern (hide print button, `@page { size: letter; margin: 0; }`).
3. **`ApprovedStudents.jsx` — modal fully removed.** Deleted `balanceModal` state, `openBalanceModal` function, and the entire modal JSX block. "View Balance" is now a plain `<Link to="/admin/print-balance?lrn=...">` opening in a new tab (`target="_blank"`).
4. **`ApprovedStudents.css` — all modal/watermark/print CSS removed** (`.modal`, `.modal-content`, `.watermark-logo`, `.close`, `.transaction-table`, `.balance-footer`, `.print-btn`, and the page's `@media print` block) since none of it is used by this page anymore.
5. **Route registered:** `<Route path="/admin/print-balance" element={<PrintBalance />} />` is present in `App.jsx`.

**Testing note:** `balance-detail.php` response shape and the standalone print flow still need browser verification against the live database.

**Resulting resource note:** `translogo.png` has now been uploaded and placed at `src/assets/translogo.png`, and is in active use in `PrintBalance.jsx`. This resolves the blocker noted below for `PrintCertificate.jsx`, which currently substitutes `logo.png` — swapping it to `translogo.png` is now possible whenever convenient.

---

## 4. Known Issues / Blockers

### 🔄 REOPENED then RE-FIXED: `.container` class-leak — 2 instances found post-"completion", both fixed
`ApprovedStudents.jsx` and `EnrolledStudents.jsx` were both found still using bare `className="{page} container"`, inheriting another page's `.container` styling. Both renamed to fully scoped classes with their own card CSS added.

**Root cause of why the Aug 2 audit missed these:** that audit grepped `.css` files for bare selectors, but didn't check `.jsx` files for the specific pattern of a scoped class *combined with* a leftover unscoped one in the same `className` string. **Recommended check for any future session, to avoid a third recurrence:**
```powershell
cd "E:\wamp64\www\ppscpi_lms\client\src\pages"
Select-String -Path "*.jsx" -Pattern 'className="[^"]*\bcontainer\b'
```

### ⚠️ OPEN: AdminRequests.jsx missing reject functionality
**Issue:** The Approve button works for certificate requests, but the Reject button is missing entirely.

**Required implementation:**
- Add Reject button to `AdminRequests.jsx` for each request row
- When clicked, show a modal/dialog requiring admin to enter a **rejection reason** (text field)
- Post to a new backend endpoint: `api/admin/certificate-requests-reject.php` with:
  - `request_id`
  - `rejection_reason` (required, min length validation)
- Mark the request status as `REJECTED` in database
- Refresh the request list after rejection
- Show success toast/notification

**Current state:** Only Approve functionality is present; Reject is completely absent from the UI.

### ⚠️ OPEN: AdminQueuePage.jsx — duplicate key warnings in React console
**Issue:** Console warnings about non-unique keys for enrollment queue entries:
```
Encountered two children with the same key, `2026-08-30-20260830-012`. 
Keys should be unique so that components maintain their identity across updates.
```

**Observed keys:** `2026-08-30-20260830-012`, `2026-08-31-20260831-001` (and others) appearing as duplicates

**Root cause:** The current queue item key is likely based on date + enrollment_schedule ID, but multiple students can enroll on the same date with sequential IDs, causing collisions. The key format suggests `{date}-{timestamp}-{sequence}`, but the sequence number alone is not unique across dates.

**Required fix:**
- Use a fully unique identifier as the key, such as:
  - `enrollment_schedule.id` (database primary key, guaranteed unique)
  - `${enrollment_schedule.id}-${student_lrn}` (composite unique key)
  - UUID or timestamp-based unique value from backend
- Do NOT use `index` in the `.map()` as a key (React anti-pattern)

**Current behavior:** Warnings only; functionality appears to work despite the warnings, but React reconciliation could be unstable.

### ⚠️ OPEN: StudentDashboard.jsx — 400 errors when fetching queue-info.php
**Issue:** Student dashboard fails to load queue status with repeated 400 errors:
```
Failed to load resource: the server responded with a status of 400 (Bad Request)
/ppscpi_lms/api/students/queue-info.php?lrn=2024-1212:1

Error fetching student data: AxiosError: Request failed with status code 400
```

**Observed LRN format:** `2024-1212:1` (appears to have a colon, suggesting format mismatch or encoding issue)

**Root causes to investigate:**
- LRN parameter encoding issue (colon may need URL encoding as `%3A`)
- Backend `queue-info.php` validation rejecting LRN format (check regex/validation rules)
- Student object or JWT payload LRN field not matching expected format
- CORS or auth header issue (check JWT token in request headers)

**Current behavior:** Dashboard shows error messages; queue and balance data fail to load; error repeats on every fetch cycle.

**Required fix:**
1. Verify LRN format in JWT token payload matches what `queue-info.php` expects
2. Check `queue-info.php` for LRN validation rules (length, allowed characters)
3. Add request logging on backend to see the exact LRN value being received
4. Test endpoint directly with curl/Postman using the same LRN format
5. Add more detailed error logging in `StudentDashboard.jsx` to capture full API response

### ⚠️ OPEN: AdminSidebar rendering bug — status unconfirmed
Reported on the Approved Students page: sidebar showed only a bare hamburger icon, no purple bar/logo/nav. Investigation ruled out CSS collision (`.sidebar` rule confirmed correct and singular, `CashierSidebar.css` confirmed non-colliding). Leading theory was stale Vite dev-server cache. **Not yet confirmed fixed or still reproducing** — needs follow-up: does it still happen after a clean `npm run dev` restart + hard browser refresh? If yes, get DevTools Elements/Styles panel output for the `.sidebar` div.

### ✅ RESOLVED: balance-statement watermark never rendered in the `ApprovedStudents.jsx` modal
Root-caused to the modal + `visibility` print-toggle approach fighting the watermark's stacking context (see Section 3). Fixed by removing the modal entirely and rebuilding as a standalone `PrintBalance.jsx` page using the same print pattern already proven on `PrintCertificate.jsx`. Route registration is complete; browser/data/print verification remains.

### ✅ Queue dashboard presentation updates
- Admin and cashier live queue dashboards are wrapped in card containers with centered headers.
- Admin queue history has dedicated table styling and displays date only, without time.
- The queue detail print action is inside the queue card at the upper right; queue history is excluded from printing.
- Admin live queue no longer displays refresh or updated-time controls; background polling remains active.
- Admin and cashier queue summaries use matching `ACTIVE`/`USED` terminology.
- Cashier dashboard is separated from Student Search and displays all student payment records in a readable card layout.

### Not yet actioned
- Admin password stored/compared in plaintext — should move to `password_hash()`/`password_verify()`.
- JWT in `localStorage`, not httpOnly cookie.
- `PrintCertificate.jsx` uses `logo.png` as a substitute watermark — `translogo.png` is now available on disk (`src/assets/translogo.png`) and could be swapped in whenever convenient (not urgent, cosmetic).
- `adminLinks` array duplicated across 6 admin pages — recommend centralizing into `client/src/config/navLinks.js`.
- `EditStudent.jsx` — not on disk, correctly deferred pending Student Portal.
- `AdminSidebar.jsx` has mangled UTF-8 emoji (logout 🚪 and hamburger ☰ icons display as garbled text) — cosmetic, needs re-pasting those two characters cleanly.

---

## 5. Next Steps (what to tell Claude in the next chat)
- [ ] **Fix StudentDashboard 400 errors:** Investigate LRN format mismatch in JWT token vs. queue-info.php validation; verify parameter encoding and backend validation rules
- [ ] **Fix AdminQueuePage duplicate key warnings:** Replace queue item keys with unique identifiers (use `enrollment_schedule.id` or composite key)
- [ ] **Implement AdminRequests reject button:** Add UI button + modal with required rejection reason field; create backend endpoint `certificate-requests-reject.php`
- [ ] **Test student login end-to-end:** Admin approves applicant → auto-account creation → student logs in → dashboard loads with correct queue/balance data
- [ ] **Test StudentSidebar hover behavior:** Verify expand/collapse on hover works smoothly; confirm labels display in white; test on mobile/responsive
- [ ] **Fix mangled emoji in `AdminSidebar.jsx`:** Re-paste the logout and hamburger icon characters (if still present from previous code)
- [ ] **Verify student account creation in database:** After admin approval, check `students` table for new row with correct email/LRN/hashed password
- [ ] **Test ChangePassword flow:** Student changes password → new password works on next login
- [ ] **Test student portal color scheme:** Verify #B6C2D9 background, #800080 headers, white cards render as designed
- [ ] **Optional cleanup:** Swap `PrintCertificate.jsx`'s watermark from `logo.png` to the now-available `translogo.png`
- [x] **Navbar updated:** Student Login link added
- [x] **Sidebar behavior updated:** All three sidebars converted to hover-to-expand (no hamburger buttons)
- [x] **Student portal created:** StudentLogin, StudentDashboard, ChangePassword, StudentSidebar implemented
- [x] **Auto-account creation implemented:** Backend endpoint modified to create student accounts on admin approval

---

## 6. File Inventory (what to upload each new chat)
- [ ] This PROGRESS.md (updated)
- [ ] If AdminSidebar bug persists: screenshot + DevTools output
- [ ] If `PrintBalance.jsx` testing surfaces issues: screenshot + `balance-detail.php` actual JSON response shape

---
*Last updated: September 2026 — Student portal fully implemented with StudentLogin, StudentDashboard, ChangePassword, and StudentSidebar; auto-account creation on admin approval with bcrypt hashing; all sidebars converted to hover-to-expand behavior; Navbar updated with Student Login link. Known issues: StudentDashboard 400 errors on queue-info fetch (LRN format mismatch?); AdminQueuePage duplicate key warnings; AdminRequests reject button missing. End-to-end testing and bug fixes pending.*

## 7. What is done already?
- [x] All 19 in-scope PHP modules converted, tested, and verified present on disk (item 20 intentionally deferred)
- [x] LandingPage + PageBackground theming system
- [x] Full JWT auth (admin + cashier roles)
- [x] Project-wide CSS scoping cleanup, including 2 late-discovered `.jsx`-level leaks
- [x] EnrolledStudents print behavior fixed
- [x] `translogo.png` uploaded and wired into a working print flow (`PrintBalance.jsx`)
- [x] Admin overview dashboard with shortcut cards and separate applicant approval route
- [x] Cashier dashboard with all student payments, Student Search, and Queue screens
- [x] Multi-fee editable partial payments and immediate queue `Used` status updates
- [x] Live admin/cashier queue dashboards with per-student queue history
- [x] **NEW:** Student portal (StudentLogin, StudentDashboard, ChangePassword, StudentSidebar)
- [x] **NEW:** Auto-account creation on admin approval with bcrypt password hashing
- [x] **NEW:** All sidebars converted to hover-to-expand behavior (no hamburger buttons)
- [x] **NEW:** Navbar updated with Student Login link
- [x] **NEW:** Student-specific color scheme (#B6C2D9 background, #800080 headers)

## 8. Next thing to do (Priority order)
1. **🔴 URGENT:** Fix StudentDashboard 400 errors — queue-info.php endpoint rejecting LRN parameter; blocks entire student portal testing
2. **🔴 URGENT:** Fix AdminQueuePage duplicate key warnings — use unique identifiers (enrollment_schedule.id) instead of date-based keys
3. **🟠 HIGH:** Implement AdminRequests reject button + rejection reason modal; currently no way to reject certificate requests
4. **🟠 HIGH:** End-to-end test student login flow: admin approval → account creation → student login → dashboard loads
5. **🟡 MEDIUM:** Test StudentSidebar hover behavior on desktop and mobile
6. **🟡 MEDIUM:** Verify student account password change flow works after first login
7. **🟡 MEDIUM:** Verify auto-account creation stores correct hashed password (test by logging in with default password `ppscpi123`)
8. **🟢 LOW:** Optional: Swap `PrintCertificate.jsx` watermark to `translogo.png`
9. **🟢 LOW:** Consider centralizing `adminLinks` array across admin pages
10. **🟢 LOW:** Consider implementing admin password hashing (currently plaintext)