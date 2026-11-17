package com.hospital.hms.controller;

import com.hospital.hms.dto.AttendanceRequest;
import com.hospital.hms.dto.EmployeeRequest;
import com.hospital.hms.entity.Attendance;
import com.hospital.hms.entity.Employee;
import com.hospital.hms.entity.User;
import com.hospital.hms.service.StaffService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/staff")
public class StaffController {

    @Autowired
    private StaffService staffService;

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
    public ResponseEntity<?> createEmployee(@RequestBody EmployeeRequest request) {
        try {
            Employee created = staffService.createEmployee(request);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to create employee: " + e.getMessage());
        }
    }

    // 5. Update an employee profile (Admin only)
    @PutMapping("/employees/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<?> updateEmployee(@PathVariable Long id, @RequestBody EmployeeRequest request) {
        try {
            Employee updated = staffService.updateEmployee(id, request);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to update employee: " + e.getMessage());
        }
    }

    // 6. Delete an employee record (Admin only)
    @DeleteMapping("/employees/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<?> deleteEmployee(@PathVariable Long id) {
        try {
            staffService.deleteEmployee(id);
            return ResponseEntity.ok("Employee record removed successfully.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to delete employee: " + e.getMessage());
        }
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
}
