package com.hospital.hms.repository;

import com.hospital.hms.entity.Medicine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MedicineRepository extends JpaRepository<Medicine, Long> {
    // Spring Data JPA provides built-in CRUD operations for the Medicine entity
}