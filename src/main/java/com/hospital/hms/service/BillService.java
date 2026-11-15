package com.hospital.hms.service;

import com.hospital.hms.entity.Bill;
import com.hospital.hms.repository.BillRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class BillService {

    @Autowired
    private BillRepository billRepository;

    // Generate a new bill for a patient
    public Bill generateBill(Bill bill) {
        // Automatically set the bill date to current time if not provided
        if (bill.getBillDate() == null) {
            bill.setBillDate(LocalDateTime.now());
        }
        return billRepository.save(bill);
    }

    // Retrieve all bills from the database
    public List<Bill> getAllBills() {
        return billRepository.findAll();
    }
}