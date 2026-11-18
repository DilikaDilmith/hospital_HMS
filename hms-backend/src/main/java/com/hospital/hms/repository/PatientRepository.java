package com.hospital.hms.repository;

import com.hospital.hms.entity.Patient;
import com.hospital.hms.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {

    // Find patient record linked to a specific User entity
    Optional<Patient> findByUser(User user);

    // Find patient record by the linked User's ID
    Optional<Patient> findByUserId(Long userId);

    // Find patient record by the linked User's username
    Optional<Patient> findByUserUsername(String username);

    // Check if patient with given NIC exists
    boolean existsByNic(String nic);

    // Check if patient with given NIC exists excluding a specific patient ID (for safe updates)
    boolean existsByNicAndIdNot(String nic, Long id);
}
