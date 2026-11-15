package com.hospital.hms.service;

import com.hospital.hms.entity.Department;
import com.hospital.hms.repository.DepartmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DepartmentService {

    @Autowired
    private DepartmentRepository departmentRepository;

    // Save a new department to the database
    public Department saveDepartment(Department department) {
        return departmentRepository.save(department);
    }

    // Retrieve all departments from the database
    public List<Department> getAllDepartments() {
        return departmentRepository.findAll();
    }
}