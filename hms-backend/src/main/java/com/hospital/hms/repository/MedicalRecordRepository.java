package com.hospital.hms.repository;

import com.hospital.hms.entity.MedicalRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, Long> {
    // Find all medical records ordered by date (newest first)
    List<MedicalRecord> findAllByOrderByRecordDateDesc();

    // Find records by their status (e.g., only show PENDING ones to pharmacist)
    List<MedicalRecord> findByStatus(String status);

    // Find all medical records for a specific patient
    List<MedicalRecord> findByPatientIdOrderByRecordDateDesc(Long patientId);

    // Find all medical records for a patient by username
    List<MedicalRecord> findByPatientUserUsernameOrderByRecordDateDesc(String username);

    // Count medical records created by a specific doctor
    long countByDoctorId(Long doctorId);
}