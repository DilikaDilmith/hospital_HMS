package com.hospital.hms.repository;

import com.hospital.hms.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    // Find employee by user account ID
    Optional<Employee> findByUserId(Long userId);

    // Find employee by user username
    Optional<Employee> findByUserUsername(String username);

    // List employees by department
    List<Employee> findByDepartment(String department);

    // List employees by status
    List<Employee> findByStatus(String status);
}
