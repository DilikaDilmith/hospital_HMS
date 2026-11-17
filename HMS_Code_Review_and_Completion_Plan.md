# Hospital Management System — Source Code Review & Completion Plan

**Review date:** 17 November 2026  
**Basis:** Uploaded `hms-backend.zip`, `hms-frontend.zip`, Antigravity technical report and `Hospital_system.pdf` software specification.  
**Review method:** Static inspection of uploaded source code. No connected MySQL database or live authentication tests were available. No source code was modified.

## Executive assessment

The project has a substantive React + Vite frontend, a Spring Boot backend, and a MySQL/JPA data model. Core domains are present: users, patients, doctors, departments, appointments, EMR, lab tests, medicine batches, billing, admissions, beds, staff and dashboards. However, a technical status report marking these modules “verified” is **not** proof that all user journeys are correct. The actual source shows security vulnerabilities and incomplete patient workflows. **Do not deploy with real patient information before the critical issues are resolved and retested.**

## Critical and high-priority findings, grounded in actual code

### P0. Public signup can request the ADMIN role
- `hms-backend/src/main/java/com/hospital/hms/controller/AuthController.java`, lines 70–105: uses the `role` supplied by the HTTP request without a server-side allowlist. An `ADMIN` request is saved as `PENDING` rather than rejected.
- `hms-backend/src/main/java/com/hospital/hms/entity/User.java`, lines 83–90: `isEnabled()` always returns true for any `ADMIN` user, overriding the approval state.
- **Effect:** A newly registered administrative account can potentially authenticate before legitimate approval.
- **Fix:** Public signup must explicitly allow only patient registration and any *approved* staff application roles, never `ADMIN`. Implement separate, admin-authorized role assignment. Enforce `APPROVED` for every login, including admins; make existing seeded admin explicitly approved. Use input DTOs rather than accepting `User` entity directly.
- **Acceptance test:** Public `ADMIN` signup is rejected; a `PENDING` admin (legacy record) cannot log in; an approved admin can log in; non-admin staff require approval.

### P0. Patient data is not scoped by authenticated owner
- `controller/PatientController.java`, lines 34–36 and 70–72: `PATIENT` is allowed to list all patients or fetch any patient by numeric ID. The returned patient entity includes personal contact and identity information.
- `controller/AppointmentController.java`, lines 22–55: all authenticated roles can create appointments for an arbitrary patient ID, list all appointments and retrieve records by any patient ID without owner checks.
- `controller/LabTestController.java`, `controller/InvoiceController.java`, `controller/AdmissionController.java`: patient-visible ID-based endpoints authorize roles but do not show resource ownership checks.
- **Fix:** Enforce ownership in service methods using the authenticated principal, not frontend-supplied `patientId`. Introduce patient-specific `/me/...` endpoints. Staff permissions should follow least privilege; use response DTOs to avoid exposing entire entities. Add negative access-control tests across two patient accounts.
- **Acceptance test:** Patient A cannot read, update, book for, or access invoices/tests of Patient B; appropriate staff can perform permitted duties only.

### P0. Patient booking page uses wrong patient and invalid status
- `hms-frontend/src/pages/patient/BookAppointment.jsx`, lines 35–57: fetches `/api/patients`, chooses `[0].id` (first patient, **not the logged-in patient**), and sends `status: 'BOOKED'`.
- `backend/entity/AppointmentStatus.java` / `Appointment.java`: valid statuses use `SCHEDULED`, `CONFIRMED`, etc., not `BOOKED`.
- **Fix:** Determine the patient at the backend via authenticated account. Frontend must not pick the first record. Server should assign `SCHEDULED` and ignore client-assigned status on booking. Validate a future date/time and available doctor.
- **Acceptance test:** Two different patient accounts each create an appointment attached only to their own patient record and the status is `SCHEDULED`.

### P0/P1. Patient EMR and lab results pages call staff-only endpoints
- `hms-frontend/src/pages/patient/MedicalRecords.jsx`, line 15 calls `GET /api/medical-records`, authorized only for `ADMIN`/`DOCTOR` in `MedicalRecordController.java`.
- `hms-frontend/src/pages/patient/LabResults.jsx`, line 14 calls `GET /api/lab-tests`, authorized only for `ADMIN`/`DOCTOR`/`LAB_STAFF` in `LabTestController.java`.
- **Fix:** Provide authenticated-patient-only endpoints and use them in portal pages. Return only approved/published clinical information, as defined by requirements.
- **Acceptance test:** Signed-in Patient A sees only their own records and results; patient B's records never appear; requesting the staff-only listing returns 403.

### P1. Repeated completion can create duplicate charges
- `service/AppointmentService.java`, lines 62–76: every call to `completeAppointment()` appends a consultation charge, even when the appointment was already completed.
- `service/LabTestService.java`, lines 71–85: every call to `completeTest()` can append a lab charge again.
- `service/MedicalRecordService.java`, lines 40–64: marks a record `DISPENSED` even if stock deduction fails; exceptions are logged and swallowed.
- Similar billing exceptions are caught and suppressed in consultation, lab, admission and medicine flows. This can allow successful clinical status transitions with missing charges.
- **Fix:** Validate permitted state transitions, reject duplicate completion, make billing idempotent per originating event, and keep transactional failures atomic. Add integration tests for repeated requests and rollback.

### P1. Expired medicine batches are eligible for dispensing
- `service/MedicineService.java`, lines 98–130: selects batches by positive quantity and expiry-date order, but does **not** exclude batches whose expiry date is earlier than today.
- **Fix:** Exclude expired/quarantined stock from dispensable quantity and selection; enforce batch expiry checks, sufficient eligible stock, and safe concurrent stock updates. Prefer consistent inventory-level locking or optimistic version checks.
- **Acceptance test:** An expired batch with available quantity is never dispensed; eligible batches are consumed earliest-expiry-first; insufficient eligible stock rejects the operation and does not charge the patient.

### P1. Secrets, defaults and frontend protection
- `security/JwtService.java`: JWT signing secret is embedded directly in Java source. Move it to an environment variable or secret manager and rotate the existing key if reused.
- `resources/application.properties`: database password is in configuration. Keep credentials out of version control and shared ZIPs; rotate any credential exposed outside local development.
- `controller/DoctorController.java`: creates predictable usernames/passwords for doctor accounts; use an invite/activation flow or random temporary password with forced reset instead.
- `DataInitializer.java`: contains seeded demonstration login credentials. Restrict all demo accounts to explicit local/demo profiles and do not deploy them to real environments.
- `hms-frontend/src/App.jsx` + `components/common/Layout.jsx`: no explicit robust auth/role route guard; backend authorization must remain the security boundary. Frontend should hide unauthorized routes and handle expiration cleanly.
- Frontend API calls are hardcoded to localhost across many components; centralize a configured Axios client.

## Requirements comparison — still to complete / verify

| SRS requirement | Evidence from source | Status |
|---|---|---|
| Login, roles | Present, important security issues | Needs repair |
| Patient registration/search | Present, access checks needed | Needs repair |
| Patient document upload | No implementation identified in uploaded source | Missing |
| Doctor management | Create/list present; update and schedule management not identified | Incomplete |
| Booking and tracking | Present, patient booking and conflicts broken | Needs repair |
| Cancel/reschedule | Status-change endpoint exists; full rescheduling workflow not identified | Incomplete |
| EMR, prescriptions | Basic text fields present, patient viewing broken | Incomplete |
| Lab test lifecycle | Present; publishing/security/report export incomplete | Incomplete |
| Pharmacy inventory, expiry | Batch handling present; expiry logic unsafe | Needs repair |
| Billing | Invoice items present; no auditable payment transaction records/partial payment/PDF | Incomplete |
| Admissions/beds | Present, verify concurrency, billing rollback and access rules | Needs repair/testing |
| Staff attendance | Present; leave requests/approval missing | Incomplete |
| Reports/analytics | Dashboard aggregates and charts present | Needs targeted validation |
| Audit logging/session expiry | JWT expiry exists; robust activity audit and frontend expiry behavior not demonstrated | Incomplete |
| Daily/weekly database backup, recovery | No working scheduled backup/recovery process identified in source | Missing |

Do **not** prioritize ED/triage, blood bank, OT scheduling, insurance, SMS, or mobile apps ahead of original SRS requirements unless specifically requested. Several are optional future scope.

## Execution roadmap

### Phase 0 — Preserve the project
- Back up the repository and test database, save a clean Git commit/branch.
- Do not overwrite existing user/patient records or run destructive schema changes.
- Move secrets outside tracked configuration and use a safe demo dataset.

### Phase 1 — Security and patient portal (highest priority)
- Close role escalation and verify approval logic.
- Enforce patient-level authorization on every resource endpoint.
- Replace patient booking demo identity/status logic.
- Fix patient EMR and lab results APIs and UI.
- Implement regression tests for approval, access control, and patient booking.

### Phase 2 — Transaction and clinical workflow correctness
- Prevent double booking and invalid appointments.
- Implement valid status transitions and idempotent invoicing.
- Make medicine dispensing safe (expiry, stock, rollback, concurrency).
- Strengthen doctor-user linking and structured prescriptions.

### Phase 3 — Complete original SRS
- Doctor updates and schedules; cancellation/rescheduling UX.
- Patient document upload; printable invoice/receipt/lab reports.
- Payment recording and reconciliation; staff leave records.
- Audit trail, session expiry handling, automated backups and tested recovery.

### Phase 4 — Demo-readiness
- Run Maven tests with a test database and frontend build/lint on the actual development machine.
- Add role-based end-to-end tests, error handling, validation and responsive UI QA.
- Create README, setup guide, fake demo data, demo script and screenshots.

## Build verification limitation

The uploaded frontend ZIP contains Windows-installed `node_modules`. In this Linux review environment, a Vite build was attempted but blocked by missing platform-specific Rolldown native bindings. This is an **environment/dependency mismatch**, not evidence that the React code itself fails to build. The previously supplied Antigravity report claimed a successful frontend build on the development machine. Backend Maven tests were not run because a compatible Maven wrapper/runtime and live MySQL environment were not available in this review context. The only backend test file inspected was the default Spring context-load test, not a comprehensive functional test suite.

## Ready-to-paste Antigravity request: Phase 1 only

> Review `HMS_Code_Review_and_Completion_Plan.md` and compare each finding to the local project. Work ONLY on Phase 1 security and patient-portal correctness. Before editing, create a Git branch and backup the MySQL demo database. Never use destructive DDL and never publish credentials. First: disallow public ADMIN signup, validate a server-side role allowlist, require APPROVED for all logins, and add auth tests. Second: enforce owner checks on patient, appointment, lab result, invoice and admission endpoints; add role-based tests using two patient accounts. Third: replace BookAppointment.jsx's first-patient selection and invalid BOOKED status with authenticated-user identity and server-owned SCHEDULED status. Fourth: implement authenticated-patient own-record/own-lab-result endpoints and update the patient pages. Preserve existing employee workflows, design, and schema data. Do not remove modules. Run available tests and builds, show code diff, test results and any remaining failures; do not claim untested functionality is verified.

**Security note:** Use fictitious data for demos and tests, not real patient records.
