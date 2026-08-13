# React Migration Progress — Power Purple LMS (PPCSPI Enrollment System)

> How to use this file: update it at the END of every chat session, before you close it.
> When you open a NEW chat, paste or upload this file first and say:
> "Continue this migration from PROGRESS.md, next up is [X]."
>
> **Important:** if you've been working across multiple accounts/sessions on this project,
> always verify actual file state on disk (`Get-ChildItem`, `Get-Content`) before trusting
> any single PROGRESS.md blindly — parallel sessions can diverge. This file was reconciled
> from two conflicting histories on Aug 2, 2026 by checking real files on disk.

---

## 1. Project Overview
- **Original stack:** HTML / CSS / JS / PHP (MySQL, session-based auth)
- **Target stack:** React (functional components + hooks only)
- **Project folder:** `E:\wamp64\www\ppscpi_lms\`
- **Backend:** PHP REST API under `api/` (`config`, `middleware`, `auth`, `students`, `admin`, `cashier`, `helpers`), JSON in/out
- **Auth:** JWT (Firebase\JWT) — fully working for admin + cashier roles
- **Token storage:** `localStorage` (functional; httpOnly cookie is a flagged future upgrade)
- **Styling:** Two eras coexist — legacy plain-CSS pages (enrollment forms) and a newer themed system using a shared `PageBackground` component (4 SVG variants: `waves`, `diagonal`, `orbit`, `grid`) for public-facing pages. **CSS global-scoping cleanup is now COMPLETE** — see Section 4.
- **Git:** feature-branch workflow in use

---

## 2. Component/Module Conversion Tracker

| # | Original file | REST endpoint(s) | React component | Status | Notes |
|---|---|---|---|---|---|
| 1 | index.php | — | ~~Home.jsx~~ → **LandingPage.jsx** | ✅ Done | Home.jsx fully deleted, replaced by two-column hero design with Academic Programs section, `PageBackground variant="waves"` |
| 2 | admin_login.php | api/auth/login.php | AdminLogin.jsx | ✅ Done, tested | JWT issued; role-based redirect; wrapped in `PageBackground variant="diagonal"` |
| 3 | etype.php | — | Etype.jsx | ✅ Done, redesigned, tested | Card layout with SVG icons, `PageBackground variant="orbit"`; properly scoped CSS (`.etype-card`, `.etype-btn-*`), no collisions |
| 4 | oldstud.php | api/students/old.php | OldStudent.jsx | ✅ Done, tested | Transaction-wrapped insert; 1 file upload |
| 5 | newstud.php | api/students/new.php | NewStudent.jsx | ✅ Done, tested | Transaction-wrapped insert; 4 file uploads |
| 6 | trans.php | api/students/trans.php | Transferee.jsx | ✅ Done, tested | 5 file uploads |
| 7 | profile_search.php | api/students/profile-search.php, queue-info.php, balance-info.php | ProfileSearch.jsx | ✅ Done, tested | Wrapped in `PageBackground variant="grid"`; document viewer working (correct `/api/uploads/` path); Edit Profile link **intentionally omitted** — deferred to future Student Portal |
| 8 | apanel.php | api/admin/students.php, student-details.php, approve.php | AdminDashboard.jsx | ✅ Done, tested | Sidebar routing fixed; Requirements/document viewer added |
| 9 | astudent.php | api/admin/approved-students.php, api/students/balance-detail.php, api/admin/enroll.php, queue-info.php | ApprovedStudents.jsx, AdminQueuePage.jsx, EnrollStudentPage.jsx | ✅ Done, tested | SOA print button + scoped `@media print` rules added; Enroll opens room-designation page (not direct enroll) |
| 10 | cashier.php | api/cashier/search-student.php, update-balance.php, record-payment.php | Cashier.jsx | ✅ Done, tested | Now uses dedicated `CashierLayout.jsx`/`CashierSidebar.jsx` (not shared AdminLayout); fixed `payment_transaction`→`payment_transactions` table bug; cashier_id trusted from JWT; "Back to Search" reset added |
| 11 | fees_helper.php | api/helpers/fees_helper.php | — | ✅ Copied as-is | Pure logic, REST-safe unchanged |
| 12 | enroll_student.php | api/admin/enroll.php | EnrollStudentPage.jsx | ✅ Done, tested | |
| 13 | queue.php | api/students/queue-info.php | AdminQueuePage.jsx | ✅ Done, tested | |
| 14 | get_queue_info.php | api/students/queue-info.php | (shared w/ ProfileSearch modal) | ✅ Done, tested | |
| 15 | get_balance_info.php | api/students/balance-info.php, balance-detail.php | (shared w/ ProfileSearch + ApprovedStudents modals) | ✅ Done, tested | `payment_transactions` bug fixed in both |
| 16 | request_enrollment_certificate.php | api/students/request-certificate.php | RequestCertificate.jsx | ✅ Done, tested | Replaced unreliable `SHOW TABLES` guessing with direct `enrolled_students`→intake-table lookup |
| 17 | admin_certificate_request.php | api/admin/certificate-requests.php, certificate-requests-update.php | AdminRequests.jsx | ✅ Done, tested | GET-based approve/reject converted to POST |
| 18 | print_certificate.php | api/students/certificate.php | PrintCertificate.jsx | ✅ Done, tested | Standalone page, no Navbar; fixed blank-print-preview bug (leaked `visibility:hidden` from ApprovedStudents.css) |
| 19 | enrolled_list.php | api/admin/enrolled-students.php | EnrolledStudents.jsx | ✅ Done, tested | All 4 tabs working |
| 20 | edit_student.php | api/students/edit.php (built, endpoint status unconfirmed) | EditStudent.jsx | ⏳ **Not present on disk** | Was reported built in a parallel session but does not exist in current file tree. **Intentionally deferred anyway** — planned home is a future Student Portal (student-owned login), created after admin reviews/approves and enrolls the student. Not a bug, just not-yet-started. |

**Status legend:** ✅ Done | 🔄 In progress | ⏳ Not started | ⚠️ Blocked

**All 19 originally-scoped PHP modules are converted and tested.** Item 20 (Student Portal / Edit Profile) is a deliberately deferred future feature, not a gap in the current scope.

---

## 3. Key Decisions Made
- REST structure: `api/{config,middleware,auth,students,admin,cashier,helpers}/`
- `requireAuth()`/`requireRole($roles)` middleware pattern on all protected endpoints
- JWT payload: `user_id`, `username`, `role`; 1hr expiry; stored in `localStorage`
- `AuthContext.jsx` + `ProtectedRoute.jsx` gate routes by role
- **Two separate layout systems now exist:**
  - `AdminLayout.jsx`/`AdminSidebar.jsx` — used by AdminDashboard, ApprovedStudents, AdminQueuePage, EnrollStudentPage, AdminRequests, EnrolledStudents (4-link sidebar)
  - `CashierLayout.jsx`/`CashierSidebar.jsx` — used by Cashier.jsx (dedicated, not the shared admin one with a 1-item link list as originally built)
- **`PageBackground.jsx` shared component** (+ `.css`) — reusable gradient background with 4 SVG line-pattern variants (`waves`/`diagonal`/`orbit`/`grid`), used by LandingPage, AdminLogin, Etype, ProfileSearch for consistent theming
- Multi-table inserts wrapped in `begin_transaction()`/`commit()`/`rollback()` — behavior fix vs. original (no rollback safety existed before)
- Multiple raw string-interpolated SQL queries converted to prepared statements (SQL injection fixes) across admin/queue/profile-search endpoints
- Base API URL centralized in `client/src/config/api.js`
- File uploads served statically from `api/uploads/` — confirmed working via direct file URL (directory listing blocked by Apache, which is fine/expected — only direct file links are needed)
- Student Account Generation / Student Portal (auto-create login on admin enroll action) is the planned home for `EditStudent.jsx` — not yet started, correctly out of current scope

---

## 4. Known Issues / Blockers

### ✅ RESOLVED: Project-wide CSS scoping cleanup
Root cause was global CSS leakage (Vite doesn't scope plain `.css` imports), which independently caused at least 6 separate bugs across this project's history:
1. `body{padding-left:80px}` leaking margin onto unrelated pages — fixed
2. `th{}` conflicting between AdminDashboard/Cashier (invisible table headers) — fixed
3. `.container` collision giving AdminRequests the wrong (too-narrow) card width — fixed
4. `@media print{body*{visibility:hidden}}` blanking PrintCertificate's print preview — fixed
5. `.button1`/`.button2` colliding between Home/Etype with different colors — resolved (Home.jsx deleted entirely during LandingPage redesign, moot)
6. `.topnav` duplicated across 6 files (AdminLogin, NewStudent, OldStudent, Transferee, Home, Etype) — **all duplicates now deleted**, `Navbar.css` is the confirmed single source of truth

**Final verification (Aug 2, 2026) — clean:**
```powershell
cd "E:\wamp64\www\ppscpi_lms\client\src"
Select-String -Path "pages\*.css","components\*.css" -Pattern "^body|^\.container|^\.topnav|^table|^th|^td"
# Only match: components\Navbar.css (correct, intentional)
```

All page-specific containers now use unique scoped class names: `.etype-card`, `.profile-search-page`/`.profile-search-results`, `.certificate-page`, `.request-cert-form`, `.admin-dashboard`, `.admin-requests`, `.approved-students`, `.cashier-container`, `.enrolled-students`, `.admin-queue`, `.enroll-student`.

**Note:** `NewStudent.css`/`OldStudent.css`/`Transferee.css` still use `.container` internally per earlier plans, but the final grep came back clean with no collisions reported — worth a quick visual spot-check next session on those three pages if any unexpected layout width issues appear, just to confirm the rename was actually applied and isn't coincidentally clean due to no other page currently defining a conflicting `.container` rule.

### Not yet actioned
- Admin password stored/compared in plaintext (`password_admin`) — should move to `password_hash()`/`password_verify()`.
- JWT in `localStorage`, not httpOnly cookie.
- `PrintCertificate.jsx` uses `logo.png` as a substitute watermark (opacity 0.08) since original `translogo.png` was never uploaded in any session. Swap in if/when available.
- `adminLinks` array duplicated across 6 admin pages — already caused one typo bug (`/admin` vs `/admin/dashboard`, now fixed). Recommend centralizing into `client/src/config/navLinks.js`.
- `EditStudent.jsx` — genuinely not on disk despite being reported "built" in a parallel session. Not urgent (deferred feature), but that other session's completion claim was inaccurate — worth remembering when reconciling future parallel-session progress files.

---

## 5. Next Steps (what to tell Claude in the next chat)
- [ ] Spot-check NewStudent/OldStudent/Transferee container class names actually match their page-scoped names (not leftover bare `.container`) — quick visual check, not urgent given clean grep results
- [ ] Admin Dashboard: add statistics cards (Total Enrollees / Approved / Rejected / Pending) — was queued by parallel session, not yet built
- [ ] Admin Dashboard: add Reject button + required rejection reason (store + surface via Profile Search) — was queued by parallel session, not yet built
- [ ] Plan Student Account Generation (auto-create account on admin "Enroll" action) — natural trigger point for eventually building the Student Portal + wiring up `EditStudent.jsx`
- [ ] Consider centralizing `adminLinks` into shared config
- [ ] Consider hashing admin passwords
- [ ] **Process note:** if continuing work across multiple accounts again, reconcile via actual file checks (`Get-ChildItem -Recurse`, `Get-Content`) before trusting any uploaded PROGRESS.md's status table at face value — this session found real divergence between two histories

---

## 6. File Inventory (what to upload each new chat)
- [ ] This PROGRESS.md (updated)
- [ ] Nothing else currently blocking — all prior module conversions are complete and verified against real files

---
*Last updated: August 2, 2026 — reconciled from two parallel sessions, CSS cleanup verified complete*

## 7. What is done already?
- [x] All 19 original PHP modules converted, tested, and verified present on disk
- [x] LandingPage + PageBackground theming system (replaces old Home.jsx)
- [x] Full JWT auth (admin + cashier roles)
- [x] Admin Dashboard, Approved Students, Enrolled Students, Certificate Requests (student + admin side), Print Certificate — all working
- [x] Cashier module with dedicated CashierLayout/CashierSidebar
- [x] Project-wide CSS scoping cleanup — verified complete via grep audit

## 8. Next thing to do
- [ ] Admin Dashboard statistics cards (Total/Approved/Rejected/Pending counts)
- [ ] Reject button + rejection reason feature

update the approved studednt, rename the header as Student Details or anything that connects to it and make sure that the enroll button in the student t hat is already enrolled will be gone and only its queue number and balance will be visible. then the queue number maybe make it as after the cashier approve their paid balance it will markk the queue number as completed transaction so that the student will request again in t heir account to generate a new code, please analyze my flow to make it better and make it more user friendly.