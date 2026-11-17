package com.hospital.hms.service;

import com.hospital.hms.entity.*;
import com.hospital.hms.repository.AdmissionRepository;
import com.hospital.hms.repository.BedRepository;
import com.hospital.hms.repository.DoctorRepository;
import com.hospital.hms.repository.PatientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Service
public class AdmissionService {

    @Autowired
    private AdmissionRepository admissionRepository;

    @Autowired
    private BedRepository bedRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private InvoiceService invoiceService;

    // Admit a patient to a hospital bed
    @Transactional
    public Admission admitPatient(Admission admission) {
        if (admission.getBed() == null || admission.getBed().getId() == null) {
            throw new IllegalArgumentException("A valid bed must be assigned for inpatient admission.");
        }

        Bed bed = bedRepository.findById(admission.getBed().getId())
                .orElseThrow(() -> new RuntimeException("Bed not found with ID: " + admission.getBed().getId()));

        if (bed.getStatus() != BedStatus.AVAILABLE) {
            throw new IllegalStateException("Bed " + bed.getBedNumber() + " is currently " + bed.getStatus() + " and cannot be assigned.");
        }

        Patient patient = patientRepository.findById(admission.getPatient().getId())
                .orElseThrow(() -> new RuntimeException("Patient not found with ID: " + admission.getPatient().getId()));

        Doctor doctor = doctorRepository.findById(admission.getDoctor().getId())
                .orElseThrow(() -> new RuntimeException("Doctor not found with ID: " + admission.getDoctor().getId()));

        admission.setPatient(patient);
        admission.setDoctor(doctor);
        admission.setBed(bed);

        if (admission.getAdmissionDate() == null) {
            admission.setAdmissionDate(LocalDateTime.now());
        }
        admission.setStatus(AdmissionStatus.ADMITTED);

        // Update Bed status to OCCUPIED
        bed.setStatus(BedStatus.OCCUPIED);
        bedRepository.save(bed);

        return admissionRepository.save(admission);
    }

    // Discharge a patient: calculate stay charges, auto-bill, and release bed to AVAILABLE
    @Transactional
    public Admission dischargePatient(Long admissionId, String dischargeNotes) {
        Admission admission = admissionRepository.findById(admissionId)
                .orElseThrow(() -> new RuntimeException("Admission record not found with ID: " + admissionId));

        if (admission.getStatus() == AdmissionStatus.DISCHARGED) {
            throw new IllegalStateException("Patient has already been discharged on " + admission.getDischargeDate());
        }

        LocalDateTime dischargeTime = LocalDateTime.now();
        admission.setDischargeDate(dischargeTime);
        admission.setDischargeNotes(dischargeNotes);
        admission.setStatus(AdmissionStatus.DISCHARGED);

        // Calculate days of stay (Minimum 1 day charged for same-day observation)
        long days = ChronoUnit.DAYS.between(admission.getAdmissionDate().toLocalDate(), dischargeTime.toLocalDate());
        if (days < 1) {
            days = 1;
        }

        Bed bed = admission.getBed();
        Double dailyRate = bed != null ? bed.getEffectiveDailyRate() : 2500.0;
        Double totalBedCharge = days * dailyRate;

        admission.setTotalDays(days);
        admission.setTotalBedCharge(totalBedCharge);

        // Set Bed status back to AVAILABLE
        if (bed != null) {
            bed.setStatus(BedStatus.AVAILABLE);
            bedRepository.save(bed);
        }

        Admission savedAdmission = admissionRepository.save(admission);

        // Auto-bill total bed accommodation charges to patient's active invoice
        if (admission.getPatient() != null && bed != null) {
            try {
                String wardName = bed.getWard() != null ? bed.getWard().getName() : "General Ward";
                invoiceService.addWardFee(
                        admission.getPatient(),
                        wardName,
                        bed.getBedNumber(),
                        days,
                        dailyRate,
                        totalBedCharge
                );
            } catch (Exception e) {
                System.err.println("⚠️ Warning during ward auto-billing: " + e.getMessage());
            }
        }

        return savedAdmission;
    }

    // Retrieve all admissions
    public List<Admission> getAllAdmissions() {
        return admissionRepository.findAllByOrderByAdmissionDateDesc();
    }

    // Retrieve currently admitted patients
    public List<Admission> getActiveAdmissions() {
        return admissionRepository.findByStatusOrderByAdmissionDateDesc(AdmissionStatus.ADMITTED);
    }

    // Retrieve single admission
    public Optional<Admission> getAdmissionById(Long id) {
        return admissionRepository.findById(id);
    }

    // Retrieve admissions for a patient
    public List<Admission> getAdmissionsByPatientId(Long patientId) {
        return admissionRepository.findByPatientIdOrderByAdmissionDateDesc(patientId);
    }
}
