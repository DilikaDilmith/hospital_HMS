package com.hospital.hms.repository;

import com.hospital.hms.entity.Bill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BillRepository extends JpaRepository<Bill, Long> {
    // Spring Data JPA provides built-in CRUD operations for the Bill entity
}