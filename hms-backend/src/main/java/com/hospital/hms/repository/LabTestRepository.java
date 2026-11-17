package com.hospital.hms.repository;

import com.hospital.hms.entity.LabTest;
import com.hospital.hms.entity.LabTestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LabTestRepository extends JpaRepository<LabTest, Long> {

    // Count how many tests are currently in a given status (e.g., REQUESTED)
    long countByStatus(LabTestStatus status);

    // Retrieve all tests ordered by latest requested time
    List<LabTest> findAllByOrderByRequestedAtDesc();

    // Retrieve all tests for a specific patient
    List<LabTest> findByPatientIdOrderByRequestedAtDesc(Long patientId);

    // Retrieve all tests ordered by a specific doctor
    List<LabTest> findByDoctorIdOrderByRequestedAtDesc(Long doctorId);

    // Retrieve tests filtered by status
    List<LabTest> findByStatusOrderByRequestedAtDesc(LabTestStatus status);
}