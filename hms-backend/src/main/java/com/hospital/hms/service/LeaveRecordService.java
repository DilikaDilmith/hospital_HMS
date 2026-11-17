package com.hospital.hms.service;

import com.hospital.hms.dto.LeaveRequest;
import com.hospital.hms.entity.Employee;
import com.hospital.hms.entity.LeaveRecord;
import com.hospital.hms.repository.EmployeeRepository;
import com.hospital.hms.repository.LeaveRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class LeaveRecordService {

    @Autowired
    private LeaveRecordRepository leaveRecordRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    // Retrieve all leave records, newest first
    public List<LeaveRecord> getAllLeaveRecords() {
        return leaveRecordRepository.findAllByOrderByStartDateDesc();
    }

    // Retrieve single leave record by ID
    public Optional<LeaveRecord> getLeaveRecordById(Long id) {
        return leaveRecordRepository.findById(id);
    }

    // Retrieve leave records for a specific employee
    public List<LeaveRecord> getLeaveRecordsByEmployeeId(Long employeeId) {
        return leaveRecordRepository.findByEmployeeIdOrderByStartDateDesc(employeeId);
    }

    // Create a new leave record with strict field and date validation
    @Transactional
    public LeaveRecord createLeaveRecord(LeaveRequest request) {
        // 1. Validate employee
        if (request == null) {
            throw new IllegalArgumentException("Leave request details are required.");
        }
        if (request.getEmployeeId() == null) {
            throw new IllegalArgumentException("Please select an employee.");
        }

        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new IllegalArgumentException("Employee not found with ID: " + request.getEmployeeId()));

        // 2. Validate leave type
        if (request.getLeaveType() == null || request.getLeaveType().trim().isEmpty()) {
            throw new IllegalArgumentException("Leave type is required (e.g. SICK, CASUAL, ANNUAL).");
        }

        // 3. Validate dates
        if (request.getStartDate() == null) {
            throw new IllegalArgumentException("Leave start date is required.");
        }
        if (request.getEndDate() == null) {
            throw new IllegalArgumentException("Leave end date is required.");
        }
        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new IllegalArgumentException("Leave end date cannot be earlier than start date.");
        }

        // 4. Validate reason
        if (request.getReason() == null || request.getReason().trim().isEmpty()) {
            throw new IllegalArgumentException("Reason for leave is required.");
        }

        // 5. Construct and save
        LeaveRecord record = new LeaveRecord();
        record.setEmployee(employee);
        record.setLeaveType(request.getLeaveType().trim().toUpperCase());
        record.setStartDate(request.getStartDate());
        record.setEndDate(request.getEndDate());
        record.setReason(request.getReason().trim());
        
        String status = (request.getStatus() != null && !request.getStatus().trim().isEmpty())
                ? request.getStatus().trim().toUpperCase()
                : "APPROVED";
        record.setStatus(status);

        LeaveRecord saved = leaveRecordRepository.save(record);

        // Sync employee status
        syncEmployeeStatus(employee);

        return saved;
    }

    // Update an existing leave record
    @Transactional
    public LeaveRecord updateLeaveRecord(Long id, LeaveRequest request) {
        LeaveRecord existing = leaveRecordRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Leave record not found with ID: " + id));

        if (request == null) {
            return existing;
        }

        Employee oldEmployee = existing.getEmployee();
        Employee newEmployee = oldEmployee;

        // Update employee if specified
        if (request.getEmployeeId() != null && !request.getEmployeeId().equals(oldEmployee.getId())) {
            newEmployee = employeeRepository.findById(request.getEmployeeId())
                    .orElseThrow(() -> new IllegalArgumentException("Employee not found with ID: " + request.getEmployeeId()));
            existing.setEmployee(newEmployee);
        }

        // Update leave type
        if (request.getLeaveType() != null) {
            if (request.getLeaveType().trim().isEmpty()) {
                throw new IllegalArgumentException("Leave type cannot be empty.");
            }
            existing.setLeaveType(request.getLeaveType().trim().toUpperCase());
        }

        // Determine effective start and end dates
        LocalDate newStart = request.getStartDate() != null ? request.getStartDate() : existing.getStartDate();
        LocalDate newEnd = request.getEndDate() != null ? request.getEndDate() : existing.getEndDate();

        if (newEnd.isBefore(newStart)) {
            throw new IllegalArgumentException("Leave end date cannot be earlier than start date.");
        }

        existing.setStartDate(newStart);
        existing.setEndDate(newEnd);

        // Update reason
        if (request.getReason() != null) {
            if (request.getReason().trim().isEmpty()) {
                throw new IllegalArgumentException("Reason for leave cannot be empty.");
            }
            existing.setReason(request.getReason().trim());
        }

        // Update status
        if (request.getStatus() != null && !request.getStatus().trim().isEmpty()) {
            existing.setStatus(request.getStatus().trim().toUpperCase());
        }

        LeaveRecord saved = leaveRecordRepository.save(existing);

        // Sync status for both old and new employee (if changed)
        syncEmployeeStatus(oldEmployee);
        if (!newEmployee.getId().equals(oldEmployee.getId())) {
            syncEmployeeStatus(newEmployee);
        }

        return saved;
    }

    // Delete a leave record
    @Transactional
    public void deleteLeaveRecord(Long id) {
        LeaveRecord existing = leaveRecordRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Leave record not found with ID: " + id));
        Employee employee = existing.getEmployee();
        leaveRecordRepository.delete(existing);

        // Sync employee status after deletion
        syncEmployeeStatus(employee);
    }

    // Helper: Sync employee status based on active APPROVED leaves covering today
    private void syncEmployeeStatus(Employee employee) {
        if (employee == null || employee.getId() == null) return;
        LocalDate today = LocalDate.now();
        List<LeaveRecord> approvedLeaves = leaveRecordRepository.findByEmployeeIdAndStatus(employee.getId(), "APPROVED");
        boolean onLeaveNow = approvedLeaves.stream().anyMatch(l -> 
                !today.isBefore(l.getStartDate()) && !today.isAfter(l.getEndDate())
        );

        if (onLeaveNow) {
            if (!"ON_LEAVE".equals(employee.getStatus())) {
                employee.setStatus("ON_LEAVE");
                employeeRepository.save(employee);
            }
        } else if ("ON_LEAVE".equals(employee.getStatus())) {
            employee.setStatus("ACTIVE");
            employeeRepository.save(employee);
        }
    }
}
