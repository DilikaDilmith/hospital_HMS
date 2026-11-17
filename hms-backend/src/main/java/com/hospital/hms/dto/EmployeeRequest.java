package com.hospital.hms.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeRequest {
    private Long userId;
    private String designation;
    private String department;
    private String contactNumber;
    private Double salary;
    private String status;
    private LocalDate joinedDate;
}
