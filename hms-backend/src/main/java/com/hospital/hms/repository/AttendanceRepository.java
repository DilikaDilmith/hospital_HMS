package com.hospital.hms.repository;

import com.hospital.hms.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    // Retrieve attendance history for an employee
    List<Attendance> findByEmployeeIdOrderByDateDesc(Long employeeId);

    // Retrieve all attendance entries for a given date
    List<Attendance> findByDateOrderByCheckInTimeAsc(LocalDate date);

    // Retrieve attendance for an employee on a specific date
    Optional<Attendance> findByEmployeeIdAndDate(Long employeeId, LocalDate date);

    // Retrieve all attendance ordered by newest date
    List<Attendance> findAllByOrderByDateDesc();

    // Count present staff on a given date (excluding ABSENT)
    long countByDateAndStatusNot(LocalDate date, String status);

    // Count records for a given date
    long countByDate(LocalDate date);
}
