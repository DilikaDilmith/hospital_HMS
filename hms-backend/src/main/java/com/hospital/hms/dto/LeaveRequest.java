package com.hospital.hms.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LeaveRequest {

    private Long employeeId;

    // SICK, CASUAL, ANNUAL, MATERNITY, UNPAID, OTHER
    private String leaveType;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate startDate;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate endDate;

    private String reason;

    // PENDING, APPROVED, REJECTED, CANCELLED
    private String status;
}
