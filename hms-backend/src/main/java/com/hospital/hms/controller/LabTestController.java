package com.hospital.hms.controller;

import com.hospital.hms.entity.LabTest;
import com.hospital.hms.service.LabTestService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/lab-tests")
public class LabTestController {

    @Autowired
    private LabTestService labTestService;

    // Endpoint to request a new lab test
    @PostMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'DOCTOR')")
    public LabTest requestTest(@RequestBody LabTest labTest) {
        return labTestService.requestTest(labTest);
    }

    // Endpoint to retrieve all lab tests
    @GetMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'DOCTOR', 'LAB_STAFF')")
    public List<LabTest> getAllTests() {
        return labTestService.getAllTests();
    }

    // Endpoint to submit test results (Only Lab Staff and Admin can do this)
    @PutMapping("/{id}/complete")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'LAB_STAFF')") // <-- අවසර දෙනවා
    public LabTest completeTest(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String result = payload.get("result");
        return labTestService.completeTest(id, result);
    }
}