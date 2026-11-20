# Hospital Management System (HMS)
### Enterprise Healthcare Operations & Clinical Management Platform

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.x%20%2F%204.x-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Java](https://img.shields.io/badge/Java-17-orange.svg)](https://www.oracle.com/java/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8.svg)](https://tailwindcss.com/)
[![MySQL](https://img.shields.io/badge/Database-MySQL%20%7C%20MariaDB-4479A1.svg)](https://www.mysql.com/)
[![JWT Security](https://img.shields.io/badge/Security-Stateless%20JWT%20%2B%20RBAC-red.svg)](https://jwt.io/)
[![Tests](https://img.shields.io/badge/Automated%20Tests-158%20Passing-success.svg)](#testing--quality-assurance)

---

## 📌 Table of Contents
1. [Overview](#-overview)
2. [Key Capabilities & Modules](#-key-capabilities--modules)
3. [User Roles & Access Control (RBAC)](#-user-roles--access-control-rbac)
4. [Technology Stack](#-technology-stack)
5. [Project Architecture & Directory Structure](#-project-architecture--directory-structure)
6. [Getting Started & Installation](#-getting-started--installation)
   - [Prerequisites](#prerequisites)
   - [Database Setup](#1-database-configuration)
   - [Backend Setup](#2-backend-setup-spring-boot)
   - [Frontend Setup](#3-frontend-setup-react--vite)
7. [Default Seed Accounts & Test Credentials](#-default-seed-accounts--test-credentials)
8. [REST API Endpoint Reference](#-rest-api-endpoint-reference)
9. [Automated Backup & Disaster Recovery](#-automated-backup--disaster-recovery)
10. [Testing & Quality Assurance](#-testing--quality-assurance)

---

## 🌟 Overview

The **Hospital Management System (HMS)** is an enterprise-grade web application engineered for modern hospitals, medical centers, and outpatient clinics. It unifies clinical duties, outpatient scheduling, inpatient bed tracking, electronic medical records (EMR), laboratory diagnostics, pharmacy inventory, and finance/itemized billing into one secure, high-performance platform.

### Core System Goals
* **Role-Based Isolation**: Tailored workflows and isolated dashboards for 8 hospital roles (`ADMIN`, `DOCTOR`, `NURSE`, `RECEPTIONIST`, `LAB_STAFF`, `PHARMACIST`, `ACCOUNTANT`, `PATIENT`).
* **Strict Patient Data Privacy**: Patient records, lab results, and uploaded medical documents are protected by principal-level data isolation—patients can strictly only access their own clinical history.
* **Clinical Doctor Scoping**: Doctors view only their own scheduled appointments and patients, avoiding clinical cross-contamination.
* **MariaDB & MySQL Cross-Compatibility**: Dialect-agnostic SQL operations for atomic bed assignment, inpatient discharge calculations, and inventory dispensing.
* **Audit Trails & Security**: Complete audit logging of sensitive clinical and administrative operations, stateless JWT authentication, and automatic session inactivity logout.

---

## 🚀 Key Capabilities & Modules

### 1. 📊 Centralized & Role-Scoped Dashboards
* **Admin Dashboard**: Hospital-wide performance KPIs, bed occupancy, category revenue, monthly trends, and staff attendance.
* **Doctor Dashboard**: Scoped strictly to the logged-in doctor—shows only their own booked appointments, daily schedule, patient count, pending lab tests, and real-time appointment table.
* **Accountant Dashboard**: Real-time collected revenue, gross billed revenue, pending receivables, category revenue stream breakdowns (Consultations, Pharmacy, Lab, Ward), and quick payment collection.
* **Nurse Dashboard**: Active inpatient admissions, real-time bed rosters, patient monitoring, and discharge processing.
* **Receptionist Dashboard**: Front-desk registration, quick appointment scheduling, and patient check-ins.
* **Pharmacist Dashboard**: Prescription queue, FEFO inventory batches, and expiring medicine warnings.
* **Lab Staff Dashboard**: Diagnostics queue, specimen tracking, result entry, and printable test reports.
* **Patient Portal**: Consultation history, appointment booking with doctor/department filtering, electronic medical records (EMR), lab reports, and uploaded medical documents.

### 2. 🏥 Inpatient (IPD) & Bed Ward Management
* Multi-ward support (e.g. General Ward, Surgical Ward, Maternity & Pediatrics).
* Dynamic bed statuses: `AVAILABLE`, `OCCUPIED`, `MAINTENANCE`.
* **Atomic Bed Assignment**: Safe concurrent assignment preventing race conditions or double-admissions.
* **Automated Stay Billing & Discharge**: Calculates length of stay (minimum 1 day for same-day observation) and automatically adds ward accommodation fees to the patient's active invoice upon discharge.

### 3. 🩺 Outpatient (OPD) & Appointments
* Multi-department appointment scheduling (Cardiology, Neurology, Pediatrics, General Medicine, Orthopedics, Dermatology).
* Doctor schedule validation preventing double-booking of time slots.
* Appointment rescheduling and cancellation workflows.
* Real-time status lifecycle: `SCHEDULED` ➔ `CONFIRMED` ➔ `CHECKED_IN` ➔ `IN_PROGRESS` ➔ `COMPLETED` / `CANCELLED`.
* Automated consultation fee billing upon appointment completion.

### 4. 📋 Electronic Medical Records (EMR) & Clinical Documents
* Complete clinical record entry during consultations: diagnosis, symptoms, clinical notes, treatments, and prescriptions.
* **Medical Document Repository**: Secure upload of PDFs, lab scans, X-rays, and discharge summaries (max 5 MB, MIME validation).
* Inline browser preview (`/api/documents/{id}/view`) and direct attachment download (`/api/documents/{id}/download`).
* Doctors can review and upload documents directly from consultation appointment rows.

### 5. 🔬 Laboratory Diagnostics
* Ordering of diagnostic tests by Doctors and Admins.
* Status tracking: `REQUESTED` ➔ `IN_PROGRESS` ➔ `COMPLETED` / `CANCELLED`.
* Laboratory technologist results recording, reference ranges, and pathologist clinical impressions.
* Auto-billing of diagnostic test fees to active patient invoices.
* Official printable lab report with hospital branding.

### 6. 💊 Pharmacy & FEFO Inventory Management
* Medicine catalog with stock thresholds and low-stock alerts (< 50 units).
* **FEFO Inventory (First-Expired-First-Out)**: Batch tracking ensures medicines with the earliest expiration dates are dispensed first.
* Automatic deduction from active, non-expired batches during dispensing.
* Auto-billing of dispensed medications to patient invoices.

### 7. 💳 Itemized Billing, Invoicing & Receipts
* Aggregated, multi-category itemized invoicing (`CONSULTATION`, `PHARMACY`, `LAB`, `WARD`).
* Payment collection with multiple tenders: `CASH`, `CARD`, `INSURANCE`.
* Official printable tax invoice and payment receipts.
* Real-time outstanding receivables tracking.

### 8. 🛡️ Security, Audit Logging & Inactivity Timer
* Stateless JWT authentication with standard Bearer token exchange.
* Self-registration approval system: new sign-ups default to `PENDING` until approved by an Admin.
* Automated inactivity timer in frontend logs out idle users after inactivity to safeguard clinical data.
* Centralized immutable audit logs tracking actions, timestamps, and outcomes.

---

## 👥 User Roles & Access Control (RBAC)

| Role | Primary Responsibilities & Permissions |
| :--- | :--- |
| **`ADMIN`** | Full system control: User approvals, audit logs, employee HR, ward & bed configuration, doctor management, hospital metrics. |
| **`DOCTOR`** | Clinical practice: View own appointments, conduct consultations, create EMRs, order lab tests, upload clinical documents. |
| **`NURSE`** | Inpatient care: View ward bed rosters, admit patients, update bed statuses, process discharges. |
| **`RECEPTIONIST`** | Front desk: Patient registration, doctor appointment bookings, patient check-in, initial invoice creation. |
| **`LAB_STAFF`** | Diagnostics: Manage diagnostic test orders, enter findings, record results, generate official lab reports. |
| **`PHARMACIST`** | Dispensary: Prescription dispensing via FEFO batches, inventory stock management, medicine batch tracking. |
| **`ACCOUNTANT`** | Finance: Dedicated financial dashboard, invoice generation, payment collection, revenue analytics. |
| **`PATIENT`** | Self-service: Profile management, book appointments, view own EMR, lab test reports, and hospital uploaded documents. |

---

## 💻 Technology Stack

### Backend
* **Language & Runtime**: Java 17 (OpenJDK / Oracle JDK)
* **Framework**: Spring Boot 3.x / 4.x
* **Security**: Spring Security 6 with stateless JWT (`jjwt 0.11.5`)
* **Persistence**: Spring Data JPA / Hibernate ORM
* **Database Driver**: MySQL Connector/J (Compatible with MySQL 8.0+ and MariaDB 10.x+)
* **Tooling**: Maven Wrapper (`mvnw`), Lombok

### Frontend
* **Core Library**: React 19
* **Build Tool**: Vite
* **Routing**: React Router v7
* **Styling**: Tailwind CSS v4, PostCSS
* **Icons**: React Icons (`react-icons/fa`)
* **Charts & Analytics**: Recharts
* **HTTP Client**: Axios

### Storage & Security
* **Storage**: Local secure file storage (`uploads/patient-documents/`) with UUID sanitization and directory traversal prevention.
* **Passwords**: BCrypt password hashing.

---

## 📂 Project Architecture & Directory Structure

```text
hms/
├── backup-scripts/                      # Disaster recovery and database backup scripts
│   ├── daily-db-backup.ps1 / .bat       # Daily MySQL database dump
│   ├── weekly-full-backup.ps1 / .bat    # Weekly archive (Database + Uploaded Documents)
│   ├── restore-backup.ps1 / .bat        # Safe interactive restore utility
│   └── README.md
│
├── BACKUP_AND_RECOVERY.md               # Disaster Recovery & Windows Task Scheduler guide
├── hms-backend/                         # Spring Boot Backend REST API
│   ├── src/main/java/com/hospital/hms/
│   │   ├── config/                      # Web and application configurations
│   │   ├── controller/                  # REST API Controllers (16 controllers)
│   │   ├── dto/                         # Data Transfer Objects
│   │   ├── entity/                      # JPA Entities (24 entities)
│   │   ├── repository/                  # Spring Data JPA Repositories
│   │   ├── security/                    # JWT filters, entry points, SecurityConfig
│   │   ├── service/                     # Business logic and services
│   │   ├── DataInitializer.java         # Database migrations and default seed data
│   │   └── HmsApplication.java          # Spring Boot main entry point
│   ├── src/main/resources/
│   │   └── application.properties       # DB connection, JPA, multipart config
│   ├── src/test/java/com/hospital/hms/  # Automated test suite (158 tests)
│   ├── uploads/patient-documents/       # Uploaded clinical PDFs and image scans
│   └── pom.xml
│
├── hms-frontend/                        # React 19 Frontend Application (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/                   # Modals: AddDoctor, EditDoctor, AddInvoice, etc.
│   │   │   ├── common/                  # Layout, InactivityTimer, PrintableInvoiceModal
│   │   │   ├── doctor/                  # AddEMRModal, OrderLabTestModal
│   │   │   ├── inpatient/               # AdmitPatientModal, DischargeModal
│   │   │   └── labstaff/                # EnterResultsModal, PrintableLabReportModal
│   │   ├── pages/                       # Dedicated role-based page modules
│   │   │   ├── accountant/              # Dashboard.jsx, Billing.jsx
│   │   │   ├── admin/                   # Dashboard.jsx, Patients.jsx, Doctors.jsx, etc.
│   │   │   ├── doctor/                  # Dashboard.jsx, Appointments.jsx, LabRequests.jsx
│   │   │   ├── labstaff/                # Dashboard.jsx, LabTests.jsx
│   │   │   ├── nurse/                   # NurseDashboard.jsx
│   │   │   ├── patient/                 # Dashboard.jsx, BookAppointment.jsx, Documents.jsx, etc.
│   │   │   ├── pharmacist/              # Dashboard.jsx, Prescriptions.jsx, MedicineBatches.jsx
│   │   │   ├── receptionist/            # Dashboard.jsx
│   │   │   ├── DashboardRouter.jsx      # Role-based dashboard router
│   │   │   ├── ProfileRouter.jsx        # Role-based profile router
│   │   │   ├── Login.jsx                # Authentication login screen
│   │   │   └── Signup.jsx               # User registration screen
│   │   ├── App.jsx                      # Route definitions
│   │   └── main.jsx                     # Vite React root
│   ├── package.json
│   └── vite.config.js
│
└── README.md                            # Complete Project Documentation
```

---

## 🛠️ Getting Started & Installation

### Prerequisites
* **Java**: JDK 17 or higher
* **Node.js**: Node.js v18.0.0 or higher (with `npm`)
* **Database**: MySQL 8.0+ or MariaDB 10.4+
* **Git**: Installed and configured

---

### 1. Database Configuration
1. Start your local MySQL / MariaDB server (e.g. via XAMPP, MySQL Service, or Docker).
2. Create the database:
   ```sql
   CREATE DATABASE hms_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Verify or edit [application.properties](file:///c:/Users/dilik/Desktop/Projects/SLT%20Projects/hms/hms-backend/src/main/resources/application.properties):
   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/hms_db?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
   spring.datasource.username=root
   spring.datasource.password=123456
   ```

---

### 2. Backend Setup (Spring Boot)
1. Open a terminal in the `hms-backend` directory:
   ```bash
   cd hms-backend
   ```
2. Build and run the backend using the Maven wrapper:
   ```bash
   # Windows
   .\mvnw.cmd spring-boot:run

   # Linux / macOS
   ./mvnw spring-boot:run
   ```
3. The server starts on **`http://localhost:8080`**. Database tables and default sample records are seeded automatically on first startup.

---

### 3. Frontend Setup (React + Vite)
1. Open a second terminal in the `hms-frontend` directory:
   ```bash
   cd hms-frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Access the web application at **`http://localhost:5173`**.

---

## 🔑 Default Seed Accounts & Test Credentials

The system seeds the following default accounts automatically upon startup. All default passwords follow the standard pattern:

| Role | Username | Default Password | Full Name / Description |
| :--- | :--- | :--- | :--- |
| **`ADMIN`** | `admin` | `admin123` | System Administrator |
| **`DOCTOR`** | `doctor1` | `doc123` | Dr. Sunil Perera (Cardiology) |
| **`NURSE`** | `nurse1` | `nurse123` | Kumari Silva (Inpatient & ICU) |
| **`RECEPTIONIST`** | `receptionist1` | `recep123` | Anula Jayasinghe (Front Desk) |
| **`ACCOUNTANT`** | `accountant1` | `account123` | Kavinda Dias (Finance & Accounts) |
| **`PHARMACIST`** | `pharmacist1` | `pharm123` | Nimal Bandara (Dispensary) |
| **`LAB_STAFF`** | `labstaff1` | `lab123` | Samantha Fernando (Pathology Lab) |
| **`PATIENT`** | Self-registered | Chosen at sign-up | Automatic Patient profile creation |

> [!NOTE]
> New users registered via the **Sign-Up** page require Admin approval under **Hospital Administration ➔ User Approvals** before they can log in. Newly registered Doctors automatically sync to the available doctor directory once approved.

---

## 📡 REST API Endpoint Reference

### Authentication (`/api/auth`)
* `POST /api/auth/register`: Register a new user account (`PENDING` approval).
* `POST /api/auth/login`: Authenticate and receive a JWT Bearer token.

### Dashboard (`/api/dashboard`)
* `GET /api/dashboard`: Aggregated hospital metrics (scoped automatically to caller role).
* `GET /api/dashboard/doctor/my`: Dedicated metrics for the authenticated doctor.
* `GET /api/dashboard/stats`: Global summary metrics for Admin & Accounting.

### Appointments (`/api/appointments`)
* `POST /api/appointments`: Book an appointment (patients auto-bind to their profile).
* `GET /api/appointments`: List appointments (doctors see only their own; staff see all).
* `GET /api/appointments/doctor/my`: Authenticated doctor's scheduled consultations.
* `GET /api/appointments/my`: Authenticated patient's consultations.
* `PUT /api/appointments/{id}/reschedule`: Reschedule appointment to a new date/time.
* `PUT /api/appointments/{id}/cancel`: Cancel appointment and release slot.
* `PUT /api/appointments/{id}/status`: Update status (`SCHEDULED`, `CONFIRMED`, `IN_PROGRESS`, `COMPLETED`).

### Medical Records & Documents (`/api/medical-records`, `/api/documents`)
* `POST /api/medical-records`: Create clinical record with diagnosis and prescriptions.
* `GET /api/medical-records/my`: Authenticated patient's clinical history.
* `POST /api/patients/{id}/documents`: Upload PDF/scan document for a patient.
* `GET /api/documents/my`: Authenticated patient's documents only.
* `GET /api/documents/{id}/view`: Stream document inline (PDF/image preview).
* `GET /api/documents/{id}/download`: Download document attachment.

### Inpatient & Bed Management (`/api/admissions`, `/api/wards`)
* `POST /api/admissions`: Admit patient to available bed with attending doctor.
* `PUT /api/admissions/{id}/discharge`: Process discharge, calculate stay fee, release bed to `AVAILABLE`, and auto-bill.
* `GET /api/wards`: List wards and bed rosters.
* `GET /api/wards/beds/available`: List currently available beds for admission.
* `PUT /api/wards/beds/{id}/status`: Toggle bed status (`AVAILABLE`, `MAINTENANCE`).

### Laboratory Diagnostics (`/api/lab-tests`)
* `POST /api/lab-tests`: Order a diagnostic test (auto-bills test fee).
* `GET /api/lab-tests`: List laboratory tests.
* `GET /api/lab-tests/my`: Authenticated patient's lab results.
* `PUT /api/lab-tests/{id}/results`: Record lab findings and mark completed.

### Pharmacy & Inventory (`/api/medicines`)
* `POST /api/medicines`: Add medicine to catalog.
* `GET /api/medicines`: View medicines and stock quantities.
* `POST /api/medicines/{id}/batches`: Add new batch with quantity and expiry date.
* `POST /api/medicines/{id}/dispense`: Dispense medicine using FEFO deduction and auto-bill.

### Invoices & Billing (`/api/invoices`)
* `POST /api/invoices`: Create new invoice for a patient.
* `GET /api/invoices`: Retrieve hospital invoices.
* `GET /api/invoices/my`: Authenticated patient's invoices.
* `POST /api/invoices/{id}/items`: Add itemized charges (`CONSULTATION`, `PHARMACY`, `LAB`, `WARD`).
* `PUT /api/invoices/{id}/pay`: Settle invoice via `CASH`, `CARD`, or `INSURANCE`.

---

## 💾 Automated Backup & Disaster Recovery

The project includes complete standalone backup and disaster recovery automation in accordance with **SRS Section 10** located in [backup-scripts/](file:///c:/Users/dilik/Desktop/Projects/SLT%20Projects/hms/backup-scripts/) and documented in [BACKUP_AND_RECOVERY.md](file:///c:/Users/dilik/Desktop/Projects/SLT%20Projects/hms/BACKUP_AND_RECOVERY.md):

* **Automatic Daily Database Backup (`daily-db-backup.ps1` / `.bat`)**:
  - Dumps `hms_db` using `mysqldump` with `--single-transaction`, routines, and triggers.
  - Automatically purges backups older than 30 days.
* **Weekly Full Backup (`weekly-full-backup.ps1` / `.bat`)**:
  - Bundles the complete database dump and all patient uploaded files (`uploads/patient-documents/`) into a compressed `.zip` archive.
  - Retains weekly archives for 60–90 days.
* **Disaster Recovery & Safe Database Restoration (`restore-backup.ps1` / `.bat`)**:
  - Interactive restoration utility with safety confirmation prompts preventing accidental overwrites.
* **Audit Trail**:
  - Real-time logging of administrative, clinical, and financial actions in `audit_logs` table via `AuditLogService` with password/token sanitization.

```powershell
# Run a manual daily database dump
cd backup-scripts
.\daily-db-backup.ps1

# Run a manual weekly full archive (DB + Documents)
.\weekly-full-backup.ps1

# Restore from a backup archive
.\restore-backup.ps1 -BackupFile "backups/daily/hms_daily_YYYYMMDD_HHMMSS.sql"
```

---

## 🧪 Testing & Quality Assurance

The backend includes a comprehensive automated test suite of **158 unit and integration tests** verifying data isolation, concurrency safety, billing accuracy, and role permissions.

### Running Backend Tests
```bash
cd hms-backend
.\mvnw.cmd test
```

### Key Test Suites
* `PatientDataIsolationAndDocumentsTest`: Verifies strict patient privacy and document isolation (403 on foreign access).
* `DoctorDashboardIsolationTest`: Verifies doctors view only their own bookings and patient counts.
* `DoctorAppointmentIsolationTest`: Verifies doctor consultation isolation.
* `InpatientBedAssignmentSafetyTest`: Verifies atomic bed locks and MariaDB discharge syntax.
* `MedicineExpiryValidationTest`: Verifies FEFO batch deduction order and expiry rules.
* `InvoiceReceiptPrintingSafetyTest`: Verifies itemized arithmetic and billing accuracy.
* `SecurityAuditAndSessionSafetyTest`: Verifies JWT expiration, unauthorized entry points, and audit logs.

```text
[INFO] Results:
[INFO] Tests run: 158, Failures: 0, Errors: 0, Skipped: 0
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
```

---

## 📄 License & Attribution

Developed for **Enterprise Healthcare Operations**. All rights reserved.
Built with ❤️ using Spring Boot, React, and Tailwind CSS.
