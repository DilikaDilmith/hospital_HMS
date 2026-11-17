package com.hospital.hms.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceRequest {
    private Long employeeId;
    private LocalDate date;
    private String checkInTime; // Accepts "08:30", "08:30:00"
    private String checkOutTime; // Accepts "17:00", "17:00:00"
    private String status; // PRESENT, LATE, HALF_DAY, ABSENT
    private String notes;
}
