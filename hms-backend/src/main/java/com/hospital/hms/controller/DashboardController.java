package com.hospital.hms.controller;

import com.hospital.hms.dto.DashboardResponse;
import com.hospital.hms.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    // Endpoint to retrieve dashboard statistics (Allow all staff roles)
    @GetMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'DOCTOR', 'PHARMACIST', 'NURSE', 'LAB_STAFF', 'RECEPTIONIST', 'ACCOUNTANT')")
    public DashboardResponse getDashboardStats() {
        return dashboardService.getDashboardStats();
    }
}