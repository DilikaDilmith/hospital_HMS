package com.hospital.hms.repository;

import com.hospital.hms.entity.Appointment;
import com.hospital.hms.entity.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    // Retrieve all appointments for a specific patient
    List<Appointment> findByPatientId(Long patientId);

    // Retrieve all appointments for a patient ordered by newest first
    List<Appointment> findByPatientIdOrderByAppointmentDateTimeDesc(Long patientId);

    // Retrieve appointments for a patient by username
    List<Appointment> findByPatientUserUsernameOrderByAppointmentDateTimeDesc(String username);

    // Retrieve all appointments for a specific doctor
    List<Appointment> findByDoctorId(Long doctorId);

    // Retrieve appointments filtered by status
    List<Appointment> findByStatus(AppointmentStatus status);

    // Count appointments by status
    long countByStatus(AppointmentStatus status);

    // Check if an active appointment already exists for a doctor at a specific date and time (excluding a status like CANCELLED)
    @Query("SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END FROM Appointment a " +
           "WHERE a.doctor.id = :doctorId " +
           "AND a.appointmentDateTime = :appointmentDateTime " +
           "AND a.status <> :status")
    boolean existsByDoctorIdAndAppointmentDateTimeAndStatusNot(
            @Param("doctorId") Long doctorId,
            @Param("appointmentDateTime") LocalDateTime appointmentDateTime,
            @Param("status") AppointmentStatus status);

    // Check if an active appointment already exists for a doctor at a specific date and time excluding a specific appointment ID
    @Query("SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END FROM Appointment a " +
           "WHERE a.doctor.id = :doctorId " +
           "AND a.appointmentDateTime = :appointmentDateTime " +
           "AND a.status <> :status " +
           "AND a.id <> :id")
    boolean existsByDoctorIdAndAppointmentDateTimeAndStatusNotAndIdNot(
            @Param("doctorId") Long doctorId,
            @Param("appointmentDateTime") LocalDateTime appointmentDateTime,
            @Param("status") AppointmentStatus status,
            @Param("id") Long id);
}
