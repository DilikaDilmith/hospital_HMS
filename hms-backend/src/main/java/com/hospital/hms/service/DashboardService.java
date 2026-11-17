package com.hospital.hms.service;

import com.hospital.hms.dto.DashboardResponse;
import com.hospital.hms.entity.*;
import com.hospital.hms.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private LabTestRepository labTestRepository;

    @Autowired
    private MedicineRepository medicineRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private InvoiceItemRepository invoiceItemRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private WardRepository wardRepository;

    @Autowired
    private BedRepository bedRepository;

    public DashboardResponse getDashboardStats() {
        DashboardResponse response = new DashboardResponse();

        // 1. Core Summary Metrics
        response.setTotalPatients(patientRepository.count());
        response.setTotalAppointments(appointmentRepository.count());
        response.setTotalLabRequests(labTestRepository.count());
        response.setPendingLabTests(labTestRepository.countByStatus(LabTestStatus.REQUESTED));
        response.setLowStockMedicines(medicineRepository.countByStockQuantityLessThan(50));

        // Requirement: Total Revenue is the sum of PAID invoices
        Double paidRevenue = invoiceRepository.getPaidRevenue();
        response.setTotalRevenue(paidRevenue != null ? paidRevenue : 0.0);

        Double totalBilled = invoiceRepository.getTotalRevenue();
        response.setTotalBilledRevenue(totalBilled != null ? totalBilled : 0.0);

        // 2. Hospital Operational Metrics
        response.setTotalDoctors(doctorRepository.count());
        response.setTotalEmployees(employeeRepository.count());
        
        LocalDate today = LocalDate.now();
        response.setStaffPresentToday(attendanceRepository.countByDateAndStatusNot(today, "ABSENT"));

        response.setTotalBeds(bedRepository.count());
        response.setOccupiedBeds(bedRepository.countByStatus(BedStatus.OCCUPIED));
        response.setAvailableBeds(bedRepository.countByStatus(BedStatus.AVAILABLE));

        // 3. Category Revenue Breakdown (CONSULTATION, LAB, PHARMACY, WARD)
        Map<String, double[]> categoryTotals = new HashMap<>();
        categoryTotals.put("CONSULTATION", new double[]{0.0, 0});
        categoryTotals.put("LAB", new double[]{0.0, 0});
        categoryTotals.put("PHARMACY", new double[]{0.0, 0});
        categoryTotals.put("WARD", new double[]{0.0, 0});

        List<InvoiceItem> allItems = invoiceItemRepository.findAll();
        for (InvoiceItem item : allItems) {
            String cat = item.getCategory() != null ? item.getCategory().toUpperCase() : "OTHER";
            categoryTotals.putIfAbsent(cat, new double[]{0.0, 0});
            categoryTotals.get(cat)[0] += (item.getAmount() != null ? item.getAmount() : 0.0);
            categoryTotals.get(cat)[1] += 1;
        }

        List<DashboardResponse.CategoryRevenueDto> catDtos = new ArrayList<>();
        categoryTotals.forEach((cat, values) -> {
            catDtos.add(new DashboardResponse.CategoryRevenueDto(cat, values[0], (long) values[1]));
        });
        response.setCategoryRevenue(catDtos);

        // 4. Appointment Status Distribution
        List<DashboardResponse.AppointmentStatusDto> aptDtos = new ArrayList<>();
        for (AppointmentStatus status : AppointmentStatus.values()) {
            long count = appointmentRepository.countByStatus(status);
            aptDtos.add(new DashboardResponse.AppointmentStatusDto(status.name(), count));
        }
        response.setAppointmentStats(aptDtos);

        // 5. Ward Bed Occupancy Breakdown
        List<Ward> wards = wardRepository.findAll();
        List<DashboardResponse.WardOccupancyDto> wardDtos = new ArrayList<>();
        for (Ward ward : wards) {
            List<Bed> beds = bedRepository.findByWardId(ward.getId());
            long total = beds.size();
            long occupied = beds.stream().filter(b -> b.getStatus() == BedStatus.OCCUPIED).count();
            long available = beds.stream().filter(b -> b.getStatus() == BedStatus.AVAILABLE).count();
            wardDtos.add(new DashboardResponse.WardOccupancyDto(ward.getName(), total, occupied, available));
        }
        response.setWardOccupancy(wardDtos);

        // 6. Monthly Revenue Trends (Past 6 Months from PAID invoices)
        List<Invoice> paidInvoices = invoiceRepository.findByStatus("PAID");
        Map<String, Double> monthlyMap = new LinkedHashMap<>();
        DateTimeFormatter monthFormatter = DateTimeFormatter.ofPattern("MMM yyyy");

        // Seed last 6 months in order
        for (int i = 5; i >= 0; i--) {
            LocalDate m = today.minusMonths(i);
            monthlyMap.put(m.format(monthFormatter), 0.0);
        }

        for (Invoice inv : paidInvoices) {
            if (inv.getDate() != null) {
                String key = inv.getDate().format(monthFormatter);
                monthlyMap.put(key, monthlyMap.getOrDefault(key, 0.0) + (inv.getTotalAmount() != null ? inv.getTotalAmount() : 0.0));
            }
        }

        List<DashboardResponse.MonthlyRevenueDto> monthlyDtos = monthlyMap.entrySet().stream()
                .map(e -> new DashboardResponse.MonthlyRevenueDto(e.getKey(), e.getValue()))
                .collect(Collectors.toList());
        response.setMonthlyRevenue(monthlyDtos);

        return response;
    }
}
