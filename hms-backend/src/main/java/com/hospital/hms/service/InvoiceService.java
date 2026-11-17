package com.hospital.hms.service;

import com.hospital.hms.entity.Appointment;
import com.hospital.hms.entity.Doctor;
import com.hospital.hms.entity.Invoice;
import com.hospital.hms.entity.InvoiceItem;
import com.hospital.hms.entity.Patient;
import com.hospital.hms.repository.InvoiceItemRepository;
import com.hospital.hms.repository.InvoiceRepository;
import com.hospital.hms.repository.PatientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class InvoiceService {

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private InvoiceItemRepository invoiceItemRepository;

    @Autowired
    private PatientRepository patientRepository;

    // Retrieve all invoices ordered by latest first
    public List<Invoice> getAllInvoices() {
        return invoiceRepository.findAllByOrderByDateDesc();
    }

    // Retrieve single invoice by ID
    public Optional<Invoice> getInvoiceById(Long id) {
        return invoiceRepository.findById(id);
    }

    // Retrieve all invoices for a patient
    public List<Invoice> getInvoicesByPatientId(Long patientId) {
        return invoiceRepository.findByPatientIdOrderByDateDesc(patientId);
    }

    // Retrieve all invoices for an authenticated patient by username
    public List<Invoice> getInvoicesByPatientUsername(String username) {
        return invoiceRepository.findByPatientUserUsernameOrderByDateDesc(username);
    }

    // Create a new invoice
    @Transactional
    public Invoice createInvoice(Invoice invoice) {
        if (invoice.getPatient() != null && invoice.getPatient().getId() != null) {
            Patient patient = patientRepository.findById(invoice.getPatient().getId())
                    .orElseThrow(() -> new RuntimeException("Patient not found with ID: " + invoice.getPatient().getId()));
            invoice.setPatient(patient);
        }

        if (invoice.getDate() == null) {
            invoice.setDate(LocalDateTime.now());
        }

        if (invoice.getStatus() == null || invoice.getStatus().trim().isEmpty()) {
            invoice.setStatus("UNPAID");
        }

        invoice.recalculateTotal();
        return invoiceRepository.save(invoice);
    }

    // Add an itemized charge to an existing invoice
    @Transactional
    public Invoice addItemToInvoice(Long invoiceId, InvoiceItem item) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new RuntimeException("Invoice not found with ID: " + invoiceId));

        if (item.getCreatedAt() == null) {
            item.setCreatedAt(LocalDateTime.now());
        }

        invoice.addItem(item);
        return invoiceRepository.save(invoice);
    }

    // Mark an invoice as PAID
    @Transactional
    public Invoice markInvoiceAsPaid(Long invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new RuntimeException("Invoice not found with ID: " + invoiceId));

        invoice.setStatus("PAID");
        return invoiceRepository.save(invoice);
    }

    // Automatically add a Doctor's Consultation Fee for a specific Appointment with idempotency
    @Transactional
    public Invoice addConsultationFee(Appointment appointment) {
        if (appointment == null) {
            throw new IllegalArgumentException("Appointment cannot be null for consultation fee.");
        }
        if (appointment.getPatient() == null) {
            throw new IllegalArgumentException("Appointment patient cannot be null for consultation fee.");
        }
        if (appointment.getDoctor() == null) {
            throw new IllegalArgumentException("Appointment doctor cannot be null for consultation fee.");
        }

        // Idempotency check: verify this appointment hasn't already been billed
        if (appointment.getId() != null && invoiceItemRepository.existsByReferenceTypeAndReferenceId("APPOINTMENT", appointment.getId())) {
            System.out.println("⚠️ Consultation fee already billed for Appointment #" + appointment.getId() + ". Skipping duplicate charge.");
            return invoiceRepository.findFirstByPatientIdAndStatusOrderByIdDesc(appointment.getPatient().getId(), "UNPAID")
                    .orElse(null);
        }

        return addConsultationFee(appointment.getPatient(), appointment.getDoctor(), appointment.getId());
    }

    // Add consultation fee for a patient & doctor with originating appointmentId
    @Transactional
    public Invoice addConsultationFee(Patient patient, Doctor doctor, Long appointmentId) {
        if (patient == null || patient.getId() == null) {
            throw new IllegalArgumentException("Patient cannot be null for consultation fee.");
        }

        // Idempotency check: verify this appointment hasn't already been billed
        if (appointmentId != null && invoiceItemRepository.existsByReferenceTypeAndReferenceId("APPOINTMENT", appointmentId)) {
            System.out.println("⚠️ Consultation fee already billed for Appointment #" + appointmentId + ". Skipping duplicate charge.");
            return invoiceRepository.findFirstByPatientIdAndStatusOrderByIdDesc(patient.getId(), "UNPAID")
                    .orElse(null);
        }

        // Find or create active UNPAID invoice for patient
        Invoice invoice = invoiceRepository.findFirstByPatientIdAndStatusOrderByIdDesc(patient.getId(), "UNPAID")
                .orElseGet(() -> {
                    Invoice newInv = new Invoice();
                    newInv.setPatient(patient);
                    newInv.setStatus("UNPAID");
                    newInv.setDate(LocalDateTime.now());
                    newInv.setTotalAmount(0.0);
                    return invoiceRepository.save(newInv);
                });

        // Determine consultation fee
        Double fee = (doctor != null && doctor.getConsultationFee() != null && doctor.getConsultationFee() > 0)
                ? doctor.getConsultationFee()
                : 1500.0;

        String doctorInfo = (doctor != null)
                ? "Dr. " + doctor.getFirstName() + " " + doctor.getLastName() + (doctor.getSpecialization() != null ? " (" + doctor.getSpecialization() + ")" : "")
                : "Attending Physician";

        String desc = (appointmentId != null)
                ? "Consultation Fee - " + doctorInfo + " (Appointment #" + appointmentId + ")"
                : "Consultation Fee - " + doctorInfo;

        InvoiceItem consultationItem = new InvoiceItem();
        consultationItem.setInvoice(invoice);
        consultationItem.setCategory("CONSULTATION");
        consultationItem.setDescription(desc);
        consultationItem.setAmount(fee);
        consultationItem.setReferenceType("APPOINTMENT");
        consultationItem.setReferenceId(appointmentId);
        consultationItem.setCreatedAt(LocalDateTime.now());

        invoice.addItem(consultationItem);
        Invoice saved = invoiceRepository.save(invoice);
        System.out.println("✅ Added consultation fee of LKR " + fee + " to Invoice #" + saved.getId() + " for Patient " + patient.getFirstName() + " " + patient.getLastName());
        return saved;
    }

    // Automatically add a Doctor's Consultation Fee to the patient's active (UNPAID) invoice (backward compatibility)
    @Transactional
    public Invoice addConsultationFee(Patient patient, Doctor doctor) {
        return addConsultationFee(patient, doctor, null);
    }

    // Automatically add a Laboratory Test Fee to the patient's active (UNPAID) invoice
    @Transactional
    public Invoice addLabFee(Patient patient, com.hospital.hms.entity.LabTest labTest) {
        if (patient == null || patient.getId() == null) {
            throw new IllegalArgumentException("Patient cannot be null for lab test fee.");
        }

        Invoice invoice = invoiceRepository.findFirstByPatientIdAndStatusOrderByIdDesc(patient.getId(), "UNPAID")
                .orElseGet(() -> {
                    Invoice newInv = new Invoice();
                    newInv.setPatient(patient);
                    newInv.setStatus("UNPAID");
                    newInv.setDate(LocalDateTime.now());
                    newInv.setTotalAmount(0.0);
                    return invoiceRepository.save(newInv);
                });

        Double fee = (labTest != null && labTest.getTestFee() != null && labTest.getTestFee() > 0)
                ? labTest.getTestFee()
                : 2500.0;

        String testName = (labTest != null && labTest.getTestName() != null)
                ? labTest.getTestName()
                : "Diagnostic Lab Test";

        InvoiceItem labItem = new InvoiceItem();
        labItem.setInvoice(invoice);
        labItem.setCategory("LAB");
        labItem.setDescription("Laboratory Test - " + testName);
        labItem.setAmount(fee);
        labItem.setCreatedAt(LocalDateTime.now());

        invoice.addItem(labItem);
        Invoice saved = invoiceRepository.save(invoice);
        System.out.println("✅ Added Lab fee of LKR " + fee + " to Invoice #" + saved.getId() + " for Patient " + patient.getFirstName() + " " + patient.getLastName());
        return saved;
    }

    // Automatically add Pharmacy Dispensed Medication Charge to the patient's active (UNPAID) invoice
    @Transactional
    public Invoice addPharmacyFee(Patient patient, String medicineName, int quantity, Double totalAmount) {
        if (patient == null || patient.getId() == null) {
            throw new IllegalArgumentException("Patient cannot be null for pharmacy charges.");
        }

        Invoice invoice = invoiceRepository.findFirstByPatientIdAndStatusOrderByIdDesc(patient.getId(), "UNPAID")
                .orElseGet(() -> {
                    Invoice newInv = new Invoice();
                    newInv.setPatient(patient);
                    newInv.setStatus("UNPAID");
                    newInv.setDate(LocalDateTime.now());
                    newInv.setTotalAmount(0.0);
                    return invoiceRepository.save(newInv);
                });

        InvoiceItem pharmacyItem = new InvoiceItem();
        pharmacyItem.setInvoice(invoice);
        pharmacyItem.setCategory("PHARMACY");
        pharmacyItem.setDescription("Prescription Medication - " + medicineName + " (Qty: " + quantity + ")");
        pharmacyItem.setAmount(totalAmount != null ? totalAmount : 0.0);
        pharmacyItem.setCreatedAt(LocalDateTime.now());

        invoice.addItem(pharmacyItem);
        Invoice saved = invoiceRepository.save(invoice);
        System.out.println("✅ Added Pharmacy charge of LKR " + totalAmount + " to Invoice #" + saved.getId() + " for Patient " + patient.getFirstName() + " " + patient.getLastName());
        return saved;
    }

    // Automatically add Inpatient Ward Stay Accommodation Charge to patient's active (UNPAID) invoice
    @Transactional
    public Invoice addWardFee(Patient patient, String wardName, String bedNumber, long days, Double dailyRate, Double totalCharge) {
        if (patient == null || patient.getId() == null) {
            throw new IllegalArgumentException("Patient cannot be null for ward charges.");
        }

        Invoice invoice = invoiceRepository.findFirstByPatientIdAndStatusOrderByIdDesc(patient.getId(), "UNPAID")
                .orElseGet(() -> {
                    Invoice newInv = new Invoice();
                    newInv.setPatient(patient);
                    newInv.setStatus("UNPAID");
                    newInv.setDate(LocalDateTime.now());
                    newInv.setTotalAmount(0.0);
                    return invoiceRepository.save(newInv);
                });

        InvoiceItem wardItem = new InvoiceItem();
        wardItem.setInvoice(invoice);
        wardItem.setCategory("WARD");
        wardItem.setDescription("Inpatient Ward Stay (" + wardName + " - " + bedNumber + ") - " + days + " day(s) @ LKR " + String.format("%.2f", dailyRate) + "/day");
        wardItem.setAmount(totalCharge != null ? totalCharge : 0.0);
        wardItem.setCreatedAt(LocalDateTime.now());

        invoice.addItem(wardItem);
        Invoice saved = invoiceRepository.save(invoice);
        System.out.println("✅ Added Ward stay charge of LKR " + totalCharge + " to Invoice #" + saved.getId() + " for Patient " + patient.getFirstName() + " " + patient.getLastName());
        return saved;
    }

    // Delete invoice by ID
    @Transactional
    public void deleteInvoice(Long id) {
        invoiceRepository.deleteById(id);
    }
}
