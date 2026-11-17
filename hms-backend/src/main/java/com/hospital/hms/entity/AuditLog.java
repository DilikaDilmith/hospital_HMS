package com.hospital.hms.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Username of the user who performed the action or attempted login
    @Column(nullable = false, length = 100)
    private String username;

    // Action category: USER_LOGIN, PATIENT_REGISTER, PATIENT_UPDATE, INVOICE_CREATE, INVOICE_PAYMENT, STAFF_CREATE, etc.
    @Column(nullable = false, length = 100)
    private String action;

    // Result of the operation: SUCCESS or FAILED
    @Column(nullable = false, length = 30)
    private String result;

    // Date and time when the action occurred
    @Column(nullable = false, updatable = false)
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime timestamp;

    // High-level operational details (Never contains passwords, tokens, or confidential medical details)
    @Column(columnDefinition = "TEXT")
    private String details;

    @PrePersist
    protected void onCreate() {
        if (this.timestamp == null) {
            this.timestamp = LocalDateTime.now();
        }
    }
}
