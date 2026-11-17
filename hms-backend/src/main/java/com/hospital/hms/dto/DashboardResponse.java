package com.hospital.hms.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardResponse {
    // 1. Core Summary Metrics
    private long totalPatients;
    private long totalAppointments;
    private long todaysAppointments;
    private long totalLabRequests;
    private long pendingLabTests;
    private long lowStockMedicines;
    private double totalRevenue; // Sum of PAID invoices
    private double totalBilledRevenue; // Sum of all invoices (PAID + UNPAID)

    // 2. Additional Hospital Operational Metrics
    private long totalDoctors;
    private long totalEmployees;
    private long staffPresentToday;
    private long totalBeds;
    private long occupiedBeds;
    private long availableBeds;

    // 3. Chart Aggregations
    private List<CategoryRevenueDto> categoryRevenue = new ArrayList<>();
    private List<AppointmentStatusDto> appointmentStats = new ArrayList<>();
    private List<WardOccupancyDto> wardOccupancy = new ArrayList<>();
    private List<MonthlyRevenueDto> monthlyRevenue = new ArrayList<>();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryRevenueDto {
        private String category;
        private double amount;
        private long count;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AppointmentStatusDto {
        private String status;
        private long count;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WardOccupancyDto {
        private String wardName;
        private long totalBeds;
        private long occupiedBeds;
        private long availableBeds;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyRevenueDto {
        private String month;
        private double revenue;
    }
}
