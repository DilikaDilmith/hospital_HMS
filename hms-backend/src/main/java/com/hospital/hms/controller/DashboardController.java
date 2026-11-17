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

    // Retrieve full dashboard metrics and report aggregations
    @GetMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN', 'DOCTOR', 'ROLE_DOCTOR', 'PHARMACIST', 'ROLE_PHARMACIST', 'NURSE', 'ROLE_NURSE', 'LAB_STAFF', 'ROLE_LAB_STAFF', 'RECEPTIONIST', 'ROLE_RECEPTIONIST', 'ACCOUNTANT', 'ROLE_ACCOUNTANT')")
    public DashboardResponse getDashboardMetrics() {
        return dashboardService.getDashboardStats();
    }

    // Direct /stats alias endpoint
    @GetMapping("/stats")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN', 'DOCTOR', 'ROLE_DOCTOR', 'PHARMACIST', 'ROLE_PHARMACIST', 'NURSE', 'ROLE_NURSE', 'LAB_STAFF', 'ROLE_LAB_STAFF', 'RECEPTIONIST', 'ROLE_RECEPTIONIST', 'ACCOUNTANT', 'ROLE_ACCOUNTANT')")
    public DashboardResponse getDashboardStats() {
        return dashboardService.getDashboardStats();
    }
}
