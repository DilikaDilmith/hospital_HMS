package com.hospital.hms.controller;

import com.hospital.hms.dto.DashboardResponse;
import com.hospital.hms.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    // Retrieve full dashboard metrics and report aggregations:
    // When called by a Doctor, scoped strictly to that doctor's appointments and treated patients
    @GetMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN', 'DOCTOR', 'ROLE_DOCTOR', 'PHARMACIST', 'ROLE_PHARMACIST', 'NURSE', 'ROLE_NURSE', 'LAB_STAFF', 'ROLE_LAB_STAFF', 'RECEPTIONIST', 'ROLE_RECEPTIONIST', 'ACCOUNTANT', 'ROLE_ACCOUNTANT')")
    public DashboardResponse getDashboardMetrics(Authentication authentication) {
        if (isCallerDoctorOnly(authentication)) {
            return dashboardService.getDoctorDashboardStats(authentication.getName());
        }
        return dashboardService.getDashboardStats();
    }

    public DashboardResponse getDashboardMetrics() {
        return getDashboardMetrics(null);
    }

    // Direct /stats alias endpoint
    @GetMapping("/stats")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN', 'DOCTOR', 'ROLE_DOCTOR', 'PHARMACIST', 'ROLE_PHARMACIST', 'NURSE', 'ROLE_NURSE', 'LAB_STAFF', 'ROLE_LAB_STAFF', 'RECEPTIONIST', 'ROLE_RECEPTIONIST', 'ACCOUNTANT', 'ROLE_ACCOUNTANT')")
    public DashboardResponse getDashboardStats(Authentication authentication) {
        return getDashboardMetrics(authentication);
    }

    // Explicit Doctor dashboard statistics endpoint
    @GetMapping({"/doctor", "/doctor/my"})
    @PreAuthorize("hasAnyAuthority('DOCTOR', 'ROLE_DOCTOR', 'ADMIN', 'ROLE_ADMIN')")
    public DashboardResponse getDoctorDashboardStats(Authentication authentication) {
        if (authentication == null) {
            return new DashboardResponse();
        }
        return dashboardService.getDoctorDashboardStats(authentication.getName());
    }

    public void setDashboardService(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    private boolean isCallerDoctorOnly(Authentication authentication) {
        if (authentication == null) return false;
        boolean hasDoctor = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("DOCTOR") || a.getAuthority().equals("ROLE_DOCTOR"));
        boolean hasAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().contains("ADMIN") || a.getAuthority().contains("RECEPTIONIST") || a.getAuthority().contains("ACCOUNTANT"));
        return hasDoctor && !hasAdmin;
    }
}
