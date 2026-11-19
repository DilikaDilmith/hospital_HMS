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
        if (admission.getPatient() == null || admission.getPatient().getId() == null) {
            throw new IllegalArgumentException("A valid patient must be specified for inpatient admission.");
        }
        if (admission.getDoctor() == null || admission.getDoctor().getId() == null) {
            throw new IllegalArgumentException("An attending doctor must be assigned for inpatient admission.");
        }

        Long requestedBedId = admission.getBed().getId();
        Bed bed = bedRepository.findById(requestedBedId)
                .orElseGet(() -> bedRepository.findByIdForUpdate(requestedBedId)
                        .orElseThrow(() -> new IllegalArgumentException("Bed not found with ID: " + requestedBedId)));

        if (bed.getStatus() != BedStatus.AVAILABLE) {
            throw new IllegalStateException("Bed " + bed.getBedNumber() + " is currently " + bed.getStatus() + " and cannot be assigned.");
        }

        // Verify bed does not already have an active admission
        if (admissionRepository.existsByBedIdAndStatus(bed.getId(), AdmissionStatus.ADMITTED)) {
            throw new IllegalStateException("Bed " + bed.getBedNumber() + " already has an active inpatient admission.");
        }

        // Prevent admitting a patient who is already currently admitted
        if (admissionRepository.existsByPatientIdAndStatus(admission.getPatient().getId(), AdmissionStatus.ADMITTED)) {
            throw new IllegalStateException("Patient #" + admission.getPatient().getId() + " is already admitted to another bed.");
        }

        Patient patient = patientRepository.findById(admission.getPatient().getId())
                .orElseThrow(() -> new IllegalArgumentException("Patient not found with ID: " + admission.getPatient().getId()));

        Doctor doctor = doctorRepository.findById(admission.getDoctor().getId())
                .orElseThrow(() -> new IllegalArgumentException("Doctor not found with ID: " + admission.getDoctor().getId()));

        admission.setPatient(patient);
        admission.setDoctor(doctor);
        admission.setBed(bed);

        if (admission.getAdmissionDate() == null) {
            admission.setAdmissionDate(LocalDateTime.now());
        }
        admission.setStatus(AdmissionStatus.ADMITTED);
        admission.setIsBilled(false);

        // Update Bed status to OCCUPIED atomically within the transaction
        bed.setStatus(BedStatus.OCCUPIED);
        bedRepository.save(bed);

        return admissionRepository.save(admission);
    }

    // Discharge a patient: calculate stay charges, auto-bill, and release bed to AVAILABLE
    @Transactional
    public Admission dischargePatient(Long admissionId, String dischargeNotes) {
        Admission admission = admissionRepository.findById(admissionId)
                .orElseThrow(() -> new IllegalArgumentException("Admission record not found with ID: " + admissionId));

        if (admission.getStatus() == AdmissionStatus.DISCHARGED) {
            throw new IllegalStateException("Patient has already been discharged on " + admission.getDischargeDate());
        }
        if (admission.getStatus() != AdmissionStatus.ADMITTED) {
            throw new IllegalStateException("Admission #" + admissionId + " cannot be discharged because status is " + admission.getStatus());
        }

        LocalDateTime dischargeTime = LocalDateTime.now();
        admission.setDischargeDate(dischargeTime);
        admission.setDischargeNotes(dischargeNotes);
        admission.setStatus(AdmissionStatus.DISCHARGED);

        // Calculate days of stay (Minimum 1 day charged for same-day observation)
        LocalDateTime admissionTime = admission.getAdmissionDate() != null ? admission.getAdmissionDate() : dischargeTime.minusDays(1);
        long days = ChronoUnit.DAYS.between(admissionTime.toLocalDate(), dischargeTime.toLocalDate());
        if (days < 1) {
            days = 1;
        }

        Bed bed = admission.getBed();
        if (bed != null && bed.getId() != null) {
            Long bedId = bed.getId();
            Bed currentBed = bed;
            bed = bedRepository.findById(bedId)
                    .orElseGet(() -> bedRepository.findByIdForUpdate(bedId).orElse(currentBed));
            bed.setStatus(BedStatus.AVAILABLE);
            bedRepository.save(bed);
            admission.setBed(bed);
        }

        Double dailyRate = bed != null ? bed.getEffectiveDailyRate() : 2500.0;
        if (dailyRate == null || dailyRate <= 0) {
            dailyRate = 2500.0;
        }
        Double totalBedCharge = Math.round(days * dailyRate * 100.0) / 100.0;

        admission.setTotalDays(days);
        admission.setTotalBedCharge(totalBedCharge);

        // Auto-bill total bed accommodation charges to patient's active invoice idempotently
        if (admission.getPatient() != null && bed != null && !Boolean.TRUE.equals(admission.getIsBilled())) {
            String wardName = bed.getWard() != null ? bed.getWard().getName() : "General Ward";
            invoiceService.addWardFee(
                    admission.getPatient(),
                    admission.getId(),
                    wardName,
                    bed.getBedNumber(),
                    days,
                    dailyRate,
                    totalBedCharge
            );
            admission.setIsBilled(true);
        }

        return admissionRepository.save(admission);
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

    // Retrieve admissions for a patient by user username
    public List<Admission> getAdmissionsByPatientUsername(String username) {
        return admissionRepository.findByPatientUserUsernameOrderByAdmissionDateDesc(username);
    }
}
