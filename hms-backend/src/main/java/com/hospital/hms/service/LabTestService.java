package com.hospital.hms.service;

import com.hospital.hms.entity.LabTest;
import com.hospital.hms.entity.LabTestStatus;
import com.hospital.hms.repository.LabTestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class LabTestService {

    @Autowired
    private LabTestRepository labTestRepository;

    @Autowired
    private InvoiceService invoiceService;

    // Doctor requests a new lab test
    @Transactional
    public LabTest requestTest(LabTest labTest) {
        if (labTest.getRequestedAt() == null) {
            labTest.setRequestedAt(LocalDateTime.now());
        }
        if (labTest.getStatus() == null) {
            labTest.setStatus(LabTestStatus.REQUESTED);
        }
        if (labTest.getTestFee() == null || labTest.getTestFee() <= 0) {
            labTest.setTestFee(2500.0);
        }
        return labTestRepository.save(labTest);
    }

    // Retrieve all lab test requests ordered by date
    public List<LabTest> getAllTests() {
        return labTestRepository.findAllByOrderByRequestedAtDesc();
    }

    // Retrieve a single lab test by ID
    public Optional<LabTest> getTestById(Long id) {
        return labTestRepository.findById(id);
    }

    // Retrieve lab tests for a specific patient
    public List<LabTest> getTestsByPatientId(Long patientId) {
        return labTestRepository.findByPatientIdOrderByRequestedAtDesc(patientId);
    }

    // Retrieve lab tests for an authenticated patient by username
    public List<LabTest> getTestsByPatientUsername(String username) {
        return labTestRepository.findByPatientUserUsernameOrderByRequestedAtDesc(username);
    }

    // Retrieve lab tests requested by a specific doctor
    public List<LabTest> getTestsByDoctorId(Long doctorId) {
        return labTestRepository.findByDoctorIdOrderByRequestedAtDesc(doctorId);
    }

    // Lab Staff marks specimen/sample collected: REQUESTED -> SAMPLE_COLLECTED
    @Transactional
    public LabTest collectSample(Long id) {
        LabTest test = labTestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lab test not found with id: " + id));

        if (test.getStatus() == LabTestStatus.COMPLETED) {
            throw new IllegalStateException("Cannot collect sample for lab test #" + id + " because it is already completed.");
        }

        test.setStatus(LabTestStatus.SAMPLE_COLLECTED);
        test.setSampleCollectedAt(LocalDateTime.now());
        return labTestRepository.save(test);
    }

    // Lab Staff enters test result and completes test: SAMPLE_COLLECTED -> COMPLETED
    // Automatically creates an InvoiceItem under category 'LAB' on the patient's active Invoice in a single atomic transaction
    @Transactional
    public LabTest completeTest(Long id, String result) {
        LabTest test = labTestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lab test not found with id: " + id));

        // 1. Prevent duplicate completion requests
        if (test.getStatus() == LabTestStatus.COMPLETED) {
            throw new IllegalStateException("Lab test #" + id + " has already been completed.");
        }

        if (test.getPatient() == null) {
            throw new IllegalStateException("Cannot complete lab test without a linked patient.");
        }

        // 2. Update test details
        test.setResult(result);
        test.setStatus(LabTestStatus.COMPLETED);
        test.setCompletedAt(LocalDateTime.now());

        // 3. Billing Logic: Auto-bill the test atomically within the same transaction if not already billed
        if (!Boolean.TRUE.equals(test.getIsBilled())) {
            // Exceptions are intentionally allowed to propagate so Spring's @Transactional boundary rolls back all changes
            invoiceService.addLabFee(test.getPatient(), test);
            test.setIsBilled(true);
        }

        return labTestRepository.save(test);
    }
}