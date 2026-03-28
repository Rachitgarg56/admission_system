# Admission Management System

A minimal web-based admission management system built for the edumerge assignment.

**Tech Stack:** Next.js 14 (App Router) + Tailwind CSS · Node.js + Express (MVC) · MySQL

---

## Features

- **Program Setup** — Create programs with institution/campus/department; define KCET / COMEDK / Management quota seats (sum must equal total intake)
- **Applicant Management** — Create applicants (≤15 fields); update document status (Pending → Submitted → Verified)
- **Seat Allocation** — Quota availability shown before allocation; seat locked atomically; overbooking impossible
- **Admission Confirmation** — Requires document = Verified AND fee = Paid; generates unique immutable admission number (`INST/2026/UG/CSE/KCET/0001`)
- **Dashboard** — Total intake vs filled, quota-wise breakdown, pending documents list, pending fees list
- **Role Simulation** — Dropdown in sidebar switches between Admin / Admission Officer / Management views

---

## Prerequisites

- Node.js ≥ 18
- MySQL ≥ 8.0

---

## Setup

### 1. Clone & setup database

```bash
mysql -u root -p
```

```sql
CREATE DATABASE admission_db;
USE admission_db;
SOURCE /path/to/backend/config/schema.sql;
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your DB credentials
npm run dev       # runs on http://localhost:5000
```

### 3. Frontend

```bash
cd frontend
npm install
# Optional: create .env.local and set NEXT_PUBLIC_API_URL=http://localhost:5000/api
npm run dev       # runs on http://localhost:3000
```

---

## Project Structure

```
admission-system/
├── backend/
│   ├── config/
│   │   ├── db.js           # MySQL connection pool
│   │   └── schema.sql      # All table definitions
│   ├── models/
│   │   ├── Program.js      # Program queries
│   │   ├── Quota.js        # Quota + atomic incrementFilled
│   │   ├── Applicant.js    # Applicant CRUD
│   │   └── Admission.js    # Allocation, confirmation, dashboard
│   ├── controllers/
│   │   ├── programController.js    # Quota sum validation
│   │   ├── applicantController.js  # Allotment number validation
│   │   └── admissionController.js  # Seat lock + admission number generation
│   ├── routes/
│   │   └── index.js        # All API routes
│   └── server.js
│
└── frontend/
    └── src/
        ├── app/
        │   ├── layout.js           # Sidebar + role selector
        │   ├── programs/page.js    # Create programs & quotas
        │   ├── applicants/page.js  # Create applicants, update docs
        │   ├── allocate/page.js    # Seat allocation
        │   ├── confirm/page.js     # Fee update + confirmation
        │   └── dashboard/page.js  # Management view
        └── lib/
            ├── api.js          # All fetch calls
            └── constants.js    # Static dropdown values
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/programs` | Create program + quotas |
| GET | `/api/programs` | List all programs |
| GET | `/api/programs/:id/quotas` | Get quotas for a program |
| POST | `/api/applicants` | Create applicant |
| GET | `/api/applicants` | List all applicants |
| GET | `/api/applicants/unallocated` | Applicants without a seat |
| PATCH | `/api/applicants/:id/document-status` | Update document status |
| POST | `/api/admissions/allocate` | Allocate & lock a seat |
| GET | `/api/admissions` | List all admissions |
| PATCH | `/api/admissions/:id/fee-status` | Mark fee Paid/Pending |
| POST | `/api/admissions/:id/confirm` | Confirm & generate admission number |
| GET | `/api/dashboard` | Dashboard aggregates |

---

## Key Business Logic

### Seat Allocation (no overbooking)

The core of the system. In `Quota.incrementFilled`:

```sql
UPDATE quotas
SET filled_seats = filled_seats + 1
WHERE id = ? AND filled_seats < total_seats
```

If `affectedRows = 0`, the quota is full — allocation is blocked. This runs inside a DB transaction with the admission insert, so even concurrent requests cannot overbook.

### Admission Number Generation

Format: `INST/{year}/{course_type}/{program_name}/{quota_type}/{seq}`

The sequence (`0001`, `0002`, …) is scoped per program + quota combination. Generated inside a transaction with `FOR UPDATE` row lock to prevent duplicates under concurrent access.

### Confirmation Rules

Both conditions must be true or the API returns 400:
1. `applicants.document_status = 'Verified'`
2. `admissions.fee_status = 'Paid'`

---

## User Flow

```
Admin creates Program → defines Quotas (sum = intake)
         ↓
Admission Officer creates Applicant
         ↓
Seat Allocated → quota counter incremented, seat locked
         ↓
Document status updated to Verified
         ↓
Fee marked as Paid
         ↓
Admission Confirmed → Admission Number generated (once, immutable)
```

---

## AI Assistance Disclosure

This project was built with assistance from Claude (Anthropic). AI was used to:
- Generate boilerplate Express/Next.js structure
- Write SQL queries and model methods
- Build UI components and Tailwind styling

All business logic (seat allocation, quota validation, admission number generation, confirmation rules) was reviewed and verified against the BRS requirements.
