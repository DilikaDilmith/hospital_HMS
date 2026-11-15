package com.hospital.hms.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardResponse {
    private long totalPatients;
    private long totalAppointments;
    private long pendingLabTests;
    private long lowStockMedicines;
    private double totalRevenue;
}