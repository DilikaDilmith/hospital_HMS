package com.hospital.hms.repository;

import com.hospital.hms.entity.PatientDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PatientDocumentRepository extends JpaRepository<PatientDocument, Long> {

    // Retrieve all documents for a specific patient, newest first
    List<PatientDocument> findByPatientIdOrderByUploadedAtDesc(Long patientId);

    // Retrieve documents for a patient by their portal user username
    List<PatientDocument> findByPatientUserUsernameOrderByUploadedAtDesc(String username);
}
