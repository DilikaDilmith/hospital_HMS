package com.hospital.hms.controller;

import com.hospital.hms.entity.Bill;
import com.hospital.hms.service.BillService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bills")
public class BillController {

    @Autowired
    private BillService billService;

    // Endpoint to generate a new bill
    @PostMapping
    public Bill generateBill(@RequestBody Bill bill) {
        return billService.generateBill(bill);
    }

    // Endpoint to retrieve all bills
    @GetMapping
    public List<Bill> getAllBills() {
        return billService.getAllBills();
    }
}