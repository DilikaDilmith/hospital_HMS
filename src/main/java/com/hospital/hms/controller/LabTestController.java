package com.hospital.hms.controller;

import com.hospital.hms.entity.LabTest;
import com.hospital.hms.service.LabTestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lab-tests")
public class LabTestController {

    @Autowired
    private LabTestService labTestService;

    // Endpoint to request a new lab test
    @PostMapping
    public LabTest requestTest(@RequestBody LabTest labTest) {
        return labTestService.requestTest(labTest);
    }

    // Endpoint to retrieve all lab tests
    @GetMapping
    public List<LabTest> getAllTests() {
        return labTestService.getAllTests();
    }
}