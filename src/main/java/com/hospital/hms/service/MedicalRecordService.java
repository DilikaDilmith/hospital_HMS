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
        return medicalRecordRepository.save(record);
    }

    // Get all medical records
    public List<MedicalRecord> getAllRecords() {
        return medicalRecordRepository.findAll();
    }
}