package com.hospital.hms.controller;

import com.hospital.hms.dto.AttendanceRequest;
import com.hospital.hms.dto.EmployeeRequest;
import com.hospital.hms.dto.LeaveRequest;
import com.hospital.hms.entity.Attendance;
import com.hospital.hms.entity.Employee;
import com.hospital.hms.entity.LeaveRecord;
import com.hospital.hms.entity.User;
import com.hospital.hms.service.AuditLogService;
import com.hospital.hms.service.LeaveRecordService;
import com.hospital.hms.service.StaffService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/staff")
public class StaffController {

    @Autowired
    private StaffService staffService;

    @Autowired
    private LeaveRecordService leaveRecordService;

    @Autowired
    private AuditLogService auditLogService;

    public void setStaffService(StaffService staffService) {
        this.staffService = staffService;
    }

    public void setLeaveRecordService(LeaveRecordService leaveRecordService) {
        this.leaveRecordService = leaveRecordService;
    }

    public void setAuditLogService(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    // 1. Get all employees (Admin, Doctors, Receptionists, HR)
    @GetMapping("/employees")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN', 'DOCTOR', 'ROLE_DOCTOR', 'RECEPTIONIST', 'ROLE_RECEPTIONIST', 'NURSE', 'ROLE_NURSE')")
    public ResponseEntity<List<Employee>> getAllEmployees() {
        return ResponseEntity.ok(staffService.getAllEmployees());
    }

    // 2. Get single employee by ID
    @GetMapping("/employees/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN', 'DOCTOR', 'ROLE_DOCTOR', 'RECEPTIONIST', 'ROLE_RECEPTIONIST')")
    public ResponseEntity<?> getEmployeeById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(staffService.getEmployeeById(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Employee not found: " + e.getMessage());
        }
    }

    // 3. Get approved staff users without an employee profile (Admin only)
    @GetMapping("/unassigned-users")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<List<User>> getUnassignedUsers() {
        return ResponseEntity.ok(staffService.getUnassignedUsers());
    }

    // 4. Create an employee profile (Admin only)
    @PostMapping("/employees")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<?> createEmployee(@RequestBody EmployeeRequest request, Authentication authentication) {
        String actor = (authentication != null) ? authentication.getName() : "ADMIN";
        try {
            Employee created = staffService.createEmployee(request);
            if (auditLogService != null) {
                auditLogService.log(actor, "STAFF_CREATE", "SUCCESS",
                        "Created staff employee profile ID: " + created.getId() + " (" + created.getDesignation() + " - " + created.getDepartment() + ")");
            }
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            if (auditLogService != null) {
                auditLogService.log(actor, "STAFF_CREATE", "FAILED", "Failed to create staff employee: " + e.getMessage());
            }
            return ResponseEntity.badRequest().body("Failed to create employee: " + e.getMessage());
        }
    }

    public ResponseEntity<?> createEmployee(EmployeeRequest request) {
        return createEmployee(request, null);
    }

    // 5. Update an employee profile (Admin only)
    @PutMapping("/employees/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<?> updateEmployee(@PathVariable Long id, @RequestBody EmployeeRequest request, Authentication authentication) {
        String actor = (authentication != null) ? authentication.getName() : "ADMIN";
        try {
            Employee updated = staffService.updateEmployee(id, request);
            if (auditLogService != null) {
                auditLogService.log(actor, "STAFF_UPDATE", "SUCCESS",
                        "Updated staff employee ID: " + id + " (" + updated.getDesignation() + ")");
            }
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            if (auditLogService != null) {
                auditLogService.log(actor, "STAFF_UPDATE", "FAILED", "Failed to update staff employee ID: " + id + " - " + e.getMessage());
            }
            return ResponseEntity.badRequest().body("Failed to update employee: " + e.getMessage());
        }
    }

    public ResponseEntity<?> updateEmployee(Long id, EmployeeRequest request) {
        return updateEmployee(id, request, null);
    }

    // 6. Delete an employee record (Admin only)
    @DeleteMapping("/employees/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<?> deleteEmployee(@PathVariable Long id, Authentication authentication) {
        String actor = (authentication != null) ? authentication.getName() : "ADMIN";
        try {
            staffService.deleteEmployee(id);
            if (auditLogService != null) {
                auditLogService.log(actor, "STAFF_DELETE", "SUCCESS", "Removed staff employee ID: " + id);
            }
            return ResponseEntity.ok(Map.of("message", "Employee record removed successfully."));
        } catch (Exception e) {
            if (auditLogService != null) {
                auditLogService.log(actor, "STAFF_DELETE", "FAILED", "Failed to delete staff employee ID: " + id + " - " + e.getMessage());
            }
            return ResponseEntity.badRequest().body(Map.of("message", "Failed to delete employee: " + e.getMessage()));
        }
    }

    public ResponseEntity<?> deleteEmployee(Long id) {
        return deleteEmployee(id, null);
    }

    // 7. Get attendance logs (supports optional ?date=YYYY-MM-DD or ?employeeId=ID)
    @GetMapping("/attendance")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN', 'DOCTOR', 'ROLE_DOCTOR', 'RECEPTIONIST', 'ROLE_RECEPTIONIST', 'NURSE', 'ROLE_NURSE')")
    public ResponseEntity<List<Attendance>> getAttendance(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) Long employeeId) {
        
        if (employeeId != null) {
            return ResponseEntity.ok(staffService.getAttendanceByEmployee(employeeId));
        }
        if (date != null) {
            return ResponseEntity.ok(staffService.getAttendanceByDate(date));
        }
        return ResponseEntity.ok(staffService.getAllAttendance());
    }

    // 8. Record or edit attendance manually
    @PostMapping("/attendance")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<?> recordAttendance(@RequestBody AttendanceRequest request) {
        try {
            Attendance recorded = staffService.recordAttendance(request);
            return ResponseEntity.ok(recorded);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to record attendance: " + e.getMessage());
        }
    }

    // 9. Quick check-in for an employee
    @PostMapping("/attendance/check-in")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<?> markCheckIn(@RequestBody Map<String, Object> payload) {
        try {
            Long employeeId = Long.valueOf(payload.get("employeeId").toString());
            String time = (payload.get("time") != null) ? payload.get("time").toString() : null;
            String notes = (payload.get("notes") != null) ? payload.get("notes").toString() : null;
            Attendance att = staffService.markCheckIn(employeeId, time, notes);
            return ResponseEntity.ok(att);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Check-in failed: " + e.getMessage());
        }
    }

    // 10. Quick check-out for an employee
    @PostMapping("/attendance/check-out")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<?> markCheckOut(@RequestBody Map<String, Object> payload) {
        try {
            Long employeeId = Long.valueOf(payload.get("employeeId").toString());
            String time = (payload.get("time") != null) ? payload.get("time").toString() : null;
            Attendance att = staffService.markCheckOut(employeeId, time);
            return ResponseEntity.ok(att);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Check-out failed: " + e.getMessage());
        }
    }

    // ==================== Leave Records Management ====================

    // 11. Get all leave records (Admin only)
    @GetMapping("/leaves")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<List<LeaveRecord>> getAllLeaveRecords() {
        return ResponseEntity.ok(leaveRecordService.getAllLeaveRecords());
    }

    // 12. Get single leave record by ID (Admin only)
    @GetMapping("/leaves/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<?> getLeaveRecordById(@PathVariable Long id) {
        try {
            return leaveRecordService.getLeaveRecordById(id)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error retrieving leave record: " + e.getMessage());
        }
    }

    // 13. Get leave records for a specific employee (Admin only)
    @GetMapping("/leaves/employee/{employeeId}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<List<LeaveRecord>> getLeaveRecordsByEmployee(@PathVariable Long employeeId) {
        return ResponseEntity.ok(leaveRecordService.getLeaveRecordsByEmployeeId(employeeId));
    }

    // 14. Create a new leave record (Admin only)
    @PostMapping("/leaves")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<?> createLeaveRecord(@RequestBody LeaveRequest request, Authentication authentication) {
        String actor = (authentication != null) ? authentication.getName() : "ADMIN";
        try {
            LeaveRecord created = leaveRecordService.createLeaveRecord(request);
            if (auditLogService != null) {
                auditLogService.log(actor, "STAFF_LEAVE_CREATE", "SUCCESS",
                        "Created " + created.getLeaveType() + " leave for employee ID: " + created.getEmployee().getId());
            }
            return ResponseEntity.ok(created);
        } catch (IllegalArgumentException e) {
            if (auditLogService != null) {
                auditLogService.log(actor, "STAFF_LEAVE_CREATE", "FAILED", e.getMessage());
            }
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            if (auditLogService != null) {
                auditLogService.log(actor, "STAFF_LEAVE_CREATE", "FAILED", e.getMessage());
            }
            return ResponseEntity.badRequest().body("Failed to create leave record: " + e.getMessage());
        }
    }

    public ResponseEntity<?> createLeaveRecord(LeaveRequest request) {
        return createLeaveRecord(request, null);
    }

    // 15. Update an existing leave record (Admin only)
    @PutMapping("/leaves/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<?> updateLeaveRecord(@PathVariable Long id, @RequestBody LeaveRequest request, Authentication authentication) {
        String actor = (authentication != null) ? authentication.getName() : "ADMIN";
        try {
            LeaveRecord updated = leaveRecordService.updateLeaveRecord(id, request);
            if (auditLogService != null) {
                auditLogService.log(actor, "STAFF_LEAVE_UPDATE", "SUCCESS",
                        "Updated leave record ID: " + id + " (Status: " + updated.getStatus() + ")");
            }
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            if (auditLogService != null) {
                auditLogService.log(actor, "STAFF_LEAVE_UPDATE", "FAILED", e.getMessage());
            }
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            if (auditLogService != null) {
                auditLogService.log(actor, "STAFF_LEAVE_UPDATE", "FAILED", e.getMessage());
            }
            return ResponseEntity.badRequest().body("Failed to update leave record: " + e.getMessage());
        }
    }

    public ResponseEntity<?> updateLeaveRecord(Long id, LeaveRequest request) {
        return updateLeaveRecord(id, request, null);
    }

    // 16. Delete a leave record (Admin only)
    @DeleteMapping("/leaves/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<?> deleteLeaveRecord(@PathVariable Long id, Authentication authentication) {
        String actor = (authentication != null) ? authentication.getName() : "ADMIN";
        try {
            leaveRecordService.deleteLeaveRecord(id);
            if (auditLogService != null) {
                auditLogService.log(actor, "STAFF_LEAVE_DELETE", "SUCCESS", "Deleted leave record ID: " + id);
            }
            return ResponseEntity.ok("Leave record deleted successfully.");
        } catch (IllegalArgumentException e) {
            if (auditLogService != null) {
                auditLogService.log(actor, "STAFF_LEAVE_DELETE", "FAILED", e.getMessage());
            }
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            if (auditLogService != null) {
                auditLogService.log(actor, "STAFF_LEAVE_DELETE", "FAILED", e.getMessage());
            }
            return ResponseEntity.badRequest().body("Failed to delete leave record: " + e.getMessage());
        }
    }

    public ResponseEntity<?> deleteLeaveRecord(Long id) {
        return deleteLeaveRecord(id, null);
    }
}
