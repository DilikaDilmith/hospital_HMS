package com.hospital.hms.repository;

import com.hospital.hms.entity.LabTest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LabTestRepository extends JpaRepository<LabTest, Long> {
    // Count how many tests are currently in "REQUESTED" status
    long countByStatus(String status);
}