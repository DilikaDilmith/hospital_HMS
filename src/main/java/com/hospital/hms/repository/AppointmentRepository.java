package com.hospital.hms.repository;

import com.hospital.hms.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    // Spring Data JPA provides built-in CRUD operations for the Appointment entity
}