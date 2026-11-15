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

    // Current status of the appointment (e.g., BOOKED, CANCELLED, COMPLETED)
    @Column(nullable = false)
    private String status;

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
}