package com.hospital.hms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "appointments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Date and time scheduled for the appointment
    @Column(nullable = false)
    private LocalDateTime appointmentDateTime;

    // Current status of the appointment with 7 states: SCHEDULED, CONFIRMED, CHECKED_IN, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private AppointmentStatus status = AppointmentStatus.SCHEDULED;

    // Reason for the visit or any specific notes
    private String reason;

    // Many-to-One relationship: Multiple appointments can belong to one patient
    @ManyToOne
    @JoinColumn(name = "patient_id", referencedColumnName = "id")
    private Patient patient;

    // Many-to-One relationship: Multiple appointments can belong to one doctor
    @ManyToOne
    @JoinColumn(name = "doctor_id", referencedColumnName = "id")
    private Doctor doctor;

    @PrePersist
    protected void onCreate() {
        if (this.status == null) {
            this.status = AppointmentStatus.SCHEDULED;
        }
    }
}
