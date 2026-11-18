package com.hospital.hms.repository;

import com.hospital.hms.entity.Doctor;
import com.hospital.hms.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Long> {

    // Find doctor by linked User
    Optional<Doctor> findByUser(User user);

    // Find doctor by linked User ID
    Optional<Doctor> findByUserId(Long userId);

    // Find doctor by linked User's username
    Optional<Doctor> findByUserUsername(String username);

    // Find doctor by professional email (case-insensitive)
    Optional<Doctor> findByEmailIgnoreCase(String email);

    // Find doctor by first and last name (case-insensitive)
    Optional<Doctor> findByFirstNameIgnoreCaseAndLastNameIgnoreCase(String firstName, String lastName);

    // Retrieve doctors by department ID
    List<Doctor> findByDepartmentId(Long departmentId);
}