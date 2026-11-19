package com.hospital.hms.service;

import com.hospital.hms.entity.MedicalRecord;
import com.hospital.hms.entity.Patient;
import com.hospital.hms.entity.User;
import com.hospital.hms.repository.MedicalRecordRepository;
import com.hospital.hms.repository.PatientRepository;
import com.hospital.hms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
public class MedicalRecordService {

    @Autowired
    private MedicalRecordRepository medicalRecordRepository;

    @Autowired
    private MedicineService medicineService;

    @Autowired
    private InvoiceService invoiceService;

    @Autowired(required = false)
    private PatientRepository patientRepository;

    @Autowired(required = false)
    private UserRepository userRepository;

    public void setMedicalRecordRepository(MedicalRecordRepository medicalRecordRepository) {
        this.medicalRecordRepository = medicalRecordRepository;
    }

    public void setPatientRepository(PatientRepository patientRepository) {
        this.patientRepository = patientRepository;
    }

    public void setUserRepository(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // Create a new medical record
    public MedicalRecord createRecord(MedicalRecord record) {
        if (record.getRecordDate() == null) {
            record.setRecordDate(LocalDateTime.now());
        }
        record.setStatus("PENDING"); 
        return medicalRecordRepository.save(record);
    }

    // Get all medical records
    public List<MedicalRecord> getAllRecords() {
        return medicalRecordRepository.findAll();
    }

    // Get medical records for a patient by username (scoped to authenticated user)
    public List<MedicalRecord> getRecordsByPatientUsername(String username) {
        if (username == null || username.trim().isEmpty()) {
            return Collections.emptyList();
        }
        String cleanUsername = username.trim();
        List<MedicalRecord> list = medicalRecordRepository.findByPatientUserUsernameOrderByRecordDateDesc(cleanUsername);
        if (!list.isEmpty()) {
            return list;
        }

        if (patientRepository != null) {
            Optional<Patient> p = patientRepository.findByUserUsername(cleanUsername);
            if (p.isEmpty() && userRepository != null) {
                User u = userRepository.findByUsername(cleanUsername).orElse(null);
                if (u != null) {
                    p = patientRepository.findByUserId(u.getId());
                }
            }
            if (p.isPresent()) {
                return medicalRecordRepository.findByPatientIdOrderByRecordDateDesc(p.get().getId());
            }
        }

        return Collections.emptyList();
    }

    // Get medical records for a specific patient ID
    public List<MedicalRecord> getRecordsByPatientId(Long patientId) {
        return medicalRecordRepository.findByPatientIdOrderByRecordDateDesc(patientId);
    }

    // Get single medical record by ID
    public java.util.Optional<MedicalRecord> getRecordById(Long id) {
        return medicalRecordRepository.findById(id);
    }

    // Update status to DISPENSED, deduct from earliest expiring valid batch (FEFO), and auto-bill atomically
    @Transactional
    public MedicalRecord dispenseRecord(Long id, Long medicineId, Integer quantity) {
        MedicalRecord record = medicalRecordRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Record not found with id: " + id));

        if ("DISPENSED".equalsIgnoreCase(record.getStatus())) {
            throw new IllegalStateException("Prescription #" + id + " has already been dispensed.");
        }

        // Deduct from batch and auto-bill if medicine was selected
        if (medicineId != null && quantity != null && quantity > 0) {
            medicineService.dispenseMedicine(medicineId, quantity, record.getPatient());
        } else if (record.getPatient() != null) {
            // General prescription dispensing charge
            String medName = (record.getPrescription() != null && !record.getPrescription().trim().isEmpty())
                    ? record.getPrescription().trim()
                    : "Prescribed Medication";
            invoiceService.addPharmacyFee(record.getPatient(), medName, 1, 1200.0);
        }

        record.setStatus("DISPENSED");
        return medicalRecordRepository.save(record);
    }
}