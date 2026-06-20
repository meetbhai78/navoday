# AI Coding Assistant Prompt — Smart Student Management & Attendance System

Copy everything below this line and give it to your AI coding assistant (Antigravity / Claude Opus 4.6) as the complete project brief.

---

## PROJECT OVERVIEW

Build a **modern, responsive, multilingual (Gujarati + English)** Smart Student Management & Attendance System for coaching classes, schools, tuition centers, and village education centers.

The system has **three roles**: **Admin**, **Teacher**, and **Student**.

---

## TECH STACK

**Frontend:**
- React.js
- Tailwind CSS
- Redux Toolkit
- Fully responsive design (works seamlessly on mobile browsers and desktop — no separate native app needed)

**Backend:**
- Node.js
- Express.js

**Database:**
- MongoDB

**Authentication:**
- JWT-based authentication
- Role-based access control (Admin / Teacher / Student)

**File Storage:**
- Cloudinary (or local storage fallback) — for PDFs, homework, study materials

**Notifications:**
- Firebase Cloud Messaging (FCM) for push notifications

---

## DATA HIERARCHY

```
Village
 └── Students (linked to one or more Teachers, organized by Class/Standard)
 └── Teachers (assigned to specific villages)
```

Villages must support dynamic growth (e.g., a village with 10 students growing to 12+) without schema changes. Use a proper relational reference structure in MongoDB (village ID linked to student/teacher documents), not hardcoded counts.

---

## ADMIN MODULE

- Secure Admin Login
- Dashboard with analytics and reports
- Manage Teachers (Add / Edit / Delete / View)
- Manage Students (Add / Edit / Delete / View)
- Manage Villages (Add / Edit / Delete)
- Manage Classes/Standards
- View attendance reports (all villages)
- View exam and result reports
- Manage announcements (global)
- System settings
- User activity logs (audit trail of who changed what)

---

## TEACHER MODULE

- Secure Login
- Dashboard: total students, attendance statistics, upcoming exams, recent activities
- Add/Edit/Delete Students (within their assigned village)
- Mark Daily Attendance (Present/Absent)
- Edit Attendance Records
- View Attendance Reports

**Exams:**
- Create Online Tests and Exams
- Add/Edit/Delete Questions (MCQ + short answer)
- Set Exam Date and Time
- Set Total Marks and Passing Marks
- Enter Student-wise Marks for Offline Exams
- Edit Student Marks
- Publish Results

**Content:**
- Upload Homework
- Upload PDF Notes and Study Materials (categorized by subject)
- Manage Homework and Study Materials (edit/delete)

**Messaging:**
- Send Individual Messages to Students
- Send Messages to a Specific Village
- Send Broadcast Messages to All Villages

**Reports:**
- Download Reports (PDF/Excel)

---

## STUDENT MODULE

- Registration and Login
- Profile Management
- View Attendance History
- View Homework
- Download PDF Notes
- Attend Online Tests
- View Exam Schedule
- View Results and Marks
- View Notifications and Messages
- View Announcements
- Switch Language (Gujarati / English)
- Change Password

---

## ATTENDANCE MANAGEMENT

- Daily attendance tracking, Present/Absent status
- Attendance history per student (calendar view)
- Attendance reports (village-wise, class-wise)
- Monthly attendance summary
- Student-wise attendance statistics (auto-calculated %)

---

## EXAM & RESULT MANAGEMENT

- Create exams with date and time scheduling
- Support both Online and Offline exams
- Student-wise marks entry
- Marks editing and updating
- Result publishing (visible to students once published, not before)
- Percentage calculation
- Rank calculation (optional, class/village-wise)
- Performance reports (individual + class-level)

---

## HOMEWORK & STUDY MATERIAL

- Upload homework with due dates
- Upload PDF files
- Categorize materials by subject
- Student download access
- Track submission status (optional: submitted/pending)

---

## MESSAGING & NOTIFICATIONS

- Individual student messaging
- Village-wise messaging
- Global announcements (all villages)
- Push notifications for: new exam, new homework, new result, new message
- Read/unread status tracking

---

## VILLAGE MANAGEMENT

- Organize students by village
- Village-wise student count
- Village-wise reports (attendance %, performance)
- Village-wise communication (teacher can target one village or all)

---

## DASHBOARD & ANALYTICS

**Admin Dashboard:**
- Total students, total teachers (summary cards)
- Village-wise student distribution (chart)
- Overall attendance percentage
- Top performing students
- Weak performing students (flagged for attention)
- Exam statistics
- Monthly growth reports
- Recent activity log

**Teacher Dashboard:**
- Total students under them
- Today's attendance snapshot
- Upcoming exams
- Recent activity (messages sent, homework uploaded)

**Student Dashboard:**
- Attendance percentage widget
- Latest marks
- Unread messages/announcements badge
- Upcoming exam reminder

---

## MULTILINGUAL SUPPORT

- Gujarati and English language support throughout the entire UI
- Dynamic language switching (no reload required)
- Store all UI text in translation files (i18next or equivalent) — do not hardcode strings

---

## ADVANCED FEATURES (Phase 2 — build after core MVP is stable, but design the database schema now so these can be added later without major rework)

- **AI-based Student Performance Analysis** — identify weak subjects/topics per student automatically
- **AI Study Recommendations** — suggest what a student should study next based on performance
- **QR-based Attendance** — scan QR code to mark attendance instead of manual entry
- **Parent Notifications** — separate read-only parent access or SMS alerts for attendance/results
- **Export Reports to PDF and Excel** — for attendance, marks, and village reports
- **Dark/Light Mode** toggle
- **Digital Library** — subject-wise notes/PDF repository accessible to all students, searchable by subject
- **Video Lectures** — teacher uploads recorded lecture (YouTube embed or direct upload), organized by subject
- **Doubt/Question Box** — student posts a doubt, teacher/admin replies in a thread
- **Leaderboard** — top performers ranked village-wise and overall

---

## NON-FUNCTIONAL REQUIREMENTS

- Professional, clean UI/UX
- Secure authentication (JWT, password hashing, optional OTP for sensitive actions)
- Fully responsive — works on mobile browsers and desktop equally well
- CRUD functionality for all major modules (Villages, Students, Teachers, Exams, Homework, Messages)
- Role-based access control enforced at both frontend (UI hiding) and backend (API authorization) level
- Scalable architecture suitable for real-world production deployment (support adding District/State hierarchy later without redesign)
- Offline-friendly considerations for low-connectivity rural areas (cache key data, sync on reconnect)

---

## WHAT I NEED FROM YOU

1. Propose the MongoDB schema (collections, relationships/references) based on the structure above
2. Set up the project: React.js + Tailwind + Redux Toolkit frontend, Node.js + Express backend, MongoDB database
3. Build features in this priority order:
   Authentication (JWT, role-based) → Admin Panel (Village/Teacher/Student management) → Attendance → Messaging → Exam & Result Management → Homework/Study Material Upload → Dashboards (Admin/Teacher/Student) → Gujarati/English language toggle
4. Keep code modular so Advanced/Phase 2 features can be added later without breaking existing functionality
5. Ask clarifying questions before major architectural decisions (e.g., exact permission rules for cross-village messaging, exam grading rules)

Start by giving me the proposed MongoDB schema and project folder structure before writing any code.
