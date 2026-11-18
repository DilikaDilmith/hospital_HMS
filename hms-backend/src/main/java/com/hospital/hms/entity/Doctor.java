package com.hospital.hms.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Entity
@Table(name = "doctors")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Doctor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Doctor's first name
    @Column(nullable = false)
    private String firstName;

    // Doctor's last name
    @Column(nullable = false)
    private String lastName;

    // Medical specialization (e.g., Cardiologist, Surgeon)
    @Column(nullable = false)
    private String specialization;

    // Doctor's consultation fee for visits (defaults to 1500.0)
    @Column(nullable = false)
    private Double consultationFee = 1500.0;

    // Contact number of the doctor
    @Column(nullable = false)
    private String phoneNumber;

    // Professional email address
    private String email;

    // Many-to-One relationship: Multiple doctors can belong to one department
    @ManyToOne
    @JoinColumn(name = "department_id", referencedColumnName = "id")
    private Department department;

    // Simple Doctor Availability Management
    // Comma-separated days of week (e.g. "MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY")
    @Column(name = "available_days")
    private String availableDays = "MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY,SUNDAY";

    // Daily start time of availability (e.g. 08:00)
    @Column(name = "available_time_start")
    @JsonFormat(pattern = "HH:mm[:ss]")
    private LocalTime availableTimeStart = LocalTime.of(8, 0);

    // Daily end time of availability (e.g. 20:00)
    @Column(name = "available_time_end")
    @JsonFormat(pattern = "HH:mm[:ss]")
    private LocalTime availableTimeEnd = LocalTime.of(20, 0);

    @PrePersist
    @PreUpdate
    @PostLoad
    protected void initDefaults() {
        if (this.consultationFee == null || this.consultationFee <= 0) {
            this.consultationFee = 1500.0;
        }
        if (this.availableDays == null || this.availableDays.trim().isEmpty()) {
            this.availableDays = "MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY,SUNDAY";
        }
        if (this.availableTimeStart == null) {
            this.availableTimeStart = LocalTime.of(8, 0);
        }
        if (this.availableTimeEnd == null) {
            this.availableTimeEnd = LocalTime.of(20, 0);
        }
    }
}
