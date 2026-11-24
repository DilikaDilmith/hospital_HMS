package com.hospital.hms.repository;

import com.hospital.hms.entity.LeaveRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface LeaveRecordRepository extends JpaRepository<LeaveRecord, Long> {

    // Retrieve all leave records, newest first
    List<LeaveRecord> findAllByOrderByStartDateDesc();

    // Delete all leave records for an employee
    @Modifying
    @Transactional
    @Query("DELETE FROM LeaveRecord l WHERE l.employee.id = :employeeId")
    void deleteByEmployeeId(@Param("employeeId") Long employeeId);

    // Retrieve leave records for a specific employee
    List<LeaveRecord> findByEmployeeIdOrderByStartDateDesc(Long employeeId);

    // Retrieve leave records by status
    List<LeaveRecord> findByStatusOrderByStartDateDesc(String status);

    // Retrieve leave records for a specific employee by status
    List<LeaveRecord> findByEmployeeIdAndStatus(Long employeeId, String status);
}
