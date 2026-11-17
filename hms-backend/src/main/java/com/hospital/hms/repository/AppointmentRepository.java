package com.hospital.hms.repository;

import com.hospital.hms.entity.Appointment;
import com.hospital.hms.entity.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    // Retrieve all appointments for a specific patient
    List<Appointment> findByPatientId(Long patientId);

    // Retrieve all appointments for a specific doctor
    List<Appointment> findByDoctorId(Long doctorId);

    // Retrieve appointments filtered by status
    List<Appointment> findByStatus(AppointmentStatus status);

    // Count appointments by status
    long countByStatus(AppointmentStatus status);
}
