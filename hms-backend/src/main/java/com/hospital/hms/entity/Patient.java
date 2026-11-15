package com.hospital.hms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonFormat;

@Entity
@Table(name = "patients")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Patient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Patient's first name
    @Column(nullable = false)
    private String firstName;

    // Patient's last name
    @Column(nullable = false)
    private String lastName;

    // Patient's National Identity Card number (Should be unique)
    @Column(unique = true)
    private String nic;

    // Patient's date of birth
    @Column(nullable = false)
    @JsonFormat(pattern="yyyy-MM-dd")
    private LocalDate dateOfBirth;

    // Patient's gender (e.g., Male, Female, Other)
    @Column(nullable = false)
    private String gender;

    // Primary contact number
    @Column(nullable = false)
    private String phoneNumber;

    // Residential address
    private String address;

    // Date and time when the patient was registered in the system
    @Column(nullable = false, updatable = false)
    private LocalDateTime registeredAt;

    // Automatically set the registration timestamp before saving to the database
    @PrePersist
    protected void onCreate() {
        this.registeredAt = LocalDateTime.now();
    }
}