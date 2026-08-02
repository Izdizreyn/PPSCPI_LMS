# React Migration Progress — Power Purple LMS (PPCSPI Enrollment System)

> How to use this file: update it at the END of every chat session, before you close it.
> When you open a NEW chat, paste or upload this file first and say:
> "Continue this migration from PROGRESS.md, next up is [X]."

---

## 1. Project Overview
- **Original stack:** HTML / CSS / JS / PHP (MySQL, session-based auth)
- **Target stack:** React (functional components + hooks only)
- **Backend plan:** PHP restructured as REST API (`api/` folder — `api/auth`, `api/config`, `api/middleware`, `api/students`), JSON in/out, no mixed HTML/PHP output
- **Auth:** JWT (Firebase\JWT), replacing PHP sessions. Token storage decision (httpOnly cookie vs localStorage) — **not yet confirmed**, flag before building React auth context.
- **State management:** useState/useContext (AuthContext for auth state)
- **Styling approach:** Plain CSS per component, scoped class names (audit in progress — see Section 4). Shared `PageBackground` component now handles the purple gradient + line-pattern theme across public-facing pages.

---

## 2. Component/Module Conversion Tracker

| # | Original file (PHP/HTML/JS) | REST API endpoint | React component | Status | Notes |
|---|------------------------------|--------------------|------------------|--------|-------|
| 1 | admin_login.php | api/auth/login.php | AdminLogin.jsx | ✅ Done | JWT issued on success; now wrapped in `PageBackground variant="diagonal"` |
| 2 | etype.php | — (static routing page) | Etype.jsx | ✅ Done, redesigned | Rebuilt as centered white card (title/subtitle/stacked buttons) matching new mockup; wrapped in `PageBackground variant="orbit"` |
| 3 | oldstud.php | api/students/old.php | OldStudent.jsx | ✅ Done, tested | Transaction-wrapped insert (info/address/parent/req) |
| 4 | newstud.php | api/students/new.php | NewStudent.jsx | ✅ Done, tested | Transaction-wrapped insert; requires 4 file uploads; card class fixed (`.container` → `.new-student-form`) |
| 5 | trans.php | api/students/transferee.php | Transferee.jsx | ✅ Done, tested (per user, 2026-07-28) | REST API file still not shared/reviewed in chat |
| 6 | apanel.php (admin dashboard) | — | AdminDashboard.jsx | ⏳ Not started | Includes approve-student flow + queue number generation |
| 7 | astudent.php (approved students) | — | ApprovedStudents.jsx | ⏳ Not started | Depends on fees_helper.php balance logic |
| 8 | cashier.php | — | Cashier.jsx | ✅ Done | Fee breakdown, payment recording |
| 9 | enrolled_list.php | — | EnrolledList.jsx | ⏳ Not started | |
| 10 | admin_certificate_request.php | — | CertificateRequests.jsx | ⏳ Not started | |
| 11 | profile_search.php | api/students/profile-search.php, queue-info.php, balance-info.php | ProfileSearch.jsx | ✅ Done | Edit Profile link **intentionally removed** — editing now deferred to future Student Portal (own login). Wrapped in `PageBackground variant="grid"`. |
| 12 | edit_student.php | api/students/edit.php | EditStudent.jsx | ✅ Built, **not linked** | Kept for future use inside Student Portal once student accounts exist; currently orphaned (no route links to it) |
| 13 | index.php (home) | — | ~~home.jsx~~ → LandingPage.jsx | ✅ Replaced | Old Staff/Enrollee button page fully replaced by LandingPage (see Section 3) |

**Status legend:** ✅ Done | 🔄 In progress | ⏳ Not started | ⚠️ Blocked

---

## 3. Key Decisions Made
- Backend organized under `api/` with `config/` (cors.php, database.php, jwt.php), `middleware/` (auth.php), `auth/` (login.php), `students/` (new.php, old.php, edit.php, profile-search.php, queue-info.php, balance-info.php)
- JWT issued via `generateJWT()`, verified via `requireAuth()` / `requireRole()` in `auth.php`
- CORS locked to `http://localhost:5173` (Vite dev server) with credentials allowed
- Student REST endpoints wrap multi-table inserts (info/address/parent/requirements) in `$conn->begin_transaction()` / `commit()` / `rollback()`
- Duplicate LRN check done via prepared statement before insert
- File uploads still handled via `$_FILES` + `move_uploaded_file()`, stored relative path in DB (same as legacy)
- **Edit Student Profile removed from public Student Search flow** — will only be exposed later inside the student's own portal after account generation on enrollment approval (per Section 8 of PROGRESS_UPDATED notes)
- **New landing page (`LandingPage.jsx`) built and mounted at `/`**, replacing `home.jsx`/`Home.css`:
  - Two-column hero: mission/philosophy text (left) + Staff/Enrollee action buttons (right)
  - Purple gradient background (teal → indigo → magenta) with SVG wave-line pattern, matching brand reference image
  - School title colored `#df65d9`
  - Academic Programs section below the fold (Pre-School, Elementary, Junior High, Senior High — each sectioned A/B), scroll-hint indicator added
- **Shared `PageBackground` component created** (`client/src/components/PageBackground.jsx` + `.css`) — reusable purple-gradient background with 4 SVG line-pattern variants (`waves`, `diagonal`, `orbit`, `grid`) so every page doesn't duplicate the gradient/line CSS:
  - `LandingPage` → `waves`
  - `AdminLogin` → `diagonal`
  - `Etype` → `orbit`
  - `ProfileSearch` → `grid`
- **Etype.jsx redesigned** to match approved mockup: centered white card with title/subtitle and full-width stacked buttons (with inline SVG icons) instead of the old inline-block button row

---

## 4. Known Issues / Blockers
- `payment_transaction` (singular) vs `payment_transactions` (plural) table name mismatch — legacy `profile_search.php` and `get_balance_info.php` reference `payment_transaction`, but the actual schema table is `payment_transactions`. Needs fixing when cashier/balance modules are converted. **(Verify this was accounted for in the new `profile-search.php`/`balance-info.php` REST endpoints.)**
- Admin password stored/compared in plaintext (`password_admin`) — should move to `password_hash()`/`password_verify()` before going further with auth hardening.
- JWT token storage strategy (httpOnly cookie vs localStorage) not yet confirmed with user.
- Transferee REST API (`api/students/transferee.php`) not yet reviewed in chat — need the actual file to verify it matches the new.php/old.php pattern.
- **CSS scoping audit still in progress** — recurring bug pattern this session: className typos (leading dot inside string, e.g. `className=".new-student-form"`) and duplicate/malformed component files (e.g. `PageBackground..jsx` — empty, double-dot filename) caused import/render failures. Worth a project-wide sanity pass on all `className=` values and a check for stray duplicate files before next session.
- `EditStudent.jsx` / `edit.php` currently unreachable from the UI — intentional for now, but flag before final deployment so it isn't just dead code long-term.

---

## 5. Next Steps (what to tell Claude in the next chat)
- [ ] Upload/confirm `api/students/transferee.php` (REST version) for review
- [ ] Decide JWT storage approach (cookie vs localStorage) before building auth context/hooks further
- [ ] Start converting `apanel.php` (admin dashboard) → REST API + React, including:
  - [ ] Dashboard statistics cards (Total Enrollees / Approved / Rejected / Pending)
  - [ ] Reject button + required rejection reason (store + surface via Profile Search)
- [ ] Fix `payment_transaction`/`payment_transactions` naming mismatch if not already resolved
- [ ] Apply `PageBackground` to remaining public pages once built (e.g. Request Certificate page) for visual consistency
- [ ] Plan Student Account Generation (auto-create account on admin "Enroll" action) — this is the natural home for `EditStudent.jsx` going forward
- [ ] Project-wide className/import sanity check per Known Issues above

---

## 6. File Inventory (what to upload each new chat)
- [ ] Latest exported React code (zip or individual .jsx files)
- [ ] This PROGRESS.md (updated)
- [ ] `api/students/transferee.php` (for review/confirmation)
- [ ] Any original PHP files still being referenced/converted

---
*Last updated: August 2, 2026 — end of chat session*

## 7. What is done already?
- [x] Landing Page (LandingPage.jsx/css) — replaces Home
- [x] Shared PageBackground component (4 variants)
- [x] Etype — redesigned to card layout
- [x] OldStudent — tested
- [x] NewStudent — tested, card style bug fixed
- [x] Transferee — tested (confirmed by user)
- [x] Login / JWT backend built (api/auth/login.php, jwt.php, auth.php, cors.php, database.php)
- [x] AdminLogin — themed with PageBackground
- [x] Cashier — built (fee breakdown, payment recording)
- [x] ProfileSearch — built, Edit Profile link removed, themed with PageBackground
- [x] EditStudent — built but intentionally unlinked (future Student Portal use)

## 8. Next thing to do
- [ ] Confirm/upload Transferee REST API file for review
- [ ] Start Admin Dashboard (apanel.php) conversion — stats cards first
- [ ] Reject button + rejection reason feature