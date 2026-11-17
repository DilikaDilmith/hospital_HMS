package com.hospital.hms.controller;

import com.hospital.hms.entity.Patient;
import com.hospital.hms.entity.PatientDocument;
import com.hospital.hms.repository.PatientRepository;
import com.hospital.hms.service.PatientDocumentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping
public class PatientDocumentController {

    @Autowired
    private PatientDocumentService patientDocumentService;

    @Autowired
    private PatientRepository patientRepository;

    /**
     * Upload a document for a patient (Staff only)
     */
    @PostMapping("/api/patients/{patientId}/documents")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'DOCTOR', 'RECEPTIONIST', 'NURSE', 'ROLE_ADMIN', 'ROLE_DOCTOR', 'ROLE_RECEPTIONIST', 'ROLE_NURSE')")
    public ResponseEntity<?> uploadDocument(
            @PathVariable Long patientId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "description", required = false) String description,
            Authentication authentication) {
        try {
            String username = authentication != null ? authentication.getName() : "STAFF";
            PatientDocument doc = patientDocumentService.uploadDocument(patientId, file, description, username);
            return ResponseEntity.status(HttpStatus.CREATED).body(doc);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to store document file: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Unexpected error uploading document: " + e.getMessage());
        }
    }

    /**
     * List all documents for a patient (Staff can view any; Patient can only view their own)
     */
    @GetMapping("/api/patients/{patientId}/documents")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'DOCTOR', 'RECEPTIONIST', 'NURSE', 'PATIENT', 'ROLE_ADMIN', 'ROLE_DOCTOR', 'ROLE_RECEPTIONIST', 'ROLE_NURSE', 'ROLE_PATIENT')")
    public ResponseEntity<?> getPatientDocuments(@PathVariable Long patientId, Authentication authentication) {
        Patient patient = patientRepository.findById(patientId).orElse(null);
        if (patient == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Patient not found with ID: " + patientId);
        }

        // Strict Ownership Enforcement: Patients cannot view another patient's documents
        if (isCallerPatientOnly(authentication)) {
            if (patient.getUser() == null || !patient.getUser().getUsername().equals(authentication.getName())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Access denied: You are not authorized to access another patient's documents.");
            }
        }

        List<PatientDocument> documents = patientDocumentService.getDocumentsByPatientId(patientId);
        return ResponseEntity.ok(documents);
    }

    /**
     * View document inline in browser (e.g. PDF viewer or Image display)
     */
    @GetMapping("/api/documents/{id}/view")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'DOCTOR', 'RECEPTIONIST', 'NURSE', 'PATIENT', 'ROLE_ADMIN', 'ROLE_DOCTOR', 'ROLE_RECEPTIONIST', 'ROLE_NURSE', 'ROLE_PATIENT')")
    public ResponseEntity<?> viewDocument(@PathVariable Long id, Authentication authentication) {
        PatientDocument doc = patientDocumentService.getDocumentById(id).orElse(null);
        if (doc == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Document not found with ID: " + id);
        }

        // Strict Ownership Enforcement: Patients cannot view another patient's document
        if (isCallerPatientOnly(authentication)) {
            if (doc.getPatient() == null || doc.getPatient().getUser() == null
                    || !doc.getPatient().getUser().getUsername().equals(authentication.getName())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Access denied: You are not authorized to view this document.");
            }
        }

        try {
            Resource resource = patientDocumentService.loadFileAsResource(id);
            MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
            if (doc.getFileType() != null) {
                try {
                    mediaType = MediaType.parseMediaType(doc.getFileType());
                } catch (Exception ignored) {}
            }

            return ResponseEntity.ok()
                    .contentType(mediaType)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + doc.getOriginalFileName() + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error retrieving document file: " + e.getMessage());
        }
    }

    /**
     * Download document as an attachment
     */
    @GetMapping("/api/documents/{id}/download")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'DOCTOR', 'RECEPTIONIST', 'NURSE', 'PATIENT', 'ROLE_ADMIN', 'ROLE_DOCTOR', 'ROLE_RECEPTIONIST', 'ROLE_NURSE', 'ROLE_PATIENT')")
    public ResponseEntity<?> downloadDocument(@PathVariable Long id, Authentication authentication) {
        PatientDocument doc = patientDocumentService.getDocumentById(id).orElse(null);
        if (doc == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Document not found with ID: " + id);
        }

        // Strict Ownership Enforcement: Patients cannot download another patient's document
        if (isCallerPatientOnly(authentication)) {
            if (doc.getPatient() == null || doc.getPatient().getUser() == null
                    || !doc.getPatient().getUser().getUsername().equals(authentication.getName())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Access denied: You are not authorized to download this document.");
            }
        }

        try {
            Resource resource = patientDocumentService.loadFileAsResource(id);
            MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
            if (doc.getFileType() != null) {
                try {
                    mediaType = MediaType.parseMediaType(doc.getFileType());
                } catch (Exception ignored) {}
            }

            return ResponseEntity.ok()
                    .contentType(mediaType)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + doc.getOriginalFileName() + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error downloading document file: " + e.getMessage());
        }
    }

    /**
     * Delete document (Staff only)
     */
    @DeleteMapping("/api/documents/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'DOCTOR', 'RECEPTIONIST', 'NURSE', 'ROLE_ADMIN', 'ROLE_DOCTOR', 'ROLE_RECEPTIONIST', 'ROLE_NURSE')")
    public ResponseEntity<?> deleteDocument(@PathVariable Long id) {
        try {
            patientDocumentService.deleteDocument(id);
            return ResponseEntity.ok("Document #" + id + " has been successfully deleted.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to delete document: " + e.getMessage());
        }
    }

    public void setPatientDocumentService(PatientDocumentService patientDocumentService) {
        this.patientDocumentService = patientDocumentService;
    }

    public void setPatientRepository(PatientRepository patientRepository) {
        this.patientRepository = patientRepository;
    }

    private boolean isCallerPatientOnly(Authentication authentication) {
        if (authentication == null) return false;
        boolean hasPatient = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("PATIENT") || a.getAuthority().equals("ROLE_PATIENT"));
        boolean hasStaff = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().contains("ADMIN") || a.getAuthority().contains("DOCTOR")
                        || a.getAuthority().contains("RECEPTIONIST") || a.getAuthority().contains("NURSE")
                        || a.getAuthority().contains("ACCOUNTANT") || a.getAuthority().contains("LAB_TECHNICIAN")
                        || a.getAuthority().contains("PHARMACIST"));
        return hasPatient && !hasStaff;
    }
}
