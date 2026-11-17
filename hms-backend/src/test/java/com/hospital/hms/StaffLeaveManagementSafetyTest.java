package com.hospital.hms;

import com.hospital.hms.controller.StaffController;
import com.hospital.hms.dto.LeaveRequest;
import com.hospital.hms.entity.Employee;
import com.hospital.hms.entity.LeaveRecord;
import com.hospital.hms.entity.Role;
import com.hospital.hms.entity.User;
import com.hospital.hms.repository.EmployeeRepository;
import com.hospital.hms.repository.LeaveRecordRepository;
import com.hospital.hms.service.LeaveRecordService;
import com.hospital.hms.service.StaffService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class StaffLeaveManagementSafetyTest {

    @Mock
    private LeaveRecordRepository leaveRecordRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private StaffService staffService;

    @InjectMocks
    private LeaveRecordService leaveRecordService;

    private StaffController staffController;

    private Employee employee;
    private User employeeUser;

    @BeforeEach
    void setUp() {
        staffController = new StaffController();
        staffController.setStaffService(staffService);
        staffController.setLeaveRecordService(leaveRecordService);

        employeeUser = new User();
        employeeUser.setId(101L);
        employeeUser.setUsername("nurse_sarah");
        employeeUser.setFullName("Sarah Perera");
        employeeUser.setRole(Role.NURSE);

        employee = new Employee();
        employee.setId(1L);
        employee.setUser(employeeUser);
        employee.setDesignation("Registered Nurse");
        employee.setDepartment("Inpatient & ICU");
        employee.setContactNumber("0712345678");
        employee.setStatus("ACTIVE");
    }

    @Test
    @DisplayName("Create Leave: Success with valid fields and default APPROVED status")
    void testCreateLeaveRecordSuccess() {
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(leaveRecordRepository.save(any(LeaveRecord.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(leaveRecordRepository.findByEmployeeIdAndStatus(1L, "APPROVED")).thenReturn(Collections.emptyList());

        LeaveRequest req = new LeaveRequest();
        req.setEmployeeId(1L);
        req.setLeaveType("ANNUAL");
        req.setStartDate(LocalDate.now().plusDays(5));
        req.setEndDate(LocalDate.now().plusDays(10));
        req.setReason("Annual family vacation");
        req.setStatus("APPROVED");

        LeaveRecord created = leaveRecordService.createLeaveRecord(req);

        assertNotNull(created);
        assertEquals("ANNUAL", created.getLeaveType());
        assertEquals("APPROVED", created.getStatus());
        assertEquals(req.getStartDate(), created.getStartDate());
        assertEquals(req.getEndDate(), created.getEndDate());
        assertEquals("Annual family vacation", created.getReason());
        assertEquals(employee, created.getEmployee());
        verify(leaveRecordRepository, times(1)).save(any(LeaveRecord.class));
    }

    @Test
    @DisplayName("Create Leave: Fails when employee is not selected")
    void testCreateLeaveRecord_MissingEmployee_ThrowsException() {
        LeaveRequest req = new LeaveRequest();
        req.setEmployeeId(null);
        req.setLeaveType("SICK");
        req.setStartDate(LocalDate.now());
        req.setEndDate(LocalDate.now().plusDays(1));
        req.setReason("Flu");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                leaveRecordService.createLeaveRecord(req)
        );
        assertTrue(ex.getMessage().contains("Please select an employee"));
    }

    @Test
    @DisplayName("Create Leave: Fails when employee does not exist")
    void testCreateLeaveRecord_NonexistentEmployee_ThrowsException() {
        when(employeeRepository.findById(999L)).thenReturn(Optional.empty());

        LeaveRequest req = new LeaveRequest();
        req.setEmployeeId(999L);
        req.setLeaveType("SICK");
        req.setStartDate(LocalDate.now());
        req.setEndDate(LocalDate.now().plusDays(1));
        req.setReason("Flu");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                leaveRecordService.createLeaveRecord(req)
        );
        assertTrue(ex.getMessage().contains("Employee not found with ID: 999"));
    }

    @Test
    @DisplayName("Create Leave: Fails when leave type is missing")
    void testCreateLeaveRecord_MissingLeaveType_ThrowsException() {
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));

        LeaveRequest req = new LeaveRequest();
        req.setEmployeeId(1L);
        req.setLeaveType("   ");
        req.setStartDate(LocalDate.now());
        req.setEndDate(LocalDate.now().plusDays(1));
        req.setReason("Fever");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                leaveRecordService.createLeaveRecord(req)
        );
        assertTrue(ex.getMessage().contains("Leave type is required"));
    }

    @Test
    @DisplayName("Create Leave: Fails when start date or end date is missing")
    void testCreateLeaveRecord_MissingDates_ThrowsException() {
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));

        LeaveRequest req = new LeaveRequest();
        req.setEmployeeId(1L);
        req.setLeaveType("SICK");
        req.setStartDate(null);
        req.setEndDate(LocalDate.now());
        req.setReason("Fever");

        IllegalArgumentException ex1 = assertThrows(IllegalArgumentException.class, () ->
                leaveRecordService.createLeaveRecord(req)
        );
        assertTrue(ex1.getMessage().contains("Leave start date is required"));

        req.setStartDate(LocalDate.now());
        req.setEndDate(null);
        IllegalArgumentException ex2 = assertThrows(IllegalArgumentException.class, () ->
                leaveRecordService.createLeaveRecord(req)
        );
        assertTrue(ex2.getMessage().contains("Leave end date is required"));
    }

    @Test
    @DisplayName("Create Leave: Fails when end date is earlier than start date")
    void testCreateLeaveRecord_EndDateBeforeStartDate_ThrowsException() {
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));

        LeaveRequest req = new LeaveRequest();
        req.setEmployeeId(1L);
        req.setLeaveType("CASUAL");
        req.setStartDate(LocalDate.now().plusDays(5));
        req.setEndDate(LocalDate.now().plusDays(2)); // Earlier than start
        req.setReason("Personal matter");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                leaveRecordService.createLeaveRecord(req)
        );
        assertTrue(ex.getMessage().contains("cannot be earlier than start date"));
    }

    @Test
    @DisplayName("Create Leave: Fails when reason is missing")
    void testCreateLeaveRecord_MissingReason_ThrowsException() {
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));

        LeaveRequest req = new LeaveRequest();
        req.setEmployeeId(1L);
        req.setLeaveType("SICK");
        req.setStartDate(LocalDate.now());
        req.setEndDate(LocalDate.now());
        req.setReason("  ");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                leaveRecordService.createLeaveRecord(req)
        );
        assertTrue(ex.getMessage().contains("Reason for leave is required"));
    }

    @Test
    @DisplayName("Create Leave: Active approved leave covering today automatically sets employee to ON_LEAVE")
    void testCreateLeaveRecord_ActiveApprovedLeave_SyncsEmployeeStatus() {
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(leaveRecordRepository.save(any(LeaveRecord.class))).thenAnswer(invocation -> invocation.getArgument(0));

        LeaveRecord activeLeave = new LeaveRecord();
        activeLeave.setId(10L);
        activeLeave.setEmployee(employee);
        activeLeave.setLeaveType("SICK");
        activeLeave.setStartDate(LocalDate.now().minusDays(1));
        activeLeave.setEndDate(LocalDate.now().plusDays(2));
        activeLeave.setStatus("APPROVED");

        when(leaveRecordRepository.findByEmployeeIdAndStatus(1L, "APPROVED")).thenReturn(List.of(activeLeave));

        LeaveRequest req = new LeaveRequest();
        req.setEmployeeId(1L);
        req.setLeaveType("SICK");
        req.setStartDate(LocalDate.now().minusDays(1));
        req.setEndDate(LocalDate.now().plusDays(2));
        req.setReason("Severe migraine");
        req.setStatus("APPROVED");

        leaveRecordService.createLeaveRecord(req);

        assertEquals("ON_LEAVE", employee.getStatus());
        verify(employeeRepository, atLeastOnce()).save(employee);
    }

    @Test
    @DisplayName("Update Leave: Validates end date ordering and updates fields")
    void testUpdateLeaveRecord() {
        LeaveRecord existing = new LeaveRecord();
        existing.setId(5L);
        existing.setEmployee(employee);
        existing.setLeaveType("CASUAL");
        existing.setStartDate(LocalDate.now().plusDays(2));
        existing.setEndDate(LocalDate.now().plusDays(4));
        existing.setReason("Old reason");
        existing.setStatus("PENDING");

        when(leaveRecordRepository.findById(5L)).thenReturn(Optional.of(existing));
        when(leaveRecordRepository.save(any(LeaveRecord.class))).thenAnswer(inv -> inv.getArgument(0));

        // 1. Invalid date update
        LeaveRequest invalidReq = new LeaveRequest();
        invalidReq.setStartDate(LocalDate.now().plusDays(10));
        invalidReq.setEndDate(LocalDate.now().plusDays(5)); // Earlier than start

        assertThrows(IllegalArgumentException.class, () ->
                leaveRecordService.updateLeaveRecord(5L, invalidReq)
        );

        // 2. Valid update
        LeaveRequest validReq = new LeaveRequest();
        validReq.setLeaveType("ANNUAL");
        validReq.setStartDate(LocalDate.now().plusDays(3));
        validReq.setEndDate(LocalDate.now().plusDays(6));
        validReq.setReason("Updated vacation plan");
        validReq.setStatus("APPROVED");

        LeaveRecord updated = leaveRecordService.updateLeaveRecord(5L, validReq);
        assertEquals("ANNUAL", updated.getLeaveType());
        assertEquals("APPROVED", updated.getStatus());
        assertEquals("Updated vacation plan", updated.getReason());
        assertEquals(LocalDate.now().plusDays(3), updated.getStartDate());
    }

    @Test
    @DisplayName("Delete Leave: Deletes record and syncs employee status back to ACTIVE when no active leaves")
    void testDeleteLeaveRecord_Success_And_SyncsEmployeeStatus() {
        employee.setStatus("ON_LEAVE");

        LeaveRecord leave = new LeaveRecord();
        leave.setId(7L);
        leave.setEmployee(employee);
        leave.setLeaveType("SICK");
        leave.setStartDate(LocalDate.now());
        leave.setEndDate(LocalDate.now());
        leave.setStatus("APPROVED");

        when(leaveRecordRepository.findById(7L)).thenReturn(Optional.of(leave));
        // After deletion, findByEmployeeIdAndStatus returns empty
        when(leaveRecordRepository.findByEmployeeIdAndStatus(1L, "APPROVED")).thenReturn(Collections.emptyList());

        leaveRecordService.deleteLeaveRecord(7L);

        verify(leaveRecordRepository, times(1)).delete(leave);
        assertEquals("ACTIVE", employee.getStatus());
        verify(employeeRepository, atLeastOnce()).save(employee);
    }

    @Test
    @DisplayName("StaffController: Endpoints handle success and error responses correctly")
    void testStaffControllerLeaveEndpoints() {
        LeaveRecord record = new LeaveRecord();
        record.setId(1L);
        record.setEmployee(employee);
        record.setLeaveType("SICK");
        record.setStartDate(LocalDate.now());
        record.setEndDate(LocalDate.now().plusDays(1));
        record.setReason("Medical appointment");
        record.setStatus("APPROVED");

        when(leaveRecordRepository.findAllByOrderByStartDateDesc()).thenReturn(List.of(record));
        when(leaveRecordRepository.findById(1L)).thenReturn(Optional.of(record));
        when(leaveRecordRepository.findById(99L)).thenReturn(Optional.empty());

        // GET all
        ResponseEntity<List<LeaveRecord>> allRes = staffController.getAllLeaveRecords();
        assertEquals(HttpStatus.OK, allRes.getStatusCode());
        assertEquals(1, allRes.getBody().size());

        // GET by ID found
        ResponseEntity<?> getRes = staffController.getLeaveRecordById(1L);
        assertEquals(HttpStatus.OK, getRes.getStatusCode());

        // GET by ID not found
        ResponseEntity<?> notFoundRes = staffController.getLeaveRecordById(99L);
        assertEquals(HttpStatus.NOT_FOUND, notFoundRes.getStatusCode());

        // DELETE success
        ResponseEntity<?> delRes = staffController.deleteLeaveRecord(1L);
        assertEquals(HttpStatus.OK, delRes.getStatusCode());
        assertTrue(delRes.getBody().toString().contains("deleted successfully"));
    }
}
