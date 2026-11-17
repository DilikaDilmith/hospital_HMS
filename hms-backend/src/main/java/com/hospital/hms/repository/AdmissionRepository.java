package com.hospital.hms.repository;

import com.hospital.hms.entity.Admission;
import com.hospital.hms.entity.AdmissionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AdmissionRepository extends JpaRepository<Admission, Long> {

    // Retrieve active or discharged admissions
    List<Admission> findByStatusOrderByAdmissionDateDesc(AdmissionStatus status);

    // Retrieve all admissions ordered by date
    List<Admission> findAllByOrderByAdmissionDateDesc();

    // Retrieve admissions for a specific patient
    List<Admission> findByPatientIdOrderByAdmissionDateDesc(Long patientId);

    // Retrieve admissions for a patient by user username
    List<Admission> findByPatientUserUsernameOrderByAdmissionDateDesc(String username);

    // Retrieve admissions assigned to a doctor
    List<Admission> findByDoctorIdOrderByAdmissionDateDesc(Long doctorId);

    // Find active admission for a bed
    Optional<Admission> findFirstByBedIdAndStatus(Long bedId, AdmissionStatus status);

    // Check if a bed currently has an active admission
    boolean existsByBedIdAndStatus(Long bedId, AdmissionStatus status);

    // Check if a patient currently has an active admission
    boolean existsByPatientIdAndStatus(Long patientId, AdmissionStatus status);
}
