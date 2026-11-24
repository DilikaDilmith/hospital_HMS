package com.hospital.hms;

import com.hospital.hms.controller.StaffController;
import com.hospital.hms.entity.Attendance;
import com.hospital.hms.entity.Employee;
import com.hospital.hms.entity.LeaveRecord;
import com.hospital.hms.entity.Role;
import com.hospital.hms.entity.User;
import com.hospital.hms.repository.AttendanceRepository;
import com.hospital.hms.repository.EmployeeRepository;
import com.hospital.hms.repository.LeaveRecordRepository;
import com.hospital.hms.service.AuditLogService;
import com.hospital.hms.service.StaffService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class StaffEmployeeDeletionTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private AttendanceRepository attendanceRepository;

    @Mock
    private LeaveRecordRepository leaveRecordRepository;

    @Mock
    private AuditLogService auditLogService;

    private StaffService staffService;
    private StaffController staffController;

    private Employee employee;
    private User user;

    @BeforeEach
    void setUp() {
        staffService = new StaffService();
        staffService.setEmployeeRepository(employeeRepository);
        staffService.setAttendanceRepository(attendanceRepository);
        staffService.setLeaveRecordRepository(leaveRecordRepository);

        staffController = new StaffController();
        staffController.setStaffService(staffService);
        staffController.setAuditLogService(auditLogService);

        user = new User();
        user.setId(10L);
        user.setUsername("doctor1");
        user.setFullName("Dr. Sarah Perera");
        user.setRole(Role.DOCTOR);

        employee = new Employee();
        employee.setId(1L);
        employee.setUser(user);
        employee.setDesignation("Cardiologist");
        employee.setDepartment("Cardiology");
        employee.setStatus("ACTIVE");
    }

    @Test
    @DisplayName("StaffService: deleteEmployee cascades deletion to attendance and leave records")
    void testDeleteEmployeeCascadesChildRecords() {
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));

        staffService.deleteEmployee(1L);

        // Verify child attendances deleted
        verify(attendanceRepository, times(1)).deleteByEmployeeId(1L);
        verify(attendanceRepository, times(1)).flush();

        // Verify child leaves deleted
        verify(leaveRecordRepository, times(1)).deleteByEmployeeId(1L);
        verify(leaveRecordRepository, times(1)).flush();

        // Verify employee deleted
        verify(employeeRepository, times(1)).delete(employee);
        verify(employeeRepository, times(1)).flush();
    }

    @Test
    @DisplayName("StaffService: deleteEmployee throws exception if employee does not exist")
    void testDeleteEmployeeNotFound() {
        when(employeeRepository.findById(99L)).thenReturn(Optional.empty());

        Exception exception = assertThrows(RuntimeException.class, () -> {
            staffService.deleteEmployee(99L);
        });

        assertTrue(exception.getMessage().contains("Employee not found with ID: 99"));
        verify(employeeRepository, never()).delete(any());
    }

    @Test
    @DisplayName("StaffController: deleteEmployee returns 200 OK on successful deletion")
    void testControllerDeleteEmployeeSuccess() {
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));

        ResponseEntity<?> response = staffController.deleteEmployee(1L, null);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody() instanceof Map);
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertEquals("Employee record removed successfully.", body.get("message"));
    }

    @Test
    @DisplayName("StaffController: deleteEmployee returns 400 Bad Request on failure")
    void testControllerDeleteEmployeeFailure() {
        when(employeeRepository.findById(99L)).thenReturn(Optional.empty());

        ResponseEntity<?> response = staffController.deleteEmployee(99L, null);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertTrue(response.getBody() instanceof Map);
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertTrue(body.get("message").toString().contains("Failed to delete employee: Employee not found with ID: 99"));
    }
}
