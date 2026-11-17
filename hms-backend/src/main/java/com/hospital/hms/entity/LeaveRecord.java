package com.hospital.hms.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "staff_leaves")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LeaveRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Associated employee
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    // Leave type: SICK, CASUAL, ANNUAL, MATERNITY, UNPAID, OTHER
    @Column(nullable = false, length = 50)
    private String leaveType;

    // First day of leave
    @Column(nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate startDate;

    // Last day of leave
    @Column(nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate endDate;

    // Reason for leave
    @Column(columnDefinition = "TEXT")
    private String reason;

    // Leave status: PENDING, APPROVED, REJECTED, CANCELLED
    @Column(nullable = false, length = 30)
    private String status = "APPROVED";

    // Date and time when the leave was recorded
    @Column(nullable = false, updatable = false)
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.status == null || this.status.trim().isEmpty()) {
            this.status = "APPROVED";
        }
    }
}
