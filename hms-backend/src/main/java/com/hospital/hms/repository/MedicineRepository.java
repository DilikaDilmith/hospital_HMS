package com.hospital.hms.repository;

import com.hospital.hms.entity.Medicine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MedicineRepository extends JpaRepository<Medicine, Long> {

    // Count medicines where stock quantity is less than a certain threshold (e.g., 50)
    long countByStockQuantityLessThan(int threshold);

    // Medicine lookup for dispensing (compatible across MySQL and MariaDB)
    @Query("SELECT m FROM Medicine m WHERE m.id = :id")
    Optional<Medicine> findByIdForUpdate(@Param("id") Long id);
}