package com.hospital.hms.service;

import com.hospital.hms.entity.Medicine;
import com.hospital.hms.repository.MedicineRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MedicineService {

    @Autowired
    private MedicineRepository medicineRepository;

    // Add a new medicine to the inventory
    public Medicine addMedicine(Medicine medicine) {
        return medicineRepository.save(medicine);
    }

    // Retrieve all medicines in the inventory
    public List<Medicine> getAllMedicines() {
        return medicineRepository.findAll();
    }
}