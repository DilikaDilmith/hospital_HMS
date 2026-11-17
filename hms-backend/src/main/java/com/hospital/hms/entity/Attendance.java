package com.hospital.hms.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "attendances")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Associated employee
    @ManyToOne
    @JoinColumn(name = "employee_id", referencedColumnName = "id", nullable = false)
    private Employee employee;

    // Date of attendance
    @Column(nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate date;

    // Time of check-in
    @JsonFormat(pattern = "HH:mm:ss")
    private LocalTime checkInTime;

    // Time of check-out
    @JsonFormat(pattern = "HH:mm:ss")
    private LocalTime checkOutTime;

    // Attendance status: PRESENT, LATE, HALF_DAY, ABSENT
    @Column(nullable = false)
    private String status = "PRESENT";

    // Optional remarks or notes
    private String notes;
}
