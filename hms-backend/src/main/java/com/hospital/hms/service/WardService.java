package com.hospital.hms.service;

import com.hospital.hms.entity.Bed;
import com.hospital.hms.entity.BedStatus;
import com.hospital.hms.entity.Ward;
import com.hospital.hms.repository.BedRepository;
import com.hospital.hms.repository.WardRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class WardService {

    @Autowired
    private WardRepository wardRepository;

    @Autowired
    private BedRepository bedRepository;

    // Retrieve all wards with beds
    public List<Ward> getAllWards() {
        return wardRepository.findAll();
    }

    // Retrieve single ward by ID
    public Optional<Ward> getWardById(Long id) {
        return wardRepository.findById(id);
    }

    // Create a new hospital ward
    @Transactional
    public Ward createWard(Ward ward) {
        if (ward.getDailyRate() == null || ward.getDailyRate() <= 0) {
            ward.setDailyRate(2500.0);
        }
        return wardRepository.save(ward);
    }

    // Add a new bed to a ward
    @Transactional
    public Bed addBed(Long wardId, Bed bed) {
        Ward ward = wardRepository.findById(wardId)
                .orElseThrow(() -> new RuntimeException("Ward not found with ID: " + wardId));

        bed.setWard(ward);
        if (bed.getStatus() == null) {
            bed.setStatus(BedStatus.AVAILABLE);
        }
        if (bed.getDailyRate() == null || bed.getDailyRate() <= 0) {
            bed.setDailyRate(ward.getDailyRate());
        }

        return bedRepository.save(bed);
    }

    // Retrieve all beds across hospital
    public List<Bed> getAllBeds() {
        return bedRepository.findAll();
    }

    // Retrieve only available beds
    public List<Bed> getAvailableBeds() {
        return bedRepository.findByStatus(BedStatus.AVAILABLE);
    }

    // Update bed status (e.g. MAINTENANCE / AVAILABLE)
    @Transactional
    public Bed updateBedStatus(Long bedId, BedStatus status) {
        Bed bed = bedRepository.findById(bedId)
                .orElseThrow(() -> new RuntimeException("Bed not found with ID: " + bedId));
        bed.setStatus(status);
        return bedRepository.save(bed);
    }
}
