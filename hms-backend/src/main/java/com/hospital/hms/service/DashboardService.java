package com.hospital.hms.service;

import com.hospital.hms.dto.DashboardResponse;
import com.hospital.hms.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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
    private BillRepository billRepository;

    // Gather all statistics for the admin/doctor dashboard
    public DashboardResponse getDashboardStats() {
        DashboardResponse response = new DashboardResponse();
        
        // 1. Get total number of patients
        response.setTotalPatients(patientRepository.count());
        
        // 2. Get total number of appointments
        response.setTotalAppointments(appointmentRepository.count());
        
        // 3. Get count of pending lab tests
        response.setPendingLabTests(labTestRepository.countByStatus("REQUESTED"));
        
        // 4. Get count of low stock medicines (less than 50 items)
        response.setLowStockMedicines(medicineRepository.countByStockQuantityLessThan(50));
        
        // 5. Get total revenue (Handle null if no bills exist yet)
        Double revenue = billRepository.getTotalRevenue();
        response.setTotalRevenue(revenue != null ? revenue : 0.0);

        return response;
    }
}