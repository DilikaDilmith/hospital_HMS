package com.hospital.hms.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "patient_documents")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PatientDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Associated patient
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    // Original filename from client
    @Column(nullable = false)
    private String originalFileName;

    // Safe, unique filename stored on disk (prevents path traversal and collisions)
    @Column(nullable = false)
    private String storedFileName;

    // MIME type (application/pdf, image/jpeg, image/png)
    @Column(nullable = false)
    private String fileType;

    // File size in bytes (max 5 MB)
    @Column(nullable = false)
    private Long fileSize;

    // Optional document title, category or description
    private String description;

    // Username of the staff member who uploaded the document
    private String uploadedBy;

    // Timestamp when the document was uploaded
    @Column(nullable = false, updatable = false)
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime uploadedAt;

    @PrePersist
    protected void onCreate() {
        if (this.uploadedAt == null) {
            this.uploadedAt = LocalDateTime.now();
        }
    }
}
