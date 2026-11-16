package com.hospital.hms.service;

import com.hospital.hms.entity.MedicalRecord;
import com.hospital.hms.repository.MedicalRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class MedicalRecordService {

    @Autowired
    private MedicalRecordRepository medicalRecordRepository;

    // Create a new medical record
    public MedicalRecord createRecord(MedicalRecord record) {
        // Set the record date to current time if not provided
        if (record.getRecordDate() == null) {
            record.setRecordDate(LocalDateTime.now());
        }
        // Set default status to PENDING when a doctor creates it
        record.setStatus("PENDING"); 
        return medicalRecordRepository.save(record);
    }

    // Get all medical records
    public List<MedicalRecord> getAllRecords() {
        return medicalRecordRepository.findAll();
    }

    // Update the status of a medical record to DISPENSED
    public MedicalRecord dispenseRecord(Long id) {
        MedicalRecord record = medicalRecordRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Record not found with id: " + id));
        record.setStatus("DISPENSED");
        return medicalRecordRepository.save(record);
    }
}