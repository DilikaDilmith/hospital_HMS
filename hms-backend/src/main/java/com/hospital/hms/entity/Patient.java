package com.hospital.hms.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "patients")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Patient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Linked User account for Patient Portal access (One-to-One relationship)
    @OneToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id", unique = true)
    private User user;

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
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dateOfBirth;

    // Patient's gender (e.g., Male, Female, Other)
    private String gender;

    // Primary contact number
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
