package com.hospital.hms.service;

import com.hospital.hms.entity.LabTest;
import com.hospital.hms.repository.LabTestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class LabTestService {

    @Autowired
    private LabTestRepository labTestRepository;

    // Request a new lab test
    public LabTest requestTest(LabTest labTest) {
        // Automatically set the requested time if not provided
        if (labTest.getRequestedAt() == null) {
            labTest.setRequestedAt(LocalDateTime.now());
        }
        return labTestRepository.save(labTest);
    }

    // Retrieve all lab test requests
    public List<LabTest> getAllTests() {
        return labTestRepository.findAll();
    }
}