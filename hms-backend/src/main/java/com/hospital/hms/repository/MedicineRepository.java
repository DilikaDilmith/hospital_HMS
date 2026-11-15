package com.hospital.hms.repository;

import com.hospital.hms.entity.Medicine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MedicineRepository extends JpaRepository<Medicine, Long> {
    // Count medicines where stock quantity is less than a certain threshold (e.g., 50)
    long countByStockQuantityLessThan(int threshold);
}