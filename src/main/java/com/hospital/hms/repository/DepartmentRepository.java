package com.hospital.hms.repository;

import com.hospital.hms.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {
    // Spring Data JPA provides built-in CRUD operations for the Department entity
}