# PPSCPI LMS Changes Handoff

This document summarizes the changes made to the PPSCPI LMS during this work
session. It is intended to provide context to another AI assistant or developer.

## Summary

### Public navigation

- Removed **Search Student** and **Request** from the shared public navbar.
- Normalized navbar imports to match the actual lowercase filename
  (`components/navbar.jsx`). This fixed Vite loading a stale, differently cased
  module path.
- Removed the React Profile Search page and its frontend route. The PHP
  `api/students/profile-search.php` endpoint was not removed.
- Kept the Home, Staff Login, Student Enroll, and Student Login links.

### Document-request approval SMS

- The admin endpoint for student document requests now sends an SMS after
  approval using the shared SMS helper and a phone number found by student LRN.
- The endpoint returns whether SMS sending succeeded and the gateway result.
- The Admin Requests screen displays the send result or the reason the SMS was
  not sent.
- Rejecting a document request does not send an SMS.

### Student dashboard and profile

- The dashboard retrieves the student’s enrollment form data, including
  personal/contact details, address, guardian details, enrollment type, and
  academic placement.
- The student’s enrollment 2x2 photo appears beside the welcome heading.
- A newer 2x2 photo uploaded through Student Documents takes precedence over the
  enrollment photo. The private upload is fetched through an authenticated API.
- Added a student profile-edit page and API. Profile edits update the matching
  enrollment intake records and create a timestamped activity entry.
- Added a **Recent Activity** section to the dashboard. It lists recent profile
  edits and document upload/replacement actions with timestamps.

### Student document uploads

- Added a **My Documents** page and student sidebar link.
- Students choose a document category before uploading. Categories include
  2x2 ID Photo, Birth Certificate, Report Card, Form 137, Certificate of Good
  Morale, Certificate of Enrollment, Transcript of Records, and Other Document.
- Uploading another document in a category replaces the previous student
  upload in that category.
- Accepted formats are PDF, JPEG, and PNG, with a 10 MB maximum. The 2x2 ID
  Photo category accepts JPEG and PNG only.
- Enrollment documents and student uploads are combined under one
  **Uploaded Documents** heading. A new upload replaces the enrollment file of
  the same category in this combined list.
- Documents use a **View document** action rather than a Download button.
  Private uploads are served inline only after the API verifies the signed-in
  student owns them.

### Admin applicant details

- Applicant details now include student uploads found by matching the intake
  record’s LRN to the student account.
- Staff can view these uploads through a staff-authenticated API endpoint.
- The Student Uploaded Documents list uses the same link/list presentation as
  the existing Requirements list. Enrollment-submitted files remain separate
  from the new private student upload storage.

## Relevant Files

### Public navbar and routes

- `client/src/components/navbar.jsx`
- `client/src/pages/LandingPage.jsx`
- `client/src/pages/AdminLogin.jsx`
- `client/src/pages/Etype.jsx`
- `client/src/pages/NewStudent.jsx`
- `client/src/pages/OldStudent.jsx`
- `client/src/pages/Transferee.jsx`
- `client/src/pages/StudentLogin.jsx`
- `client/src/App.jsx`
- Deleted: `client/src/pages/ProfileSearch.jsx`
- Deleted: `client/src/pages/ProfileSearch.css`

### Document-request SMS

- `api/admin/document-requests-update.php`
- `api/helpers/sms_helper.php`
- `client/src/pages/AdminRequests.jsx`

### Student profile and dashboard

- `api/students/my-profile.php`
- `api/students/update-profile.php`
- `api/students/my-activity.php`
- `client/src/pages/StudentDashboard.jsx`
- `client/src/pages/StudentDashboard.css`
- `client/src/pages/StudentProfileEdit.jsx`
- `client/src/pages/StudentProfileEdit.css`
- `client/src/components/StudentSidebar.jsx`

### Student documents and storage

- `api/students/my-documents.php`
- `api/migration.php`
- `api/private_uploads/.htaccess`
- `client/src/pages/StudentDocuments.jsx`
- `client/src/pages/StudentDocuments.css`

### Admin applicant uploads

- `api/admin/student-details.php`
- `api/admin/student-document.php`
- `client/src/pages/AdminDashboard.jsx`
- `client/src/pages/AdminDashboard.css`

## Data and API Notes

- The enrollment form records its original fields and files in the intake tables
  (`new_student_*`, `old_student_*`, and `transferee_*`).
- Additional student-uploaded files are stored separately in
  `student_documents`, associated with `students.id_student` and a document
  category. Stored files live under `api/private_uploads/student-documents/`;
  they are not public enrollment uploads.
- Student activity is stored in `student_activity`, associated with
  `students.id_student`.
- `api/migration.php` creates the document/activity tables and adds the
  document category column/index where needed. It was run successfully against
  the local database during implementation.
- Student document and profile endpoints require an authenticated
  `purple_student` token. Admin applicant document viewing requires an
  authenticated `purple_admin` token.
- Upload replacement removes the old student-upload row/file for the same
  student and category after the new upload is saved. The original enrollment
  file remains in its intake table.

## Suggested Files to Upload to Another AI

Only upload the files relevant to the question. Do not upload credentials,
database contents, or files from `api/private_uploads/`.

### Minimal context: student photo or dashboard issue

- `client/src/pages/StudentDashboard.jsx`
- `api/students/my-profile.php`
- `client/src/pages/StudentDashboard.css`

### Minimal context: student upload/replacement or viewing issue

- `client/src/pages/StudentDocuments.jsx`
- `client/src/pages/StudentDocuments.css`
- `api/students/my-documents.php`
- `api/migration.php`

### Minimal context: student profile editing or activity history

- `client/src/pages/StudentProfileEdit.jsx`
- `client/src/pages/StudentProfileEdit.css`
- `client/src/pages/StudentDashboard.jsx`
- `api/students/update-profile.php`
- `api/students/my-activity.php`
- `api/migration.php`

### Minimal context: applicant details and student-uploaded files

- `client/src/pages/AdminDashboard.jsx`
- `client/src/pages/AdminDashboard.css`
- `api/admin/student-details.php`
- `api/admin/student-document.php`
- `api/students/my-documents.php`

### Minimal context: document approval SMS

- `api/admin/document-requests-update.php`
- `api/helpers/sms_helper.php`
- `client/src/pages/AdminRequests.jsx`

### Full feature context

For a broad review of the student profile/documents feature, upload all files
under **Student profile and dashboard**, **Student documents and storage**, and
**Admin applicant uploads** above, plus `api/middleware/auth.php` if the
question concerns authorization.

## Validation Performed

- Frontend production builds passed after the changes.
- ESLint passed for the student dashboard/profile/document pages. The admin
  dashboard has two existing hook dependency warnings.
- PHP syntax checks passed for the added/updated profile, activity, upload,
  migration, and admin document endpoints.
- The migration and expected database tables/columns were verified locally.
- Unauthenticated requests to student APIs returned HTTP 401.
- A live end-to-end upload and external SMS gateway delivery were not tested.

