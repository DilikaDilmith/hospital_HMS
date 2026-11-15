package com.hospital.hms.controller;

import com.hospital.hms.entity.MedicalRecord;
import com.hospital.hms.service.MedicalRecordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/medical-records")
public class MedicalRecordController {

    @Autowired
    private MedicalRecordService medicalRecordService;

    // Endpoint to create a new medical record
    @PostMapping
    public MedicalRecord createRecord(@RequestBody MedicalRecord record) {
        return medicalRecordService.createRecord(record);
    }

    // Endpoint to get all medical records
    @GetMapping
    public List<MedicalRecord> getAllRecords() {
        return medicalRecordService.getAllRecords();
    }
}