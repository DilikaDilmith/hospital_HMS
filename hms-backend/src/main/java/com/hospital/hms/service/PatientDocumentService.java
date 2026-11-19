package com.hospital.hms.service;

import com.hospital.hms.entity.Patient;
import com.hospital.hms.entity.PatientDocument;
import com.hospital.hms.entity.User;
import com.hospital.hms.repository.PatientDocumentRepository;
import com.hospital.hms.repository.PatientRepository;
import com.hospital.hms.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class PatientDocumentService {

    public static final long MAX_FILE_SIZE_BYTES = 5L * 1024 * 1024; // 5 MB limit
    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList("pdf", "jpg", "jpeg", "png");

    @Value("${file.upload-dir:uploads/patient-documents}")
    private String uploadDirProperty;

    private Path uploadPath;

    @Autowired
    private PatientDocumentRepository patientDocumentRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired(required = false)
    private UserRepository userRepository;

    public void setPatientDocumentRepository(PatientDocumentRepository patientDocumentRepository) {
        this.patientDocumentRepository = patientDocumentRepository;
    }

    public void setPatientRepository(PatientRepository patientRepository) {
        this.patientRepository = patientRepository;
    }

    public void setUserRepository(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PostConstruct
    public void init() {
        this.uploadPath = Paths.get(uploadDirProperty).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.uploadPath);
        } catch (IOException e) {
            throw new RuntimeException("Could not create document upload directory: " + this.uploadPath, e);
        }
    }

    // Set custom upload path (useful for unit tests)
    public void setUploadPath(Path path) {
        this.uploadPath = path.toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.uploadPath);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize upload directory: " + this.uploadPath, e);
        }
    }

    public Path getUploadPath() {
        if (this.uploadPath == null) {
            init();
        }
        return this.uploadPath;
    }

    /**
     * Upload and store a new document for a patient
     */
    @Transactional
    public PatientDocument uploadDocument(Long patientId, MultipartFile file, String description, String username) throws IOException {
        // 1. Validate file existence
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Please select a file to upload.");
        }

        // 2. Validate file size (max 5 MB)
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new IllegalArgumentException("File size exceeds the maximum limit of 5 MB (" + (file.getSize() / 1024 / 1024) + " MB uploaded).");
        }

        // 3. Validate file name and extension
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.trim().isEmpty()) {
            throw new IllegalArgumentException("Uploaded file must have a valid file name.");
        }

        String sanitizedOriginalName = Paths.get(originalFilename).getFileName().toString();
        int dotIndex = sanitizedOriginalName.lastIndexOf('.');
        if (dotIndex < 0) {
            throw new IllegalArgumentException("Invalid file type. File must have an extension (.pdf, .jpg, .jpeg, .png).");
        }

        String extension = sanitizedOriginalName.substring(dotIndex + 1).toLowerCase();
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException("Invalid file format ." + extension + ". Only PDF, JPG, and PNG documents are allowed.");
        }

        // Validate MIME type
        String contentType = file.getContentType();
        if (contentType != null && !contentType.trim().isEmpty() && !contentType.equalsIgnoreCase("application/octet-stream")) {
            boolean mimeMatches = contentType.equalsIgnoreCase("application/pdf")
                    || contentType.equalsIgnoreCase("image/jpeg")
                    || contentType.equalsIgnoreCase("image/jpg")
                    || contentType.equalsIgnoreCase("image/png")
                    || contentType.equalsIgnoreCase("image/pjpeg");
            if (!mimeMatches) {
                throw new IllegalArgumentException("Invalid file content type: " + contentType + ". Only PDF, JPG, and PNG are allowed.");
            }
        }

        // Normalize fileType for storage
        String resolvedFileType = "application/pdf";
        if (extension.equals("jpg") || extension.equals("jpeg")) {
            resolvedFileType = "image/jpeg";
        } else if (extension.equals("png")) {
            resolvedFileType = "image/png";
        }

        // 4. Validate patient
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new IllegalArgumentException("Patient not found with ID: " + patientId));

        // 5. Store file securely on disk
        String safeStoredFileName = UUID.randomUUID().toString() + "_" + System.currentTimeMillis() + "." + extension;
        Path targetPath = getUploadPath().resolve(safeStoredFileName).normalize();

        // Prevent path traversal attacks
        if (!targetPath.startsWith(getUploadPath())) {
            throw new SecurityException("Invalid target file path: path traversal detected.");
        }

        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

        // 6. Save document record in MySQL
        PatientDocument document = new PatientDocument();
        document.setPatient(patient);
        document.setOriginalFileName(sanitizedOriginalName);
        document.setStoredFileName(safeStoredFileName);
        document.setFileType(resolvedFileType);
        document.setFileSize(file.getSize());
        document.setDescription(description != null ? description.trim() : "");
        document.setUploadedBy(username != null ? username : "STAFF");

        return patientDocumentRepository.save(document);
    }

    /**
     * Retrieve all documents for a patient
     */
    public List<PatientDocument> getDocumentsByPatientId(Long patientId) {
        return patientDocumentRepository.findByPatientIdOrderByUploadedAtDesc(patientId);
    }

    /**
     * Retrieve all documents for an authenticated patient by username (scoped to the patient's own profile)
     */
    public List<PatientDocument> getDocumentsByPatientUsername(String username) {
        if (username == null || username.trim().isEmpty()) {
            return Collections.emptyList();
        }
        String cleanUsername = username.trim();
        Optional<Patient> patientOpt = patientRepository.findByUserUsername(cleanUsername);
        if (patientOpt.isEmpty() && userRepository != null) {
            User user = userRepository.findByUsername(cleanUsername).orElse(null);
            if (user != null) {
                patientOpt = patientRepository.findByUserId(user.getId());
            }
        }
        if (patientOpt.isEmpty()) {
            return Collections.emptyList();
        }
        return patientDocumentRepository.findByPatientIdOrderByUploadedAtDesc(patientOpt.get().getId());
    }

    /**
     * Retrieve single document metadata by ID
     */
    public Optional<PatientDocument> getDocumentById(Long documentId) {
        return patientDocumentRepository.findById(documentId);
    }

    /**
     * Load document file as a Spring Resource for view or download
     */
    public Resource loadFileAsResource(Long documentId) throws MalformedURLException {
        PatientDocument doc = patientDocumentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found with ID: " + documentId));

        Path filePath = getUploadPath().resolve(doc.getStoredFileName()).normalize();
        if (!filePath.startsWith(getUploadPath())) {
            throw new SecurityException("Access to path outside upload directory is blocked.");
        }

        Resource resource = new UrlResource(filePath.toUri());
        if (resource.exists() && resource.isReadable()) {
            return resource;
        } else {
            throw new RuntimeException("Document file not found on disk: " + doc.getOriginalFileName());
        }
    }

    /**
     * Delete document from disk and database
     */
    @Transactional
    public void deleteDocument(Long documentId) {
        PatientDocument doc = patientDocumentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found with ID: " + documentId));

        // Delete physical file
        try {
            Path filePath = getUploadPath().resolve(doc.getStoredFileName()).normalize();
            if (filePath.startsWith(getUploadPath())) {
                Files.deleteIfExists(filePath);
            }
        } catch (IOException e) {
            System.err.println("Warning: Could not delete physical file for document #" + documentId + ": " + e.getMessage());
        }

        // Delete database record
        patientDocumentRepository.delete(doc);
    }
}
