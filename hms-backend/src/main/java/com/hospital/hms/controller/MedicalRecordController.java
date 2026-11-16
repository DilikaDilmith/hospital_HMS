package com.hospital.hms.controller;

import com.hospital.hms.entity.MedicalRecord;
import com.hospital.hms.service.MedicalRecordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize; // <-- අලුතෙන් එකතු කරන්න
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/medical-records")
public class MedicalRecordController {

    @Autowired
    private MedicalRecordService medicalRecordService;

    // Endpoint to create a new medical record (Only Doctors and Admins can create)
    @PostMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'DOCTOR')")
    public MedicalRecord createRecord(@RequestBody MedicalRecord record) {
        return medicalRecordService.createRecord(record);
    }

    // Endpoint to get all medical records (General)
    @GetMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'DOCTOR')")
    public List<MedicalRecord> getAllRecords() {
        return medicalRecordService.getAllRecords();
    }

    // NEW Endpoint for Pharmacists to view all prescriptions
    @GetMapping("/all-records")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'DOCTOR', 'PHARMACIST')")
    public List<MedicalRecord> getAllRecordsForPharmacy() {
        return medicalRecordService.getAllRecords();
    }

    // Endpoint for Pharmacists to mark a prescription as dispensed
    @PutMapping("/{id}/dispense")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'PHARMACIST')")
    public MedicalRecord dispenseRecord(@PathVariable Long id) {
        return medicalRecordService.dispenseRecord(id);
    }
}