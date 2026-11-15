package com.hospital.hms.repository;

import com.hospital.hms.entity.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Long> {
    // Spring Data JPA provides built-in CRUD operations for the Doctor entity
}