package com.hospital.hms.controller;

import com.hospital.hms.entity.MedicalRecord;
import com.hospital.hms.service.MedicalRecordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize; 
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/medical-records")
public class MedicalRecordController {

    @Autowired
    private MedicalRecordService medicalRecordService;

    // Endpoint to create a new medical record (Only Doctors and Admins can create)
    @PostMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'DOCTOR', 'ROLE_ADMIN', 'ROLE_DOCTOR')")
    public MedicalRecord createRecord(@RequestBody MedicalRecord record) {
        return medicalRecordService.createRecord(record);
    }

    // Endpoint to get all medical records (General)
    @GetMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'DOCTOR', 'ROLE_ADMIN', 'ROLE_DOCTOR')")
    public List<MedicalRecord> getAllRecords() {
        return medicalRecordService.getAllRecords();
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
    public MedicalRecord dispenseRecord(
            @PathVariable Long id, 
            @RequestBody(required = false) Map<String, Object> payload) {
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
        return medicalRecordService.dispenseRecord(id, medicineId, quantity);
    }
}