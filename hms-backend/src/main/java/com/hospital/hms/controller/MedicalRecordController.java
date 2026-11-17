package com.hospital.hms.controller;

import com.hospital.hms.entity.MedicalRecord;
import com.hospital.hms.service.AuditLogService;
import com.hospital.hms.service.MedicalRecordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/medical-records")
public class MedicalRecordController {

    @Autowired
    private MedicalRecordService medicalRecordService;

    @Autowired
    private AuditLogService auditLogService;

    public void setMedicalRecordService(MedicalRecordService medicalRecordService) {
        this.medicalRecordService = medicalRecordService;
    }

    public void setAuditLogService(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    // Endpoint to create a new medical record (Only Doctors and Admins can create)
    @PostMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'DOCTOR', 'ROLE_ADMIN', 'ROLE_DOCTOR')")
    public MedicalRecord createRecord(@RequestBody MedicalRecord record, Authentication authentication) {
        MedicalRecord created = medicalRecordService.createRecord(record);
        if (auditLogService != null) {
            String actor = (authentication != null) ? authentication.getName() : "DOCTOR";
            Long patientId = (created.getPatient() != null) ? created.getPatient().getId() : null;
            auditLogService.log(actor, "MEDICAL_RECORD_CREATE", "SUCCESS",
                    "Created clinical entry for patient ID: " + (patientId != null ? patientId : "N/A"));
        }
        return created;
    }

    public MedicalRecord createRecord(MedicalRecord record) {
        return createRecord(record, null);
    }

    // Endpoint to get all medical records (Staff only)
    @GetMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'DOCTOR', 'ROLE_ADMIN', 'ROLE_DOCTOR')")
    public List<MedicalRecord> getAllRecords() {
        return medicalRecordService.getAllRecords();
    }

    // Endpoint for authenticated patients to view their own medical records
    @GetMapping("/my")
    @PreAuthorize("hasAnyAuthority('PATIENT', 'ROLE_PATIENT')")
    public List<MedicalRecord> getMyRecords(Authentication authentication) {
        return medicalRecordService.getRecordsByPatientUsername(authentication.getName());
    }

    // Endpoint to retrieve single medical record by ID (Staff can view any; Patient can only view their own)
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'DOCTOR', 'PATIENT', 'ROLE_ADMIN', 'ROLE_DOCTOR', 'ROLE_PATIENT')")
    public ResponseEntity<?> getRecordById(@PathVariable Long id, Authentication authentication) {
        MedicalRecord record = medicalRecordService.getRecordById(id).orElse(null);
        if (record == null) {
            return ResponseEntity.notFound().build();
        }

        if (isCallerPatientOnly(authentication)) {
            if (record.getPatient() == null || record.getPatient().getUser() == null
                    || !record.getPatient().getUser().getUsername().equals(authentication.getName())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Access denied: You are not authorized to view other patients' medical records.");
            }
        }

        return ResponseEntity.ok(record);
    }

    // Endpoint to retrieve medical records for a specific patient
    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'DOCTOR', 'PATIENT', 'ROLE_ADMIN', 'ROLE_DOCTOR', 'ROLE_PATIENT')")
    public ResponseEntity<?> getRecordsByPatientId(@PathVariable Long patientId, Authentication authentication) {
        List<MedicalRecord> list = medicalRecordService.getRecordsByPatientId(patientId);

        if (isCallerPatientOnly(authentication)) {
            boolean mismatch = list.stream().anyMatch(r -> r.getPatient() != null && r.getPatient().getUser() != null
                    && !r.getPatient().getUser().getUsername().equals(authentication.getName()));
            if (mismatch) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Access denied: You cannot view other patients' medical histories.");
            }
        }

        return ResponseEntity.ok(list);
    }

    // Endpoint for Pharmacists to view all prescriptions
    @GetMapping("/all-records")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'DOCTOR', 'PHARMACIST', 'ROLE_ADMIN', 'ROLE_DOCTOR', 'ROLE_PHARMACIST')")
    public List<MedicalRecord> getAllRecordsForPharmacy() {
        return medicalRecordService.getAllRecords();
    }

    // Endpoint for Pharmacists to mark a prescription as dispensed with batch deduction and billing
    @PutMapping("/{id}/dispense")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'PHARMACIST', 'ROLE_ADMIN', 'ROLE_PHARMACIST')")
    public ResponseEntity<?> dispenseRecord(
            @PathVariable Long id, 
            @RequestBody(required = false) Map<String, Object> payload) {
        try {
            Long medicineId = null;
            Integer quantity = null;
            if (payload != null) {
                if (payload.get("medicineId") != null && !payload.get("medicineId").toString().isEmpty()) {
                    medicineId = Long.parseLong(payload.get("medicineId").toString());
                }
                if (payload.get("quantity") != null && !payload.get("quantity").toString().isEmpty()) {
                    quantity = Integer.parseInt(payload.get("quantity").toString());
                }
            }
            MedicalRecord result = medicalRecordService.dispenseRecord(id, medicineId, quantity);
            return ResponseEntity.ok(result);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to dispense prescription: " + e.getMessage());
        }
    }

    private boolean isCallerPatientOnly(Authentication authentication) {
        if (authentication == null) return false;
        boolean hasPatient = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("PATIENT") || a.getAuthority().equals("ROLE_PATIENT"));
        boolean hasStaff = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().contains("ADMIN") || a.getAuthority().contains("DOCTOR") 
                            || a.getAuthority().contains("PHARMACIST"));
        return hasPatient && !hasStaff;
    }
}