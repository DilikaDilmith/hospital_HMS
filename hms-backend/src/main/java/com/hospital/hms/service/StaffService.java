package com.hospital.hms.service;

import com.hospital.hms.dto.AttendanceRequest;
import com.hospital.hms.dto.EmployeeRequest;
import com.hospital.hms.entity.Attendance;
import com.hospital.hms.entity.Employee;
import com.hospital.hms.entity.Role;
import com.hospital.hms.entity.User;
import com.hospital.hms.repository.AttendanceRepository;
import com.hospital.hms.repository.EmployeeRepository;
import com.hospital.hms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Service
public class StaffService {

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private UserRepository userRepository;

    // Retrieve all employee profiles
    public List<Employee> getAllEmployees() {
        return employeeRepository.findAll();
    }

    // Retrieve single employee by ID
    public Employee getEmployeeById(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found with ID: " + id));
    }

    // Retrieve all approved staff users who do not yet have an Employee record
    public List<User> getUnassignedUsers() {
        List<Long> assignedUserIds = employeeRepository.findAll().stream()
                .map(e -> e.getUser().getId())
                .toList();

        return userRepository.findAll().stream()
                .filter(u -> u.getRole() != Role.PATIENT)
                .filter(u -> "APPROVED".equalsIgnoreCase(u.getStatus()))
                .filter(u -> !assignedUserIds.contains(u.getId()))
                .toList();
    }

    // Create a new Employee record linked to an existing User
    @Transactional
    public Employee createEmployee(EmployeeRequest request) {
        if (request.getUserId() == null) {
            throw new RuntimeException("User ID is required to create an employee record.");
        }

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + request.getUserId()));

        if (employeeRepository.findByUserId(user.getId()).isPresent()) {
            throw new RuntimeException("An employee record already exists for user: " + user.getUsername());
        }

        Employee employee = new Employee();
        employee.setUser(user);
        employee.setDesignation(request.getDesignation() != null ? request.getDesignation() : user.getRole().name());
        employee.setDepartment(request.getDepartment() != null ? request.getDepartment() : "General");
        employee.setContactNumber(request.getContactNumber() != null ? request.getContactNumber() : "");
        employee.setSalary(request.getSalary() != null ? request.getSalary() : 50000.0);
        employee.setStatus(request.getStatus() != null ? request.getStatus() : "ACTIVE");
        employee.setJoinedDate(request.getJoinedDate() != null ? request.getJoinedDate() : LocalDate.now());

        return employeeRepository.save(employee);
    }

    // Update an existing employee profile
    @Transactional
    public Employee updateEmployee(Long id, EmployeeRequest request) {
        Employee employee = getEmployeeById(id);

        if (request.getDesignation() != null) {
            employee.setDesignation(request.getDesignation());
        }
        if (request.getDepartment() != null) {
            employee.setDepartment(request.getDepartment());
        }
        if (request.getContactNumber() != null) {
            employee.setContactNumber(request.getContactNumber());
        }
        if (request.getSalary() != null) {
            employee.setSalary(request.getSalary());
        }
        if (request.getStatus() != null) {
            employee.setStatus(request.getStatus());
        }
        if (request.getJoinedDate() != null) {
            employee.setJoinedDate(request.getJoinedDate());
        }

        return employeeRepository.save(employee);
    }

    // Delete an employee record
    @Transactional
    public void deleteEmployee(Long id) {
        Employee employee = getEmployeeById(id);
        employeeRepository.delete(employee);
    }

    // Retrieve all attendance logs ordered by newest date
    public List<Attendance> getAllAttendance() {
        return attendanceRepository.findAllByOrderByDateDesc();
    }

    // Retrieve attendance for a specific date
    public List<Attendance> getAttendanceByDate(LocalDate date) {
        LocalDate queryDate = (date != null) ? date : LocalDate.now();
        return attendanceRepository.findByDateOrderByCheckInTimeAsc(queryDate);
    }

    // Retrieve attendance history for an employee
    public List<Attendance> getAttendanceByEmployee(Long employeeId) {
        return attendanceRepository.findByEmployeeIdOrderByDateDesc(employeeId);
    }

    // Record or update attendance for an employee
    @Transactional
    public Attendance recordAttendance(AttendanceRequest request) {
        if (request.getEmployeeId() == null) {
            throw new RuntimeException("Employee ID is required to log attendance.");
        }

        Employee employee = getEmployeeById(request.getEmployeeId());
        LocalDate recordDate = (request.getDate() != null) ? request.getDate() : LocalDate.now();

        // Check if attendance already exists for this date and employee
        Attendance attendance = attendanceRepository.findByEmployeeIdAndDate(employee.getId(), recordDate)
                .orElse(new Attendance());

        attendance.setEmployee(employee);
        attendance.setDate(recordDate);

        if (request.getCheckInTime() != null && !request.getCheckInTime().trim().isEmpty()) {
            attendance.setCheckInTime(parseTime(request.getCheckInTime()));
        } else if (attendance.getCheckInTime() == null) {
            attendance.setCheckInTime(LocalTime.now().withNano(0));
        }

        if (request.getCheckOutTime() != null && !request.getCheckOutTime().trim().isEmpty()) {
            attendance.setCheckOutTime(parseTime(request.getCheckOutTime()));
        }

        if (request.getStatus() != null && !request.getStatus().trim().isEmpty()) {
            attendance.setStatus(request.getStatus().toUpperCase());
        } else if (attendance.getStatus() == null) {
            attendance.setStatus("PRESENT");
        }

        if (request.getNotes() != null) {
            attendance.setNotes(request.getNotes());
        }

        return attendanceRepository.save(attendance);
    }

    // Quick Action: Mark check-in for today
    @Transactional
    public Attendance markCheckIn(Long employeeId, String time, String notes) {
        AttendanceRequest req = new AttendanceRequest();
        req.setEmployeeId(employeeId);
        req.setDate(LocalDate.now());
        req.setCheckInTime(time != null && !time.isEmpty() ? time : LocalTime.now().withNano(0).toString());
        req.setStatus("PRESENT");
        req.setNotes(notes);
        return recordAttendance(req);
    }

    // Quick Action: Mark check-out for today
    @Transactional
    public Attendance markCheckOut(Long employeeId, String time) {
        Employee employee = getEmployeeById(employeeId);
        LocalDate today = LocalDate.now();

        Attendance attendance = attendanceRepository.findByEmployeeIdAndDate(employee.getId(), today)
                .orElseGet(() -> {
                    Attendance a = new Attendance();
                    a.setEmployee(employee);
                    a.setDate(today);
                    a.setCheckInTime(LocalTime.of(8, 30));
                    a.setStatus("PRESENT");
                    return a;
                });

        LocalTime outTime = (time != null && !time.isEmpty()) ? parseTime(time) : LocalTime.now().withNano(0);
        attendance.setCheckOutTime(outTime);
        return attendanceRepository.save(attendance);
    }

    // Helper to parse LocalTime from various string representations
    private LocalTime parseTime(String timeStr) {
        try {
            timeStr = timeStr.trim();
            if (timeStr.length() == 5) { // "08:30"
                return LocalTime.parse(timeStr, DateTimeFormatter.ofPattern("HH:mm"));
            }
            return LocalTime.parse(timeStr);
        } catch (Exception e) {
            return LocalTime.now().withNano(0);
        }
    }
}
