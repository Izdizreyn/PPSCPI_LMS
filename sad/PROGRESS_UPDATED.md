# Progress Update

---

# Completed Features

## Enrollment Portal ✅

The Enrollment Portal has been completed.

### Completed Features

- ✅ Online pre-enrollment form
- ✅ Digital submission of personal and academic information
- ✅ Automatic synchronization with registrar enrollment records
- ✅ Prevention of duplicate student entries
- ✅ Reduced manual encoding and manual data verification
- ✅ Centralized enrollment workflow

---

## Payment Verification ✅

The Payment Verification module has been completed.

### Completed Features

- ✅ Cashier can view student account balances
- ✅ Cashier can update payment records
- ✅ Cashier can verify student payments
- ✅ Payment records are stored within the system
- ✅ Student balances are updated after verification

---

# Ongoing Development

## Real-Time Queue Dashboard

The Real-Time Queue Dashboard will be integrated into both the **Admin Dashboard** and the **Cashier Dashboard**.

### Features

- Display the current queue number being served.
- Display today's queue availability.
- Provide live queue updates throughout the day.
- Automatically update whenever an approved student receives a queue number.
- Allow administrators to edit the current queue number.
- Configure the maximum queue limit per day.

### Queue Number Format

```
YYYYMMDD-###
```

Example:

```
20260730-001
20260730-002
20260730-003
```

The queue counter automatically resets every new day.

---

## Student Account Generation

Once the **Enroll** button is clicked for an approved student, the system will automatically create a student account.

### Account Information

- Student Name
- Student ID
- Email Address
- Course / Program
- Year Level
- Section
- Default Password

Default Password:

```
PPSCPI123
```

Students will be required to change their password after their first login.

---

# Student Portal

Once a student account has been created, the Student Portal will provide the following modules:

## Dashboard Features

- View student profile
- Edit personal credentials
- Submit required documents
- Request official documents
- View payment balance
- View enrollment status
- View queue number
- View request history

---

## Request Status Tracking

Students will be able to monitor every request with real-time statuses.

Possible statuses include:

- Pending
- Approved
- Rejected
- Processing
- Ready for Claiming
- Claimed

---

## Admin Request Dashboard Enhancement

The Request Dashboard should no longer be limited to Certificate of Enrollment requests.

It should manage all available student requests, including:

- Certificate of Enrollment
- Transcript of Records
- Good Moral Certificate
- Diploma Requests
- Form 137
- Other Registrar Documents

Each request should display:

- Student Information
- Request Type
- Request Date
- Current Status
- Staff Assigned
- Remarks
- Rejection Reason (if applicable)

---

# SMS Notification System

The SMS Notification files are already available and will be integrated during deployment.

Once implemented, the system will automatically notify students whenever:

- Enrollment has been approved
- Enrollment has been rejected
- Payment has been verified
- Requested documents are ready for claiming
- Other important registrar announcements

---

# Grade Management System

The Grade Management System will be available in both the Admin Portal and the Student Portal.

## Admin Dashboard

Administrators can:

- Create student grades
- Edit grades
- Update grades
- Manage subjects
- Manage curriculum per year level
- Manage curriculum per program
- Print grade reports

Since every year level and program may have different curricula, the system should allow administrators to maintain separate subject lists for each curriculum.

---

## Student Dashboard

Students can:

- View grades
- Print grades
- View academic records

Students cannot modify any grade information.

---

# Student–Staff Chat Portal

The chat portal will be integrated into both the Admin Portal and the Student Portal.

## Student Features

- Send messages to staff
- Receive replies
- View chat history

## Admin Features

- View all student conversations
- Each student has an individual conversation thread
- Reply directly to students
- Search conversations
- Manage communication efficiently

Keeping conversations separated per student will make communication easier to organize and moderate.

---

# Global Chat per Section

Students will automatically join their designated section chat once they have been officially enrolled and assigned to a classroom.

Each section will have its own dedicated chat room.

Possible participants include:

- Students
- Section President
- Adviser / Teacher (optional)
- Admin (optional)

### Recommendation

Instead of having administrators actively manage every section chat, a better structure would be:

- Section President posts announcements.
- Adviser or Teacher moderates discussions and academic concerns.
- Administrators retain full access for monitoring and emergency announcements but do not participate in day-to-day conversations.

This approach distributes responsibilities more effectively and prevents unnecessary administrative workload while keeping communication organized.

---

# AI-Powered FAQ Chatbot

The AI chatbot will be accessible throughout the entire system.

### Locations

- Admin Portal
- Cashier Portal
- Student Portal

The chatbot will appear as a floating button located at the bottom-right corner of every page.

### Features

- Answer frequently asked questions
- Enrollment procedures
- Admission requirements
- Tuition and payment inquiries
- Document request information
- Office hours
- Registrar services
- Queue-related inquiries
- General system navigation

The chatbot will provide AI-generated responses to reduce repetitive inquiries handled by school staff.