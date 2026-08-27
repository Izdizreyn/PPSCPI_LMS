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
| 17 | admin_certificate_request.php | api/admin/certificate-requests.php, certificate-requests-update.php | AdminRequests.jsx | ✅ Done, tested | |
| 18 | print_certificate.php | api/students/certificate.php | PrintCertificate.jsx | ✅ Done, tested | Currently uses `logo.png` as watermark substitute — see Section 4, now resolvable since `translogo.png` has arrived |
| 19 | enrolled_list.php | api/admin/enrolled-students.php | EnrolledStudents.jsx | ✅ Done, tested | Print UX fixed: search bar hidden from print, print button added to all 4 tabs, only active tab prints |
| 20 | edit_student.php | — | EditStudent.jsx | ⏳ Not present on disk | Intentionally deferred — home is the future Student Portal |

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

### Implemented — "View Balance" moved from in-page modal to dedicated print page
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
- [x] **Register the balance route:** `<Route path="/admin/print-balance" element={<PrintBalance />} />` is registered in `App.jsx`.
- [ ] **Verify `balance-detail.php` response shape** matches what `PrintBalance.jsx` expects (`balance`, `transactions`, `fee_breakdown`, `student_name`) — adjust destructuring if field names differ.
- [ ] Test the new `PrintBalance.jsx` flow end to end: open from "View Balance" link, confirm data loads, confirm watermark renders on screen AND in print preview.
- [ ] Test cashier dashboard, Student Search, queue status, and live dashboards end to end: migrate `enrollment_schedule.status` to allow `Used`, verify auto-update after partial or full payment, and confirm both queue screens and history in the browser. The payment API temporarily falls back to legacy `Settled` and dashboards normalize it to `USED`.
- [ ] Resolve or reconfirm the AdminSidebar rendering bug.
- [ ] Fix mangled emoji in `AdminSidebar.jsx`.
- [ ] Optional cleanup: swap `PrintCertificate.jsx`'s watermark from `logo.png` to the now-available `translogo.png`.
- [x] Admin Dashboard: overview cards and shortcuts for applicants, approved students, live queue, enrolled students, and certificate requests.
- [ ] Test the new admin overview cards and `/admin/applicants` review route in the browser.
- [ ] Admin Dashboard: Reject button + required rejection reason.
- [ ] Next queue lifecycle feature: after an approved student account is created, allow the student to request another queue number whenever the previous number is `Used`; retain every number in `enrollment_schedule` history and show it in admin live queue details.
- [ ] Student Account Generation: auto-create login credentials when admin enrollment data is approved/enrolled, with secure password hashing and a student login flow.
- [ ] Consider centralizing `adminLinks`; consider hashing admin passwords.

---

## 6. File Inventory (what to upload each new chat)
- [ ] This PROGRESS.md (updated)
- [ ] If AdminSidebar bug persists: screenshot + DevTools output
- [ ] If `PrintBalance.jsx` testing surfaces issues: screenshot + `balance-detail.php` actual JSON response shape

---
*Last updated: August 2026 — Admin overview and applicant approval route are available; cashier dashboard/search/queue separation, editable multi-fee partial payments, immediate one-use `Used` queue transitions, matching live queue dashboards, styled date-only queue history, and print exclusions are implemented; browser/database end-to-end testing remains pending.*

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

## 8. Next thing to do
- [ ] Test admin overview and `/admin/applicants` approval workflow in the browser
- [ ] Verify the cashier one-use `Active` to `Used` transition after partial or full SOA payment, including rejection when no unused queue remains
- [ ] Test both live queue dashboards and per-student queue history against the database
- [ ] Implement student login/account creation after enrollment approval
- [ ] Implement student request-again queue number flow after a queue number is `Used`
- [ ] Test the `PrintBalance.jsx` flow end to end (data + watermark)
- [ ] Resolve AdminSidebar rendering bug (open/unconfirmed)